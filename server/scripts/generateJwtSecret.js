const { generateSecureSecret } = require("../utils/securityUtils");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Generate a new JWT secret
const jwtSecret = generateSecureSecret();

console.log("Generated new JWT secret");

// Read the existing .env file
const envFilePath = path.join(__dirname, "../.env");
let envContent = fs.readFileSync(envFilePath, "utf8");

// Replace the JWT_SECRET line with the new secret
envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);

// Write the updated content back to the .env file
fs.writeFileSync(envFilePath, envContent);

console.log(
  "JWT_SECRET in .env file has been updated with a secure random value."
);
console.log("Make sure to keep this secret safe and do not share it.");
console.log(
  "Remember that changing the JWT_SECRET will invalidate all existing tokens!"
);
