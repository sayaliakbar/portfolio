const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const auth = require("../middleware/auth");

// GET all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET featured projects
router.get("/featured", async (req, res) => {
  try {
    const projects = await Project.find({ featured: true }).sort({
      createdAt: -1,
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single project
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new project
router.post("/", auth, async (req, res) => {
  const project = new Project({
    title: req.body.title,
    description: req.body.description,
    image: req.body.image,
    imagePublicId: req.body.imagePublicId,
    technologies: req.body.technologies,
    github: req.body.github,
    demo: req.body.demo,
    featured: req.body.featured,
  });

  try {
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT (update) a project
router.put("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update fields
    project.title = req.body.title;
    project.description = req.body.description;
    project.image = req.body.image;
    project.imagePublicId = req.body.imagePublicId;
    project.technologies = req.body.technologies;
    project.github = req.body.github;
    project.demo = req.body.demo;
    project.featured = req.body.featured;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a project
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete the associated image from Cloudinary if it exists
    if (project.imagePublicId) {
      try {
        const { cloudinary } = require("../config/cloudinary");

        // Attempt to delete the image
        const result = await cloudinary.uploader.destroy(project.imagePublicId);
        console.log(
          `Deleted image with public ID ${project.imagePublicId}, Result:`,
          result
        );
      } catch (imageError) {
        console.error(
          `Error deleting image ${project.imagePublicId} from Cloudinary:`,
          imageError
        );
        console.error(imageError.stack);
        // Continue with project deletion even if image deletion fails
      }
    } else {
      console.log("No image to delete - imagePublicId is null or undefined");
    }

    // Delete the project from the database
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Error deleting project:", err);
    console.error(err.stack);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
