const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const User = require("../models/User");

// Define storage for resume files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/resumes");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use user ID as part of filename to ensure uniqueness
    // and prevent overwriting other users' resumes
    const userId = req.user.id;
    const fileExt = path.extname(file.originalname);
    cb(null, `resume_${userId}${fileExt}`);
  },
});

// File filter to only allow PDFs and common document formats
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF, DOC, and DOCX files are allowed.")
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// @route   POST api/resume/upload
// @desc    Upload a resume
// @access  Private
router.post("/upload", auth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate the URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const filePath = `/uploads/resumes/${req.file.filename}`;
    const fileUrl = `${baseUrl}${filePath}`;

    // Update user document with resume info
    await User.findByIdAndUpdate(req.user.id, {
      resumeFile: filePath,
      resumeUrl: fileUrl,
    });

    res.json({
      message: "Resume uploaded successfully",
      fileUrl,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({ message: "Resume upload failed" });
  }
});

// @route   GET api/resume
// @desc    Get user's resume info
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "resumeFile resumeUrl"
    );

    if (!user.resumeFile) {
      return res.status(404).json({ message: "No resume found" });
    }

    res.json({
      resumeFile: user.resumeFile,
      fileUrl: user.resumeUrl,
    });
  } catch (error) {
    console.error("Error retrieving resume:", error);
    res.status(500).json({ message: "Failed to retrieve resume information" });
  }
});

// @route   DELETE api/resume
// @desc    Delete user's resume
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // If no resume, nothing to delete
    if (!user.resumeFile) {
      return res.status(404).json({ message: "No resume found" });
    }

    // Delete the file
    const filePath = path.join(__dirname, "..", user.resumeFile);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update user document
    user.resumeFile = undefined;
    user.resumeUrl = undefined;
    await user.save();

    res.json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("Error deleting resume:", error);
    res.status(500).json({ message: "Failed to delete resume" });
  }
});

// @route   GET api/resume/public
// @desc    Get resume URL (public access)
// @access  Public
router.get("/public", async (req, res) => {
  try {
    // Find the first admin user who has a resume file
    const user = await User.findOne({
      resumeFile: { $exists: true, $ne: null },
      resumeUrl: { $exists: true, $ne: null },
    }).select("resumeUrl");

    if (!user || !user.resumeUrl) {
      return res.status(404).json({ message: "No resume found" });
    }

    res.json({
      fileUrl: user.resumeUrl,
    });
  } catch (error) {
    console.error("Error retrieving public resume:", error);
    res.status(500).json({ message: "Failed to retrieve resume information" });
  }
});

module.exports = router;
