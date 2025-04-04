import { motion as Motion } from "framer-motion";

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
        <Motion.div
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
            <Motion.p
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
            </Motion.p>
          )}
        </Motion.div>

        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={sectionVariants}
        >
          {children}
        </Motion.div>
      </div>
    </section>
  );
};

export default Section;
