
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const LiveWarModeBanner = () => {
  return (
    <section className="py-4 bg-red-900 dark:bg-red-950 border-y border-red-800">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4 text-center"
        >
          {/* Blinking Red Dot */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"
            />
            <span className="text-red-100 font-bold text-lg md:text-xl">
              🚨 حالت اضطراری جنگ فعال شد
            </span>
          </div>
          
          {/* Alert Icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </motion.div>
          
          {/* Link to Solidarity Page */}
          <Link 
            to="/solidarity"
            className="text-red-100 hover:text-white underline underline-offset-2 transition-colors duration-200 font-medium"
          >
            مشاهده صفحه همبستگی
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveWarModeBanner;
