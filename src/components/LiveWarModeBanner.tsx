
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const LiveWarModeBanner = () => {
  return (
    <div className="fixed top-16 left-0 right-0 z-[9999] bg-red-600 dark:bg-red-700 border-b border-red-500">
      <div className="container py-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-2 md:gap-4 text-center"
        >
          {/* Blinking Red Dot */}
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1]
            }}
            transition={{ 
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-2 h-2 md:w-3 md:h-3 bg-red-200 rounded-full shadow-sm"
          />
          
          {/* Emergency Text */}
          <span className="text-white font-semibold text-sm md:text-base">
            🚨 حالت اضطراری جنگ فعال شد
          </span>
          
          {/* Alert Icon - Hidden on mobile */}
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="hidden md:block"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-300" />
          </motion.div>
          
          {/* Link */}
          <Link 
            to="/solidarity"
            className="text-red-100 hover:text-white underline underline-offset-2 transition-colors duration-200 font-medium text-sm md:text-base"
          >
            مشاهده صفحه همبستگی
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveWarModeBanner;
