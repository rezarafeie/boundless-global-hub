
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LucideIcon, ArrowLeft } from "lucide-react";

interface EducationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  gradient: string;
  iconColor: string;
  index?: number;
}

const EducationCard: React.FC<EducationCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  link, 
  gradient,
  iconColor,
  index = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group"
    >
      <Link to={link} className="block h-full">
        <div className={`h-full bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 backdrop-blur-sm`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-1 rtl:group-hover:-translate-x-1 duration-300" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
            {title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
            {description}
          </p>
          
          <div className="mt-4 pt-4 border-t border-white/30 dark:border-gray-600/30">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              مشاهده بیشتر
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EducationCard;
