import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import Section from "../components/Section";
import ProjectCard from "../components/ProjectCard";
import { fetchProjects } from "../utils/api";
// Import the MongoDB exported JSON data
import portfolioProjects from "../data/portfolio.projects.json";

// Use the imported JSON file as placeholder data
const placeholderProjects = portfolioProjects;

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
        console.log("Using placeholder projects data:", error);
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
        <Motion.div
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
        </Motion.div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {allTechnologies.map((tech, index) => (
            <Motion.button
              key={index}
              onClick={() => handleFilter(tech)}
              className={`px-4 py-2 rounded-full cursor-pointer transition-all ${
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
            </Motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <Motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
          >
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  index={index}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">
                  No projects found with the selected filter.
                </p>
              </div>
            )}
          </Motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
