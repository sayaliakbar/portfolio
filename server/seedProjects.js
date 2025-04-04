const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Project = require("./models/Project");

// Load environment variables
dotenv.config();

// Sample projects data
const projectsData = [
  {
    title: "Portfolio Website",
    description:
      "A modern portfolio website built with React, Node.js, and MongoDB to showcase my projects and skills.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"],
    github: "https://github.com/yourusername/portfolio",
    demo: "https://yourportfolio.com",
    featured: true,
  },
  {
    title: "E-Commerce Platform",
    description:
      "A full-featured e-commerce platform with product management, cart functionality, and payment processing.",
    image:
      "https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Node.js", "Express", "MongoDB", "Redux"],
    github: "https://github.com/yourusername/ecommerce",
    demo: "https://yourecommerce.com",
    featured: true,
  },
  {
    title: "Task Management App",
    description:
      "A collaborative task management application with real-time updates and team workspaces.",
    image:
      "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Node.js", "Socket.io", "MongoDB"],
    github: "https://github.com/yourusername/taskmanager",
    demo: "https://yourtaskapp.com",
    featured: true,
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    seedProjects();
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Seed projects function
const seedProjects = async () => {
  try {
    // Clear existing projects
    await Project.deleteMany({});

    // Insert new projects
    await Project.insertMany(projectsData);

    console.log("Projects have been seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding projects:", error);
    process.exit(1);
  }
};
