const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables - use path.resolve to ensure we get the right .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// After environment variables are loaded, import modules that use them
const Project = require("../models/Project");
const { cloudinary } = require("../config/cloudinary");

// Double-check Cloudinary configuration

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    cleanupOrphanedImages();
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

/**
 * Fetches all images from Cloudinary and compares them with images in the database
 * to identify and delete orphaned images
 */
async function cleanupOrphanedImages() {
  try {
    // Get all projects and their image public IDs
    const projects = await Project.find({}, "imagePublicId");
    const projectImageIds = projects
      .map((project) => project.imagePublicId)
      .filter((id) => id !== null && id !== undefined);

    // Get all images from Cloudinary in the portfolio/projects folder
    const { resources } = await cloudinary.api.resources({
      type: "upload",
      prefix: "portfolio/projects",
      max_results: 500,
    });

    // Find orphaned images (images in Cloudinary but not in any project)
    const orphanedImages = resources.filter((resource) => {
      return !projectImageIds.includes(resource.public_id);
    });

    if (orphanedImages.length > 0) {
      console.log(
        "Orphaned images to delete:",
        orphanedImages.map((img) => img.public_id)
      );
    }

    // Delete orphaned images
    let deletedCount = 0;
    for (const image of orphanedImages) {
      await cloudinary.uploader.destroy(image.public_id);
      deletedCount++;
    }

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning up orphaned images:", error);
    console.error(error.stack);
    mongoose.disconnect();
    process.exit(1);
  }
}
