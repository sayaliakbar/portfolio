import { motion as Motion } from "framer-motion";
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

    // If the link contains a slash (/), extract only the hash part
    const hash = to.includes("/") ? to.split("/").pop() : to;
    const targetId = hash.substring(1);
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
