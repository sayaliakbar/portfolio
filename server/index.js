const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const morgan = require("morgan");
const { apiLimiter } = require("./middleware/rateLimiter");
const corsOptions = require("./config/corsOptions");
const { messageLogger } = require("./middleware/logger");
const connectDB = require("./config/database");

// Routes
const projectRoutes = require("./routes/projects");
const messageRoutes = require("./routes/messages");
const authRoutes = require("./routes/auth");
const auth0Routes = require("./routes/auth0");
const cloudflareRoutes = require("./routes/cloudflareAccess");
const uploadRoutes = require("./routes/uploads");
const resumeRoutes = require("./routes/resume");

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Create a logs directory for morgan if it doesn't exist
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 60 * 60 * 24, // 1 day
    touchAfter: 24 * 3600, // time period in seconds to refresh session
    crypto: {
      secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    },
    autoRemove: "native", // Use MongoDB's TTL index
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: "strict",
  },
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limit JSON body size for security
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(session(sessionConfig));

// Configure Morgan logger based on environment
if (process.env.NODE_ENV === "production") {
  // Use common format for production and log to file
  app.use(morgan("common", { stream: accessLogStream }));
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
app.use("/api/auth0", auth0Routes);
app.use("/api/cloudflare", cloudflareRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/resume", resumeRoutes);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
connectDB()
  .then(() => {
    console.log("Database connection established successfully");
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
