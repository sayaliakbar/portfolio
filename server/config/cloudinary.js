const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "portfolio/projects",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 1200, height: 630, crop: "limit" }],
  },
});

// Create multer uploader
const upload = multer({ storage });

module.exports = {
  cloudinary,
  upload,
};
