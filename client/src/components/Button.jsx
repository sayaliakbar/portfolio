import { motion as Motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Button = ({
  children,
  to,
  href,
  variant = "primary",
  className = "",
  onClick,
  ...props
}) => {
  const baseClasses = `btn btn-${variant} ${className}`;
  const location = useLocation();
  const navigate = useNavigate();

  // Animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  // Handle smooth scrolling for hash links
  const handleHashLinkClick = (e) => {
    e.preventDefault();

    // Check if the link is in format /#hash or just #hash
    if (to.startsWith("/#")) {
      // For links in format /#hash
      const targetId = to.substring(2);

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
    } else if (to.startsWith("#")) {
      // For links in format #hash (same page navigation)
      const targetId = to.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for navbar height
          behavior: "smooth",
        });
      }
    }

    if (onClick) onClick(e);
  };

  // If "to" prop is provided, render Link component or anchor for hash links
  if (to) {
    if (to.startsWith("#") || to.startsWith("/#")) {
      return (
        <Motion.div
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          <a
            href={to}
            className={baseClasses}
            onClick={handleHashLinkClick}
            {...props}
          >
            {children}
          </a>
        </Motion.div>
      );
    }

    return (
      <Motion.div
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        <Link to={to} className={baseClasses} {...props}>
          {children}
        </Link>
      </Motion.div>
    );
  }

  // If "href" prop is provided, render anchor tag
  if (href) {
    return (
      <Motion.div
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        <a
          href={href}
          className={baseClasses}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      </Motion.div>
    );
  }

  // Otherwise, render button element
  return (
    <Motion.button
      className={baseClasses}
      onClick={onClick}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </Motion.button>
  );
};

export default Button;
