const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Function to log email service status
const logEmailServiceStatus = (status, details = null) => {
  const timestamp = new Date().toISOString();
  const logStream = fs.createWriteStream(
    path.join(logsDir, "email-service.log"),
    { flags: "a" }
  );

  let logMessage = `[${timestamp}] EMAIL SERVICE STATUS: ${status}\n`;
  if (details) {
    logMessage += `DETAILS: ${JSON.stringify(details)}\n`;
  }
  logMessage += "------------------------\n";

  logStream.write(logMessage);
  logStream.end();
};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: true, // Use SSL/TLS
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    console.error("Email service error:", error);
    logEmailServiceStatus("ERROR", error);
  } else {
    console.log("Email service is ready to send messages");
    logEmailServiceStatus("READY");
  }
});

// POST a new message - fully async/await with proper error handling
router.post("/", async (req, res) => {
  // Create a new message document
  const message = new Message({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    message: req.body.message,
  });

  try {
    // Save to database
    const newMessage = await message.save();

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: `Portfolio Contact: ${req.body.subject}`,
      html: `
        <h3>New contact message from your portfolio</h3>
        <p><strong>Name:</strong> ${req.body.name}</p>
        <p><strong>Email:</strong> ${req.body.email}</p>
        <p><strong>Subject:</strong> ${req.body.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${req.body.message}</p>
      `,
    };

    try {
      // Send email and wait for it to complete
      logEmailServiceStatus("SENDING", {
        to: process.env.EMAIL_USER,
        subject: `Portfolio Contact: ${req.body.subject}`,
        from: req.body.email,
      });

      await transporter.sendMail(mailOptions);

      logEmailServiceStatus("SENT_SUCCESS", {
        to: process.env.EMAIL_USER,
        subject: `Portfolio Contact: ${req.body.subject}`,
        from: req.body.email,
      });

      // If we reach here, both database save and email sending succeeded
      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      });
    } catch (emailError) {
      // Email sending failed - log error and send specific response
      console.error("Error sending email notification:", emailError);
      logEmailServiceStatus("SENT_FAILURE", {
        error: emailError.message,
        to: process.env.EMAIL_USER,
        subject: `Portfolio Contact: ${req.body.subject}`,
        from: req.body.email,
      });

      // Still return success since we saved to database, but indicate email failure
      res.status(201).json({
        success: true,
        message: "Message saved, but email notification failed",
        emailError: true,
        data: newMessage,
      });
    }
  } catch (dbError) {
    // Database save failed
    console.error("Error saving message to database:", dbError);
    res.status(500).json({
      success: false,
      message: "Failed to save your message",
      error: dbError.message,
    });
  }
});

module.exports = router;
