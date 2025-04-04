const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Standard auth middleware for protected routes
module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiration (JWT verify handles this, but we're being explicit)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ message: "Token has expired" });
    }

    // Add user from payload
    req.user = decoded.user;

    // Check if user exists and update in req object
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken -twoFactorSecret -twoFactorBackupCodes"
    );
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add full user object to request
    req.userObj = user;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Check 2FA verification status
exports.require2FA = function (req, res, next) {
  if (!req.userObj.twoFactorEnabled) {
    // 2FA not enabled, proceed
    return next();
  }

  // Check if 2FA is verified for this session
  const twoFAVerified = req.session && req.session.twoFAVerified;

  if (!twoFAVerified) {
    return res.status(403).json({
      message: "2FA verification required",
      requiresTwoFactor: true,
    });
  }

  next();
};

// Verify refresh token and issue new access token
exports.refreshToken = async function (req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Check if refresh token is expired
    if (!user.verifyRefreshToken(refreshToken)) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Generate new access token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }, // Shorter expiry for access token
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error("Refresh token error:", err.message);
    res.status(500).send("Server error");
  }
};
