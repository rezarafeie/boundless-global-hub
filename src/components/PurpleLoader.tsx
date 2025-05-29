
import React from 'react';
import { motion } from 'framer-motion';

interface PurpleLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PurpleLoader: React.FC<PurpleLoaderProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Purple rounded square with R logo */}
      <motion.div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4`}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <span className="text-white font-bold text-lg opacity-80">R</span>
      </motion.div>

      {/* Academy name */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-blue-600 mb-1">آکادمی رفیعی</h3>
        <p className="text-sm text-gray-500 mb-3">Rafiei Academy</p>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "47%" }}
          transition={{
            duration: 2,
            ease: "easeOut"
          }}
        />
      </div>

      {/* Loading text */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">۴۷٪ بارگذاری شده</p>
        <motion.p 
          className="text-sm text-gray-500 dark:text-gray-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          در حال بارگذاری محتوا...
        </motion.p>
        <p className="text-xs text-gray-400 dark:text-gray-500">آماده‌سازی بهترین تجربه یادگیری برای شما</p>
      </div>

      {/* Loading dots animation */}
      <div className="flex space-x-1 mt-3">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PurpleLoader;
