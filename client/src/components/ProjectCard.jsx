import { motion as Motion } from "framer-motion";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import Button from "./Button";

const ProjectCard = ({ project, index }) => {
  const { title, description, image, technologies, github, demo } = project;

  return (
    <Motion.div
      className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <div className="relative overflow-hidden group">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex space-x-4">
            {github && (
              <Motion.a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-gray-900 p-3 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="View GitHub Repository"
              >
                <FaGithub size={20} />
              </Motion.a>
            )}
            {demo && (
              <Motion.a
                href={demo}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-gray-900 p-3 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="View Live Demo"
              >
                <FaExternalLinkAlt size={20} />
              </Motion.a>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 flex-grow">{description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {technologies.map((tech, i) => (
            <span
              key={i}
              className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex justify-between mt-auto">
          {github && (
            <Button
              href={github}
              variant="outline"
              className="text-sm px-4 py-1"
            >
              GitHub <FaGithub className="inline ml-1" />
            </Button>
          )}
          {demo && (
            <Button href={demo} variant="primary" className="text-sm px-4 py-1">
              Live Demo <FaExternalLinkAlt className="inline ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Motion.div>
  );
};

export default ProjectCard;
