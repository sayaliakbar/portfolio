const express = require("express");
const router = express.Router();
const validateCloudflareAccess = require("../middleware/cloudflareAccess");

// @route   GET api/cloudflare/me
// @desc    Get the authenticated user's profile from Cloudflare Access
// @access  Private (Cloudflare Access)
router.get("/me", validateCloudflareAccess, async (req, res) => {
  try {
    // Cloudflare user info is added by the middleware
    res.json({
      email: req.cloudflareUser.email,
      name: req.cloudflareUser.name,
      // Include other fields from the Cloudflare Access JWT if needed
      // These fields depend on the identity provider you're using with Cloudflare Access
      accessGroups: req.cloudflareAccess.groups || [],
      identityProvider: req.cloudflareAccess.iss || "unknown",
    });
  } catch (error) {
    console.error("Error getting Cloudflare user:", error);
    res.status(500).send("Server error");
  }
});

// @route   GET api/cloudflare/check-admin
// @desc    Check if the user is an admin based on Cloudflare Access groups
// @access  Private (Cloudflare Access)
router.get("/check-admin", validateCloudflareAccess, async (req, res) => {
  try {
    // Check if user has admin group in Cloudflare Access
    // The group names should match what you've set up in your Cloudflare Access policy
    const isAdmin = (req.cloudflareAccess.groups || []).includes("admin");

    res.json({
      isAdmin,
      groups: req.cloudflareAccess.groups || [],
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
