const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for message logs
const messageLogStream = fs.createWriteStream(
  path.join(logsDir, "messages.log"),
  { flags: "a" }
);

// Custom middleware for logging message-related operations
const messageLogger = (req, res, next) => {
  // Only log for message routes
  if (req.path.includes("/messages")) {
    const originalSend = res.send;
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    // Log request information
    const requestLog = `[${timestamp}] ${method} ${url} FROM ${ip}\n`;
    messageLogStream.write(requestLog);

    // Intercept the response to log its status and content
    res.send = function (body) {
      // Log response information
      const responseStatus = res.statusCode;
      let responseLog = `[${timestamp}] RESPONSE: ${responseStatus}\n`;

      // Log summary of response body (if JSON)
      try {
        const parsedBody = typeof body === "string" ? JSON.parse(body) : body;
        responseLog += `  SUCCESS: ${!!parsedBody.success}\n`;

        if (parsedBody.emailError) {
          responseLog += `  EMAIL ERROR: Message saved but email sending failed\n`;
        }

        if (!parsedBody.success && parsedBody.message) {
          responseLog += `  ERROR: ${parsedBody.message}\n`;
        }
      } catch (e) {
        // Not JSON or couldn't parse
        responseLog += `  BODY: [unparseable]\n`;
      }

      responseLog += "------------------------\n";
      messageLogStream.write(responseLog);

      // Continue with the original send
      originalSend.call(this, body);
    };
  }

  next();
};

module.exports = {
  messageLogger,
};
