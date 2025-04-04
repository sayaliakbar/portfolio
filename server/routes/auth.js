const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const {
  comparePassword,
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  generateSecureToken,
} = require("../utils/securityUtils");

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", authLimiter, async (req, res) => {
  const { username, password } = req.body;

  console.log(`Login attempt for username: ${username}`);

  try {
    // See if user exists
    let user = await User.findOne({ username });
    if (!user) {
      console.log(`Login failed: User ${username} not found`);
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - new Date()) / 60000);
      console.log(
        `Login blocked: Account ${username} is locked until ${user.lockUntil}`
      );
      return res.status(403).json({
        message: `Account is locked. Try again in ${lockTime} minutes.`,
      });
    }

    // Log current login attempts
    console.log(
      `Current login attempts for ${username}: ${
        user.loginAttempts
      }, lockUntil: ${user.lockUntil || "not set"}`
    );

    // Check password
    const isMatch = await user.comparePassword(password);
    if (isMatch) {
      // Password matched - reset login attempts and set last login
      const updateResult = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            loginAttempts: 0,
            lockUntil: null,
            lastLogin: new Date(),
          },
        },
        { new: true }
      );

      console.log(
        `Successful login for ${username}, updated lastLogin: ${updateResult.lastLogin}`
      );

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Return a temporary token to identify the user for 2FA verification
        const tempPayload = {
          temp: true,
          userId: user.id,
        };

        const tempToken = jwt.sign(
          tempPayload,
          process.env.JWT_SECRET,
          { expiresIn: "5m" } // Short expiry for 2FA step
        );

        return res.json({
          requiresTwoFactor: true,
          tempToken,
        });
      }

      // Generate access token and refresh token
      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      // Generate refresh token
      const refreshToken = generateSecureToken();

      // Save refresh token to database with expiry
      await user.updateRefreshToken(refreshToken);

      // Generate access token with shorter expiry
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            refreshToken,
          });
        }
      );
    } else {
      // Increment login attempts
      await user.incrementLoginAttempts();

      // Refetch the user to get the updated login attempts and lockUntil values
      const updatedUser = await User.findById(user._id);
      console.log(
        `Failed login: Attempts increased to ${
          updatedUser.loginAttempts
        }, lockUntil: ${updatedUser.lockUntil || "not set"}`
      );

      // If account is now locked, inform the user
      if (updatedUser.isLocked()) {
        const lockTime = Math.ceil(
          (updatedUser.lockUntil - new Date()) / 60000
        );
        console.log(
          `Account ${username} is now locked for ${lockTime} minutes`
        );
        return res.status(403).json({
          message: `Account is locked due to too many failed attempts. Try again in ${lockTime} minutes.`,
        });
      } else if (updatedUser.loginAttempts >= 3) {
        // Warn user they're getting close to being locked
        return res.status(400).json({
          message: `Invalid credentials. ${
            5 - updatedUser.loginAttempts
          } attempts remaining before account is locked.`,
        });
      }

      return res.status(400).json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/verify-2fa
// @desc    Verify 2FA code and complete login
// @access  Public (with temporary token)
router.post("/verify-2fa", authLimiter, async (req, res) => {
  const { tempToken, code, isBackupCode } = req.body;

  if (!tempToken || !code) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

    if (!decoded.temp || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    let isValid = false;
    let usedBackupCodeIndex = null;

    // Check if using backup code or regular 2FA code
    if (isBackupCode) {
      // Verify backup code
      const result = await verifyBackupCode(code, user.twoFactorBackupCodes);
      isValid = result.isValid;
      usedBackupCodeIndex = result.index;
    } else {
      // Verify TOTP code
      isValid = verify2FAToken(code, user.twoFactorSecret);
    }

    if (!isValid) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    // If backup code was used, remove it
    if (isBackupCode && usedBackupCodeIndex !== null) {
      const backupCodes = [...user.twoFactorBackupCodes];
      backupCodes.splice(usedBackupCodeIndex, 1);
      await User.findByIdAndUpdate(user._id, {
        twoFactorBackupCodes: backupCodes,
      });
    }

    // Generate tokens
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Generate refresh token
    const refreshToken = generateSecureToken();

    // Save refresh token to database
    await user.updateRefreshToken(refreshToken);

    // Generate access token with shorter expiry
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          refreshToken,
        });
      }
    );
  } catch (err) {
    console.error("2FA verification error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Verification session expired" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public (with refresh token)
router.post("/refresh", authLimiter, async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Check if refresh token is expired
    if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
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
    console.error("Refresh token error:", err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/auth
// @desc    Get user data
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken -twoFactorSecret -twoFactorBackupCodes"
    );
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/auth/register
// @desc    Register initial admin user (should be disabled after first use in production)
// @access  Public
router.post("/register", authLimiter, async (req, res) => {
  // This should be secured or disabled in production
  const { username, password } = req.body;

  // In production, check against environment variables or another secure method
  const isValidSetup =
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD;

  if (!isValidSetup) {
    return res
      .status(401)
      .json({ message: "Unauthorized to create admin account" });
  }

  try {
    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin user already exists" });
    }

    const user = new User({
      username,
      password,
      role: "admin",
    });

    await user.save();

    // Generate refresh token
    const refreshToken = generateSecureToken();

    // Save refresh token to database
    await user.updateRefreshToken(refreshToken);

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, refreshToken });
      }
    );
  } catch (err) {
    console.error(err.message);

    // Handle password strength validation error
    if (err.message.includes("Password must be")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/setup-2fa
// @desc    Setup 2FA for user
// @access  Private
router.post("/setup-2fa", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new secret
    const secret = generate2FASecret(user.username, "PortfolioApp");

    // Generate QR code
    const qrCode = await generateQRCode(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Save secret and backup codes to user
    user.twoFactorSecret = secret.base32;
    user.twoFactorBackupCodes = hashedBackupCodes;
    // Don't enable 2FA yet - will be enabled after verification
    await user.save();

    res.json({
      secret: secret.base32,
      qrCode,
      backupCodes,
    });
  } catch (err) {
    console.error("2FA setup error:", err);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/verify-setup-2fa
// @desc    Verify and enable 2FA
// @access  Private
router.post("/verify-setup-2fa", auth, async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Verification code required" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify token
    const isValid = verify2FAToken(token, user.twoFactorSecret);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({
      message: "Two-factor authentication enabled successfully",
    });
  } catch (err) {
    console.error("2FA verification error:", err);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/disable-2fa
// @desc    Disable 2FA
// @access  Private
router.post("/disable-2fa", auth, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res
      .status(400)
      .json({ message: "Password required to disable 2FA" });
  }

  try {
    const user = await User.findById(req.user.id);

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({
      message: "Two-factor authentication disabled successfully",
    });
  } catch (err) {
    console.error("Disable 2FA error:", err);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/logout
// @desc    Invalidate refresh token
// @access  Private
router.post("/logout", auth, async (req, res) => {
  try {
    // Clear the refresh token
    await User.findByIdAndUpdate(req.user.id, {
      refreshToken: null,
      refreshTokenExpiry: null,
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/auth/my-ip
// @desc    Get your current IP address (development only)
// @access  Public (but should be disabled in production)
router.get("/my-ip", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }

  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    "Could not detect IP";

  console.log(`IP address check: ${ip}`);

  res.json({
    ip,
    message: "Add this IP to your .env file's ALLOWED_ADMIN_IPS variable",
  });
});

module.exports = router;
