import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/Button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        <div className="w-24 h-1 bg-indigo-600 mx-auto my-6"></div>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Button to="/" variant="primary" className="mx-auto">
          Return Home
        </Button>
      </motion.div>

      {/* Decorative elements */}
      <motion.div
        className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-200 rounded-full opacity-20 -z-10"
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
        className="absolute top-20 -left-16 w-32 h-32 bg-sky-200 rounded-full opacity-20 -z-10"
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
    </div>
  );
};

export default NotFound;
