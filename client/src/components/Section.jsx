import { motion } from "framer-motion";

const Section = ({
  id,
  title,
  subtitle,
  children,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  containerClassName = "",
  light = false,
}) => {
  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <section
      id={id}
      className={`py-20 ${light ? "bg-white" : "bg-gray-50"} ${className}`}
    >
      <div className={`container ${containerClassName}`}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={sectionVariants}
          className="text-center mb-12"
        >
          {title && (
            <h2 className={`section-title mx-auto ${titleClassName}`}>
              {title}
            </h2>
          )}

          {subtitle && (
            <motion.p
              className={`text-gray-600 mt-4 max-w-2xl mx-auto ${subtitleClassName}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: 0.2 },
                },
              }}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={sectionVariants}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default Section;
