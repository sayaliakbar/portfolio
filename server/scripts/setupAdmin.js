const mongoose = require("mongoose");
const User = require("../models/User");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

/**
 * Creates an admin user if one doesn't already exist
 */
const setupAdminUser = async () => {
  try {
    // Check if we have any admin user
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin user already exists, skipping creation.");
      return;
    }

    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error("Admin credentials not found in environment variables.");
      return;
    }

    // Create new admin user
    const newAdmin = new User({
      username: adminUsername,
      password: adminPassword,
      role: "admin",
    });

    await newAdmin.save();
    console.log(`Admin user '${adminUsername}' created successfully.`);
  } catch (error) {
    console.error("Error setting up admin user:", error);
  }
};

module.exports = setupAdminUser;
