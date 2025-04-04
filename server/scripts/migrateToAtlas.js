const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Models
const Project = require("../models/Project");
const User = require("../models/User");
const Message = require("../models/Message");

// MongoDB Atlas URI - Get from environment variables
const ATLAS_URI = process.env.MONGO_URI;

// Replace this with your local MongoDB URI
const LOCAL_URI = "mongodb://localhost:27017/portfolio";

// Function to export data from local database
async function exportData() {
  try {
    console.log("Connecting to local MongoDB...");
    await mongoose.connect(LOCAL_URI);

    console.log("Fetching data from local database...");

    // Fetch all data from collections
    const projects = await Project.find({});
    const users = await User.find({});
    const messages = await Message.find({});

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, "../backups/migration");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save data to JSON files
    fs.writeFileSync(
      path.join(backupDir, "projects.json"),
      JSON.stringify(projects, null, 2)
    );

    fs.writeFileSync(
      path.join(backupDir, "users.json"),
      JSON.stringify(users, null, 2)
    );

    fs.writeFileSync(
      path.join(backupDir, "messages.json"),
      JSON.stringify(messages, null, 2)
    );

    console.log(`Data exported to ${backupDir}`);

    // Close connection
    await mongoose.connection.close();
    console.log("Connection to local MongoDB closed");

    return { projects, users, messages };
  } catch (error) {
    console.error("Error exporting data:", error);
    process.exit(1);
  }
}

// Function to import data to MongoDB Atlas
async function importData(data) {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(ATLAS_URI, connectionOptions);

    console.log("Importing data to MongoDB Atlas...");

    // Clear existing data (optional - be careful with this in production)
    if (process.argv.includes("--clear")) {
      console.log("Clearing existing data...");
      await Project.deleteMany({});
      await User.deleteMany({});
      await Message.deleteMany({});
    }

    // Import data
    if (data.projects && data.projects.length > 0) {
      await Project.insertMany(data.projects);
      console.log(`Imported ${data.projects.length} projects`);
    }

    if (data.users && data.users.length > 0) {
      await User.insertMany(data.users);
      console.log(`Imported ${data.users.length} users`);
    }

    if (data.messages && data.messages.length > 0) {
      await Message.insertMany(data.messages);
      console.log(`Imported ${data.messages.length} messages`);
    }

    console.log("Data import complete!");

    // Close connection
    await mongoose.connection.close();
    console.log("Connection to MongoDB Atlas closed");
  } catch (error) {
    console.error("Error importing data:", error);
    process.exit(1);
  }
}

// Function to import from backup files
async function importFromBackup() {
  try {
    const backupDir = path.join(__dirname, "../backups/migration");

    // Check if backup files exist
    if (!fs.existsSync(path.join(backupDir, "projects.json"))) {
      console.error("Backup files not found. Run export first.");
      process.exit(1);
    }

    // Read data from backup files
    const projects = JSON.parse(
      fs.readFileSync(path.join(backupDir, "projects.json"))
    );
    const users = JSON.parse(
      fs.readFileSync(path.join(backupDir, "users.json"))
    );
    const messages = JSON.parse(
      fs.readFileSync(path.join(backupDir, "messages.json"))
    );

    await importData({ projects, users, messages });
  } catch (error) {
    console.error("Error importing from backup:", error);
    process.exit(1);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--export")) {
    await exportData();
  } else if (args.includes("--import")) {
    await importFromBackup();
  } else if (args.includes("--full")) {
    const data = await exportData();
    await importData(data);
  } else {
    console.log(
      "Usage: node migrateToAtlas.js [--export|--import|--full] [--clear]"
    );
    console.log("  --export: Export data from local MongoDB to backup files");
    console.log("  --import: Import data from backup files to MongoDB Atlas");
    console.log(
      "  --full: Export data and import to MongoDB Atlas in one step"
    );
    console.log(
      "  --clear: Clear existing data in MongoDB Atlas before import"
    );
  }

  process.exit(0);
}

main();
