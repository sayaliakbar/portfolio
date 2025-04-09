const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const User = require("../models/User");
const { generateSecureToken } = require("../utils/securityUtils");

// @route   POST api/auth/login
// @desc    Authenticate user
// @access  Public
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });

    // If no user with that username
    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Check if account is locked due to too many failed attempts
    if (user.isLocked()) {
      return res.status(423).json({
        msg: "Account is temporarily locked. Please try again later.",
        lockUntil: user.lockUntil,
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Reset login attempts on successful login
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          loginAttempts: 0,
          lastLogin: new Date(),
        },
        $unset: { lockUntil: 1 },
      }
    );

    // Generate refresh token
    const refreshToken = generateSecureToken();

    // Store refresh token with the user
    await user.updateRefreshToken(refreshToken);

    // Create token payload
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || "1d",
          user: {
            id: user._id,
            username: user.username,
            role: user.role,
          },
        });
      }
    );
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    // Get user from database without password
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route   POST api/auth/register
// @desc    Register a new admin user (restricted)
// @access  Private/Admin
router.post("/register", auth, async (req, res) => {
  // Only admins can create new users
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Not authorized to create users" });
  }

  try {
    const { username, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create new user
    user = new User({
      username,
      password,
      role: role || "admin", // Default to admin role
    });

    // Save user to database
    await user.save();

    res.status(201).json({ msg: "User created successfully" });
  } catch (error) {
    console.error("Error in registration:", error);
    if (error.message.includes("Password must be")) {
      return res.status(400).json({ msg: error.message });
    }
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route   POST api/auth/logout
// @desc    Invalidate refresh token (client should remove JWT)
// @access  Private
router.post("/logout", auth, async (req, res) => {
  try {
    // Find user and clear their refresh token
    await User.updateOne(
      { _id: req.user.id },
      { $set: { refreshToken: null, refreshTokenExpiry: null } }
    );

    res.json({ msg: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route   POST api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ msg: "Refresh token is required" });
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(401).json({ msg: "Invalid refresh token" });
    }

    // Verify refresh token is not expired
    if (!user.verifyRefreshToken(refreshToken)) {
      return res.status(401).json({ msg: "Refresh token expired" });
    }

    // Create new token payload
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };

    // Generate new JWT access token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
