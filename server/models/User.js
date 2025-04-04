const mongoose = require("mongoose");
const { hashPassword, comparePassword } = require("../utils/securityUtils");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // 2FA fields
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  twoFactorBackupCodes: {
    type: [String],
    default: [],
  },
  // Refresh token fields
  refreshToken: {
    type: String,
    default: null,
  },
  refreshTokenExpiry: {
    type: Date,
    default: null,
  },
  // Existing fields
  role: {
    type: String,
    default: "admin",
    enum: ["admin"],
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(this.password)) {
      throw new Error(
        "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
    }

    // Use stronger hashing with 12 salt rounds
    this.password = await hashPassword(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return comparePassword(candidatePassword, this.password);
};

// Method to handle failed login attempts
UserSchema.methods.incrementLoginAttempts = async function () {
  // If lock has expired, reset login attempts
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  // Otherwise increment login attempts
  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account if more than 5 attempts
  if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
    // Lock for 1 hour
    updates.$set = { lockUntil: new Date(Date.now() + 3600000) };
  }

  return this.updateOne(updates);
};

// Method to check if account is locked
UserSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

// Method to update refresh token
UserSchema.methods.updateRefreshToken = async function (token, expiryDays = 7) {
  return this.updateOne({
    refreshToken: token,
    refreshTokenExpiry: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
  });
};

// Method to verify refresh token
UserSchema.methods.verifyRefreshToken = function (token) {
  return this.refreshToken === token && this.refreshTokenExpiry > new Date();
};

module.exports = mongoose.model("User", UserSchema);
