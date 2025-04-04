const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Standard auth middleware for protected routes
module.exports = async function (req, res, next) {
  console.log("Auth middleware running for:", req.method, req.originalUrl);

  // Get token from header
  const token = req.header("x-auth-token");
  console.log("Token present:", !!token);

  // Check if not token
  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully, user ID:", decoded.user.id);

    // Check token expiration (JWT verify handles this, but we're being explicit)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log("Token expired, current time:", now, "expiry:", decoded.exp);
      return res.status(401).json({ message: "Token has expired" });
    }

    // Add user from payload
    req.user = decoded.user;

    // Check if user exists and update in req object
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken -twoFactorSecret -twoFactorBackupCodes"
    );
    if (!user) {
      console.log("User not found in database:", req.user.id);
      return res.status(401).json({ message: "User not found" });
    }
    console.log("User found:", user.username);

    // Add full user object to request
    req.userObj = user;
    console.log("Auth middleware completed successfully");

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    if (err.name === "JsonWebTokenError") {
      console.log("Invalid token provided:", token.substring(0, 10) + "...");
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
