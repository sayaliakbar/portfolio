const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const requireAuth = require("../middleware/auth");

dotenv.config();

// Define a noop stream to use in production environment
const noopStream = {
  write: () => {}, // Do nothing function
  end: () => {}, // Do nothing function
};

// Function to log email service status
const logEmailServiceStatus = (status, details = null) => {
  const timestamp = new Date().toISOString();
  let logStream = noopStream;

  // Only try to create log files in development environment
  if (process.env.NODE_ENV !== "production") {
    try {
      // Ensure logs directory exists
      const logsDir = path.join(__dirname, "../logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      logStream = fs.createWriteStream(
        path.join(logsDir, "email-service.log"),
        { flags: "a" }
      );
    } catch (error) {
      console.warn("Could not create log files:", error.message);
      // Fallback to console logging in development
      logStream = {
        write: (message) => console.log(message),
        end: () => {},
      };
    }
  }

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
  service: process.env.EMAIL_SERVICE,
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

// GET all messages (admin only)
router.get("/", requireAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
});

// GET unread message count (admin only)
router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ isRead: false });
    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
});

// PATCH mark message as read (admin only)
router.patch("/:id/read", requireAuth, async (req, res) => {
  const messageId = req.params.id;
  console.log(`PATCH: Marking message as read: ${messageId}`);

  if (!messageId || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log(`Invalid message ID format: ${messageId}`);
    return res.status(400).json({
      success: false,
      message: "Invalid message ID format",
    });
  }

  try {
    console.log("User authenticated:", req.user.id);

    // Check if message exists first
    let messageExists;
    try {
      messageExists = await Message.findById(messageId);
      console.log("Message found:", !!messageExists);
    } catch (findError) {
      console.error("Error finding message:", findError);
      return res.status(500).json({
        success: false,
        message: "Error finding message",
        error: findError.message,
      });
    }

    if (!messageExists) {
      console.log(`Message not found: ${messageId}`);
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    console.log("Original message isRead status:", messageExists.isRead);

    // Update the message
    let message;
    try {
      message = await Message.findByIdAndUpdate(
        messageId,
        { isRead: true },
        { new: true }
      );
      console.log(`Message marked as read:`, message);
      console.log(`New isRead status:`, message.isRead);
    } catch (updateError) {
      console.error("Error updating message:", updateError);
      return res.status(500).json({
        success: false,
        message: "Error updating message",
        error: updateError.message,
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update message status",
      error: error.message,
    });
  }
});

// POST mark message as read (admin only) - alternative to PATCH for clients that don't support PATCH
router.post("/:id/read", requireAuth, async (req, res) => {
  const messageId = req.params.id;
  console.log(`POST: Marking message as read: ${messageId}`);

  if (!messageId || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
    console.log(`Invalid message ID format: ${messageId}`);
    return res.status(400).json({
      success: false,
      message: "Invalid message ID format",
    });
  }

  try {
    console.log("User authenticated:", req.user.id);

    // Check if message exists first
    let messageExists;
    try {
      messageExists = await Message.findById(messageId);
      console.log("Message found:", !!messageExists);
    } catch (findError) {
      console.error("Error finding message:", findError);
      return res.status(500).json({
        success: false,
        message: "Error finding message",
        error: findError.message,
      });
    }

    if (!messageExists) {
      console.log(`Message not found: ${messageId}`);
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    console.log("Original message isRead status:", messageExists.isRead);

    // Update the message
    let message;
    try {
      message = await Message.findByIdAndUpdate(
        messageId,
        { isRead: true },
        { new: true }
      );
      console.log(`Message marked as read:`, message);
      console.log(`New isRead status:`, message.isRead);
    } catch (updateError) {
      console.error("Error updating message:", updateError);
      return res.status(500).json({
        success: false,
        message: "Error updating message",
        error: updateError.message,
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update message status",
      error: error.message,
    });
  }
});

// DELETE a message (admin only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
});

module.exports = router;
