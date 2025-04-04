import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  const handleHashLinkClick = (e, path) => {
    if (path.startsWith("/#")) {
      e.preventDefault();
      const targetId = path.substring(2);

      // Check if we're on the homepage
      if (location.pathname === "/") {
        // If on the homepage, just scroll to the element
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80, // Adjust for navbar height
            behavior: "smooth",
          });
        }
      } else {
        // If not on the homepage, navigate to homepage first, then scroll
        navigate("/", {
          state: { scrollToId: targetId },
        });
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Portfolio</h3>
            <p className="text-gray-300 mb-4">
              A MERN stack developer passionate about creating impactful web
              applications.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/sayaliakbar"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FaGithub className="text-xl hover:text-indigo-400 transition-colors" />
              </a>
              <a
                href="https://linkedin.com/in/sayaliakbar"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-xl hover:text-indigo-400 transition-colors" />
              </a>
              <a
                href="https://x.com/sayaliakbar"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <FaTwitter className="text-xl hover:text-indigo-400 transition-colors" />
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=sayaliakbar@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Email"
              >
                <FaEnvelope className="text-xl hover:text-indigo-400 transition-colors" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/#home"
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => handleHashLinkClick(e, "/#home")}
                >
                  Home
                </Link>
              </li>
              <li>
                <a
                  href="/#about"
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => handleHashLinkClick(e, "/#about")}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/#skills"
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => handleHashLinkClick(e, "/#skills")}
                >
                  Skills
                </a>
              </li>
              <li>
                <a
                  href="/#projects"
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => handleHashLinkClick(e, "/#projects")}
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="/#contact"
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={(e) => handleHashLinkClick(e, "/#contact")}
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Contact Info</h3>
            <p className="text-gray-300 mb-2">
              Email:{" "}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=sayaliakbar@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-400 transition-colors"
              >
                sayaliakbar@gmail.com
              </a>
            </p>
            <p className="text-gray-300 mb-2">Location: Quetta, Pakistan</p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Portfolio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
