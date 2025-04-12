import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { FaServer, FaDatabase, FaReact } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import Section from "../components/Section";
import ProjectCard from "../components/ProjectCard";
import SkillCard from "../components/SkillCard";
import ContactForm from "../components/ContactForm";
import Button from "../components/Button";
import ResumeButton from "../components/ResumeButton";
// Import API utilities
import { fetchProjects } from "../utils/api";
// Import the portfolio projects data as fallback
import portfolioProjects from "../data/portfolio.projects.json";

import heroImage from "../assets/hero.png";

const HomePage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Try to fetch from API first
        const data = await fetchProjects();
        // Filter for featured projects
        const featuredProjects = data.filter(
          (project) => project.featured === true
        );
        setProjects(featuredProjects);
      } catch (error) {
        // If API fails, use the JSON file and filter for featured projects
        console.log("Using placeholder projects data:", error);
        const featuredProjects = portfolioProjects.filter(
          (project) => project.featured === true
        );
        setProjects(featuredProjects);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Handle scrolling when navigated from another page
  useEffect(() => {
    // Check if we need to scroll to a specific section
    if (location.state && location.state.scrollToId) {
      const targetId = location.state.scrollToId;
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // Add a small delay to ensure the page is fully loaded
        setTimeout(() => {
          window.scrollTo({
            top: targetElement.offsetTop - 80, // Adjust for navbar height
            behavior: "smooth",
          });
        }, 100);
      }

      // Clear the state to prevent scrolling on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Skills data
  const skills = [
    { icon: FaReact, name: "Frontend Development", level: 90 },
    { icon: FaServer, name: "Backend Development", level: 85 },
    { icon: FaDatabase, name: "Database Management", level: 80 },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-screen sm:min-h-[85vh] flex items-center relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white">
        <div
          id="home"
          className="container grid md:grid-cols-2 gap-8 items-center py-12 md:py-20"
        >
          <Motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              MERN Stack Developer
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-600 mb-6">
              Building modern web applications with MongoDB, Express, React, and
              Node.js
            </h2>
            <p className="text-gray-600 mb-8">
              I create responsive, user-friendly applications with clean code
              and modern best practices.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button to="#projects" variant="primary">
                View My Work
              </Button>
              <Button to="#contact" variant="outline">
                Contact Me
              </Button>
            </div>
            <div className="flex space-x-4 mt-8">
              <Motion.a
                href="https://github.com/sayaliakbar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="GitHub Profile"
              >
                <FaGithub size={24} />
              </Motion.a>
              <Motion.a
                href="https://linkedin.com/in/sayaliakbar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="LinkedIn Profile"
              >
                <FaLinkedin size={24} />
              </Motion.a>
              <Motion.a
                href="https://x.com/sayaliakbar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Twitter Profile"
              >
                <FaTwitter size={24} />
              </Motion.a>
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:block"
          >
            <img
              src={heroImage}
              alt="Developer"
              className="rounded-lg shadow-lg w-full h-auto object-cover"
            />
          </Motion.div>
        </div>

        {/* Decorative elements */}
        <Motion.div
          className="absolute -bottom-16 -right-16 sm:-bottom-32 sm:-right-32 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut",
          }}
        />
        <Motion.div
          className="absolute top-20 -left-16 sm:-left-24 w-24 sm:w-32 h-24 sm:h-32 bg-sky-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </section>

      {/* About Section */}
      <Section
        id="about"
        title="About Me"
        subtitle="Learn more about my background and what drives me as a developer"
        light={true}
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <Motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4">My Journey</h3>
            <p className="text-gray-600 mb-4">
              As a passionate MERN stack developer, I've dedicated myself to
              mastering the art of creating seamless web applications. My
              journey began with a curiosity about how websites work, which
              evolved into a deep understanding of the full development
              lifecycle.
            </p>
            <p className="text-gray-600 mb-4">
              I specialize in building robust and scalable applications using
              MongoDB, Express.js, React, and Node.js. My approach combines
              technical expertise with creative problem-solving to deliver
              exceptional user experiences.
            </p>
            <div className="mt-6">
              <ResumeButton />
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Key Qualifications</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="h-6 w-6 flex-shrink-0 text-indigo-500 mr-2">
                    ✓
                  </span>
                  <span>Expert in React with Redux for state management</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 flex-shrink-0 text-indigo-500 mr-2">
                    ✓
                  </span>
                  <span>Node.js and Express API development</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 flex-shrink-0 text-indigo-500 mr-2">
                    ✓
                  </span>
                  <span>MongoDB database design and optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 flex-shrink-0 text-indigo-500 mr-2">
                    ✓
                  </span>
                  <span>Responsive UI/UX design implementation</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 flex-shrink-0 text-indigo-500 mr-2">
                    ✓
                  </span>
                  <span>RESTful API architecture and integration</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 flex-shrink-0 text-indigo-500 mr-2">
                    ✓
                  </span>
                  <span>Authentication and security best practices</span>
                </li>
              </ul>
            </div>
          </Motion.div>
        </div>
      </Section>

      {/* Skills Section */}
      <Section
        id="skills"
        title="My Skills"
        subtitle="Technologies and tools I work with"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
            <SkillCard key={index} skill={skill} index={index} />
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "HTML/CSS",
            "JavaScript",
            "React",
            "Node.js",
            "Express",
            "MongoDB",
            "Redux",
            "Git",
          ].map((tech, index) => (
            <Motion.div
              key={index}
              className="bg-white py-3 px-4 rounded-lg shadow-sm text-center"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <span className="font-medium">{tech}</span>
            </Motion.div>
          ))}
        </div>
      </Section>

      {/* Projects Section */}
      <Section
        id="projects"
        title="Featured Projects"
        subtitle="Check out some of my recent work"
        light={true}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={project._id} project={project} index={index} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button to="/projects" variant="outline">
            View All Projects
          </Button>
        </div>
      </Section>

      {/* Contact Section */}
      <Section
        id="contact"
        title="Get In Touch"
        subtitle="Have a question or want to work together? Reach out to me!"
      >
        <div className="grid md:grid-cols-2 gap-12">
          <Motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4">Contact Information</h3>
            <p className="text-gray-600 mb-6">
              I'm currently available for freelance work or full-time positions.
              If you have a project that needs coding expertise, don't hesitate
              to reach out.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-indigo-600 ml-1.75 mr-3.5">📍</span>
                <div>
                  <h4 className="font-medium">Location</h4>
                  <p className="text-gray-600">Quetta, Pakistan</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-indigo-600 mr-3">📧</span>
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p className="text-gray-600">
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=sayaliakbar@gmail.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      sayaliakbar@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <ContactForm />
          </Motion.div>
        </div>
      </Section>
    </div>
  );
};

export default HomePage;
