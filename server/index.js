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
const { apiLimiter } = require("./middleware/rateLimiter");
const corsOptions = require("./config/corsOptions");

// Routes
const projectRoutes = require("./routes/projects");
const messageRoutes = require("./routes/messages");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/uploads");

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 60 * 60 * 24, // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limit JSON body size for security
app.use(session(sessionConfig));

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

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
