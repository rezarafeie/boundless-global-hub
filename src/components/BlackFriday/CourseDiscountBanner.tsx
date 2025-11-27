import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface CourseDiscountBannerProps {
  discount: number;
  courseName?: string;
}

const CourseDiscountBanner: React.FC<CourseDiscountBannerProps> = ({ discount, courseName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 py-4 px-4 mb-8 rounded-lg shadow-xl overflow-hidden"
    >
      {/* Animated sparkles background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-black/20 rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: -10,
              opacity: 0,
            }}
            animate={{
              y: '110%',
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-right">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="flex items-center gap-2"
          >
            <Zap className="h-6 w-6 fill-black text-black" />
            <span className="text-2xl md:text-3xl font-black text-black">
              BLACK FRIDAY
            </span>
            <Zap className="h-6 w-6 fill-black text-black" />
          </motion.div>

          <div className="bg-black text-yellow-400 px-6 py-2 rounded-full text-xl md:text-2xl font-bold shadow-lg">
            {discount}% تخفیف ویژه
          </div>

          {courseName && (
            <p className="text-black font-bold text-lg">
              برای دوره {courseName}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseDiscountBanner;
