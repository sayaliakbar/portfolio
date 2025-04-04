import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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

  // Animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  // Handle smooth scrolling for hash links
  const handleHashLinkClick = (e) => {
    e.preventDefault();
    const targetId = to.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Adjust for navbar height
        behavior: "smooth",
      });
    }

    if (onClick) onClick(e);
  };

  // If "to" prop is provided, render Link component or anchor for hash links
  if (to) {
    if (to.startsWith("#")) {
      return (
        <motion.div
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
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        <Link to={to} className={baseClasses} {...props}>
          {children}
        </Link>
      </motion.div>
    );
  }

  // If "href" prop is provided, render anchor tag
  if (href) {
    return (
      <motion.div
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
      </motion.div>
    );
  }

  // Otherwise, render button element
  return (
    <motion.button
      className={baseClasses}
      onClick={onClick}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
