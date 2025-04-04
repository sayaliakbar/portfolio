import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Section from "../components/Section";
import ProjectCard from "../components/ProjectCard";
import { fetchProjects } from "../utils/api";

// Import the same placeholder projects as in Home.jsx
const placeholderProjects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description:
      "A full-featured e-commerce platform with product management, cart functionality, and payment processing.",
    image:
      "https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Node.js", "Express", "MongoDB", "Redux"],
    github: "https://github.com",
    demo: "https://example.com",
    featured: true,
  },
  {
    id: 2,
    title: "Task Management App",
    description:
      "A collaborative task management application with real-time updates and team workspaces.",
    image:
      "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Node.js", "Socket.io", "MongoDB"],
    github: "https://github.com",
    demo: "https://example.com",
    featured: true,
  },
  {
    id: 3,
    title: "Social Media Dashboard",
    description:
      "A dashboard for managing and analyzing social media accounts across multiple platforms.",
    image:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Node.js", "Chart.js", "Express"],
    github: "https://github.com",
    demo: "https://example.com",
    featured: true,
  },
  {
    id: 4,
    title: "Weather Application",
    description:
      "A weather forecast app that displays current and future weather conditions based on location.",
    image:
      "https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "API Integration", "Geolocation", "Chart.js"],
    github: "https://github.com",
    demo: "https://example.com",
  },
  {
    id: 5,
    title: "Recipe Finder",
    description:
      "An application that allows users to search for recipes based on ingredients, dietary restrictions, and cuisine type.",
    image:
      "https://images.unsplash.com/photo-1466637574441-749b8f19452f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Node.js", "MongoDB", "Express"],
    github: "https://github.com",
    demo: "https://example.com",
  },
  {
    id: 6,
    title: "Budget Tracker",
    description:
      "A personal finance application to track income, expenses, and savings goals with visualization.",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
    technologies: ["React", "Chart.js", "Local Storage", "Tailwind CSS"],
    github: "https://github.com",
    demo: "https://example.com",
  },
];

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Try to fetch from API first
        const data = await fetchProjects();
        setProjects(data);
        setFilteredProjects(data);
      } catch (error) {
        // If API fails, use placeholder data
        console.log("Using placeholder projects data");
        setProjects(placeholderProjects);
        setFilteredProjects(placeholderProjects);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleFilter = (filter) => {
    setActiveFilter(filter);

    if (filter === "all") {
      setFilteredProjects(projects);
      return;
    }

    // Filter projects based on technologies
    const filtered = projects.filter((project) =>
      project.technologies.some((tech) =>
        tech.toLowerCase().includes(filter.toLowerCase())
      )
    );

    setFilteredProjects(filtered);
  };

  // Get unique technologies from all projects
  const allTechnologies = ["all"];
  projects.forEach((project) => {
    project.technologies.forEach((tech) => {
      const simplifiedTech = tech.split(".")[0]; // Get the base technology name
      if (!allTechnologies.includes(simplifiedTech)) {
        allTechnologies.push(simplifiedTech);
      }
    });
  });

  return (
    <div className="py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">My Projects</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A collection of my work showcasing my skills in MERN stack
            development. Browse through my projects to see examples of my
            technical abilities and creative problem-solving.
          </p>

          <div className="mt-8">
            <Link
              to="/"
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </motion.div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {allTechnologies.map((tech, index) => (
            <motion.button
              key={index}
              onClick={() => handleFilter(tech)}
              className={`px-4 py-2 rounded-full transition-all ${
                activeFilter === tech
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {tech.charAt(0).toUpperCase() + tech.slice(1)}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
          >
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">
                  No projects found with the selected filter.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
