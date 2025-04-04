import { motion } from "framer-motion";

const SkillCard = ({ skill, index }) => {
  const { icon: Icon, name, level } = skill;

  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <div className="text-indigo-600 mb-4">
        <Icon size={40} />
      </div>
      <h3 className="text-lg font-bold mb-2">{name}</h3>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div
          className="bg-indigo-600 h-2.5 rounded-full"
          style={{ width: `${level}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-500 mt-1">{level}%</span>
    </motion.div>
  );
};

export default SkillCard;
