const rateLimit = require("express-rate-limit");

// Basic rate limiter for all API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later",
  },
});

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // increase to 10 to allow database locking to happen first
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many login attempts from this IP. Please try again later.",
  },
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

// Even stricter limiter for registration
const registerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each IP to 3 registration attempts per day
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many registration attempts, please try again later",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter,
};
