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

  // If "to" prop is provided, render Link component
  if (to) {
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
