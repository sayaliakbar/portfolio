const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const auth = require("../middleware/auth");

// @route   POST api/uploads/image
// @desc    Upload a project image to cloudinary
// @access  Private
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    // Return the cloudinary URL of the uploaded image
    res.json({
      imageUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    console.error(error.stack);
    res.status(500).json({ message: "Image upload failed" });
  }
});

// @route   DELETE api/uploads/image/:publicId
// @desc    Delete an image from cloudinary
// @access  Private
router.delete("/image/:publicId", auth, async (req, res) => {
  try {
    const { cloudinary } = require("../config/cloudinary");
    const publicId = req.params.publicId;

    // Delete the image from cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error(`Image deletion error for ID ${req.params.publicId}:`, error);
    console.error(error.stack);
    res.status(500).json({ message: "Image deletion failed" });
  }
});

module.exports = router;
