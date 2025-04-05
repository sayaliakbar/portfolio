import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import api from "../utils/api";

const ResumeButton = () => {
  const [resumeUrl, setResumeUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch resume URL on component mount
  useEffect(() => {
    const fetchResumeUrl = async () => {
      try {
        const response = await api.get("/resume/public");
        if (response.data && response.data.fileUrl) {
          setResumeUrl(response.data.fileUrl);
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResumeUrl();
  }, []);

  if (loading) {
    return null; // Don't render anything while loading
  }

  // If no resume is available, don't render the button
  if (!resumeUrl) {
    return null;
  }

  return (
    <Motion.a
      href={resumeUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-medium"
    >
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download Resume
    </Motion.a>
  );
};

export default ResumeButton;
