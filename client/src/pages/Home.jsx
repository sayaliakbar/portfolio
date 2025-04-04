import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { FaServer, FaDatabase, FaReact } from "react-icons/fa";
import Section from "../components/Section";
import ProjectCard from "../components/ProjectCard";
import SkillCard from "../components/SkillCard";
import ContactForm from "../components/ContactForm";
import Button from "../components/Button";
import { fetchFeaturedProjects } from "../utils/api";

// Temporary placeholder image until you add your own
const heroImage =
  "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1064&q=80";

const HomePage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Try to fetch from API first
        const data = await fetchFeaturedProjects();
        setProjects(data);
      } catch (error) {
        // If API fails, use placeholder data
        console.log("Using placeholder projects data");
        setProjects(placeholderProjects);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Skills data
  const skills = [
    { icon: FaReact, name: "Frontend Development", level: 90 },
    { icon: FaServer, name: "Backend Development", level: 85 },
    { icon: FaDatabase, name: "Database Management", level: 80 },
  ];

  // Placeholder projects (fallback if API fails)
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
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white">
        <div
          id="home"
          className="container grid md:grid-cols-2 gap-8 items-center py-20"
        >
          <motion.div
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
              <Button to="/#projects" variant="primary">
                View My Work
              </Button>
              <Button to="/#contact" variant="outline">
                Contact Me
              </Button>
            </div>
            <div className="flex space-x-4 mt-8">
              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="GitHub Profile"
              >
                <FaGithub size={24} />
              </motion.a>
              <motion.a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="LinkedIn Profile"
              >
                <FaLinkedin size={24} />
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Twitter Profile"
              >
                <FaTwitter size={24} />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
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
          </motion.div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-20 -left-16 w-32 h-32 bg-sky-200 rounded-full opacity-20"
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
          <motion.div
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
              <Button
                href="/resume.pdf"
                variant="outline"
                className="flex items-center"
              >
                Download Resume
              </Button>
            </div>
          </motion.div>

          <motion.div
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
          </motion.div>
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
            <motion.div
              key={index}
              className="bg-white py-3 px-4 rounded-lg shadow-sm text-center"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <span className="font-medium">{tech}</span>
            </motion.div>
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
              <ProjectCard key={project.id} project={project} index={index} />
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
          <motion.div
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
                <span className="text-indigo-600 mr-3">📍</span>
                <div>
                  <h4 className="font-medium">Location</h4>
                  <p className="text-gray-600">City, Country</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-indigo-600 mr-3">📧</span>
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p className="text-gray-600">email@example.com</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </Section>
    </div>
  );
};

export default HomePage;
