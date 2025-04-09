const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/**
 * Generate a secure random string for use as JWT secret
 * @param {number} length Length of the random string
 * @returns {string} A cryptographically secure random string
 */
const generateSecureSecret = (length = 64) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash a password with bcrypt
 * @param {string} password The plain text password
 * @param {number} saltRounds Number of salt rounds (defaults to 12)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, saltRounds = 12) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 * @param {string} password The plain text password
 * @param {string} hash The hashed password
 * @returns {Promise<boolean>} True if password matches
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a secure token for password reset, email verification, etc.
 * @returns {string} A secure token
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = {
  generateSecureSecret,
  hashPassword,
  comparePassword,
  generateSecureToken,
};
