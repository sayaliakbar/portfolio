const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const morgan = require("morgan");
const { apiLimiter } = require("../middleware/rateLimiter");
const corsOptions = require("../config/corsOptions");
const { messageLogger } = require("../middleware/logger");
const connectDB = require("../config/database");
const setupAdminUser = require("../scripts/setupAdmin");

// Routes
const projectRoutes = require("../routes/projects");
const messageRoutes = require("../routes/messages");
const authRoutes = require("../routes/auth");
const uploadRoutes = require("../routes/uploads");
const resumeRoutes = require("../routes/resume");

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Enable trust proxy to properly handle requests behind a reverse proxy
// This is needed for express-rate-limit to work correctly with X-Forwarded-For headers
app.set('trust proxy', 1);

// Define a noop stream to use in production environment
const noopStream = {
  write: () => {}, // Do nothing function
  end: () => {}, // Do nothing function
};

// Configure access logging based on environment
let accessLogStream = noopStream;

// Only create log directories and files in development environment
if (process.env.NODE_ENV !== "production") {
  try {
    // Create a logs directory for morgan if it doesn't exist
    const logsDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create a write stream for access logs
    accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
      flags: "a",
    });
  } catch (error) {
    console.warn("Could not create log files:", error.message);
    // Fallback to console logging in development
    accessLogStream = {
      write: (message) => console.log(message),
    };
  }
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limit JSON body size for security
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Configure Morgan logger based on environment
if (process.env.NODE_ENV === "production") {
  // Use common format for production but log to console instead of file
  app.use(morgan("common"));
} else {
  // Use dev format for development console output
  app.use(morgan("dev"));
  // Also log to file in dev mode with more details
  app.use(morgan("combined", { stream: accessLogStream }));
}

// Custom message logger
app.use(messageLogger);

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/resume", resumeRoutes);

// Health check route
app.get("/", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      name: mongoose.connection.name || "Unknown",
    },
  });
});

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
connectDB()
  .then(async () => {
    console.log("Database connection established successfully");

    // Set up admin user if it doesn't exist
    try {
      await setupAdminUser();
    } catch (error) {
      console.error("Error during admin setup:", error);
    }
  })
  .catch((err) => {
    console.error("Could not connect to database:", err);
    process.exit(1);
  });

// Production setup
if (process.env.NODE_ENV === "production") {
  // Serve static files
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });

  // Check if SSL certificate and key exist
  const sslOptions = {
    key: fs.existsSync("./ssl/private.key")
      ? fs.readFileSync("./ssl/private.key")
      : null,
    cert: fs.existsSync("./ssl/certificate.crt")
      ? fs.readFileSync("./ssl/certificate.crt")
      : null,
  };

  // Start HTTPS server if SSL is configured
  if (sslOptions.key && sslOptions.cert) {
    https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
      console.log(`HTTPS server running on port ${HTTPS_PORT}`);
    });

    // Redirect HTTP to HTTPS
    http
      .createServer((req, res) => {
        res.writeHead(301, {
          Location: `https://${req.headers.host.split(":")[0]}:${HTTPS_PORT}${
            req.url
          }`,
        });
        res.end();
      })
      .listen(PORT, () => {
        console.log(`HTTP redirect server running on port ${PORT}`);
      });
  } else {
    // Fallback to HTTP if no SSL certificates are found
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (HTTP)`);
    });
  }
} else {
  // Development - just use HTTP
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
