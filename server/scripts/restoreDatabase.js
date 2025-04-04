const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const readline = require("readline");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Get MongoDB connection string from environment variables
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/portfolio";

// Path to backup directory
const backupDir = path.join(__dirname, "../backups");

// Check if the backup directory exists
if (!fs.existsSync(backupDir)) {
  console.error("Backup directory does not exist!");
  process.exit(1);
}

// Get list of available backups
const backups = fs
  .readdirSync(backupDir)
  .filter((file) => file.endsWith(".gz"))
  .sort()
  .reverse();

if (backups.length === 0) {
  console.error("No backup files found!");
  process.exit(1);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Display list of available backups
console.log("\nAvailable backups:");
backups.forEach((backup, index) => {
  console.log(`${index + 1}. ${backup}`);
});

// Prompt user to select a backup
rl.question(
  "\nEnter the number of the backup to restore (or 0 to exit): ",
  (answer) => {
    const backupIndex = parseInt(answer, 10) - 1;

    if (
      isNaN(backupIndex) ||
      backupIndex < 0 ||
      backupIndex >= backups.length
    ) {
      console.log("Invalid selection or cancelled.");
      rl.close();
      return;
    }

    const selectedBackup = backups[backupIndex];
    const backupFilePath = path.join(backupDir, selectedBackup);

    // Confirm restoration
    rl.question(
      `\nAre you sure you want to restore from ${selectedBackup}? This will OVERWRITE the current database. (y/N): `,
      (confirmation) => {
        if (confirmation.toLowerCase() !== "y") {
          console.log("Restoration cancelled.");
          rl.close();
          return;
        }

        console.log(`\nRestoring database from ${selectedBackup}...`);

        // Build the mongorestore command
        const mongoRestoreCommand = `mongorestore --uri="${MONGO_URI}" --gzip --archive="${backupFilePath}" --drop`;

        // Execute the mongorestore command
        exec(mongoRestoreCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error during restoration: ${error.message}`);
            rl.close();
            return;
          }

          if (stderr) {
            console.log(`Restoration stderr: ${stderr}`);
          }

          console.log("Database restoration completed successfully.");
          rl.close();
        });
      }
    );
  }
);
