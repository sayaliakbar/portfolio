const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

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

/**
 * Generate a 2FA secret
 * @param {string} username Username for the account
 * @param {string} issuer Name of the issuer/app
 * @returns {Object} 2FA secret data
 */
const generate2FASecret = (username, issuer = "PortfolioApp") => {
  const secret = speakeasy.generateSecret({
    name: `${issuer}:${username}`,
    issuer: issuer,
  });

  return secret;
};

/**
 * Generate QR code for 2FA setup
 * @param {string} otpAuthUrl The OTP auth URL
 * @returns {Promise<string>} QR code as data URL
 */
const generateQRCode = async (otpAuthUrl) => {
  return qrcode.toDataURL(otpAuthUrl);
};

/**
 * Verify 2FA token
 * @param {string} token Token provided by user
 * @param {string} secret Secret key
 * @returns {boolean} Whether the token is valid
 */
const verify2FAToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1, // Allow a margin of 1 time step (30 seconds)
  });
};

/**
 * Generate backup codes for 2FA
 * @param {number} count Number of backup codes to generate
 * @returns {Array<string>} Array of backup codes
 */
const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex");
    codes.push(code);
  }
  return codes;
};

/**
 * Hash backup codes for storage
 * @param {Array<string>} codes Array of backup codes
 * @returns {Promise<Array<string>>} Array of hashed backup codes
 */
const hashBackupCodes = async (codes) => {
  const hashedCodes = [];
  for (const code of codes) {
    const hashedCode = await hashPassword(code, 10);
    hashedCodes.push(hashedCode);
  }
  return hashedCodes;
};

/**
 * Verify backup code
 * @param {string} providedCode Code provided by user
 * @param {Array<string>} hashedCodes Array of hashed backup codes
 * @returns {Promise<{isValid: boolean, index: number|null}>} Validation result and index of used code if valid
 */
const verifyBackupCode = async (providedCode, hashedCodes) => {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await comparePassword(providedCode, hashedCodes[i]);
    if (isMatch) {
      return { isValid: true, index: i };
    }
  }
  return { isValid: false, index: null };
};

module.exports = {
  generateSecureSecret,
  hashPassword,
  comparePassword,
  generateSecureToken,
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
};
