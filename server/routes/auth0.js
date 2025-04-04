const express = require("express");
const router = express.Router();
const auth0Middleware = require("../middleware/auth0");

// @route   GET api/auth0/me
// @desc    Get the authenticated user's profile
// @access  Private (Auth0)
router.get("/me", auth0Middleware, async (req, res) => {
  try {
    // The user info is already validated in the auth0Middleware
    // Auth0 user info is in req.auth
    const userInfo = {
      sub: req.auth.sub,
      email: req.auth.email,
      name: req.auth.name || req.auth.nickname || req.auth.email,
      picture: req.auth.picture,
    };

    res.json(userInfo);
  } catch (error) {
    console.error("Error getting Auth0 profile:", error);
    res.status(500).send("Server error");
  }
});

// @route   GET api/auth0/permissions
// @desc    Get the authenticated user's permissions
// @access  Private (Auth0)
router.get("/permissions", auth0Middleware, async (req, res) => {
  try {
    // Auth0 permissions are usually stored in req.auth.permissions
    const permissions = req.auth.permissions || [];

    // Check if the user has admin permissions
    // This assumes you've set up Auth0 roles and permissions
    const isAdmin =
      permissions.includes("admin:access") ||
      (req.auth[`${process.env.AUTH0_AUDIENCE}/roles`] || []).includes("admin");

    res.json({
      permissions,
      isAdmin,
    });
  } catch (error) {
    console.error("Error getting Auth0 permissions:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
