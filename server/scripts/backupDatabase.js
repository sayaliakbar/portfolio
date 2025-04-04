const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Get MongoDB connection string from environment variables
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/portfolio";

// Parse the connection string to get database name
const dbName = MONGO_URI.split("/").pop().split("?")[0];

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, "../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Create a timestamped filename for the backup
const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
const backupFilePath = path.join(backupDir, `${dbName}-${timestamp}.gz`);

// Build the mongodump command
const mongoDumpCommand = `mongodump --uri="${MONGO_URI}" --gzip --archive="${backupFilePath}"`;

console.log("Starting database backup...");

// Execute the mongodump command
exec(mongoDumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error during backup: ${error.message}`);
    return;
  }

  if (stderr) {
    console.log(`Backup stderr: ${stderr}`);
  }

  console.log(`Database backup completed successfully: ${backupFilePath}`);

  // Cleanup old backups - keep only the last 5
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      console.error(`Error reading backup directory: ${err.message}`);
      return;
    }

    // Filter for database backups and sort by date (newest first)
    const backups = files
      .filter((file) => file.startsWith(dbName) && file.endsWith(".gz"))
      .sort()
      .reverse();

    // Delete older backups (keep the last 5)
    if (backups.length > 5) {
      backups.slice(5).forEach((oldBackup) => {
        fs.unlink(path.join(backupDir, oldBackup), (err) => {
          if (err) {
            console.error(
              `Error deleting old backup ${oldBackup}: ${err.message}`
            );
          } else {
            console.log(`Deleted old backup: ${oldBackup}`);
          }
        });
      });
    }
  });
});
