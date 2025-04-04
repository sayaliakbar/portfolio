// List of allowed origins
const allowedOrigins = [
  // Local development
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5173",

  // Production domains - replace with your actual domain in production
  "https://yourportfolio.com",
  "https://www.yourportfolio.com",

  // Add additional domains as needed
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true, // Allow cookies to be sent with requests
  maxAge: 86400, // Cache preflight request for 24 hours
};

module.exports = corsOptions;
