
import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface PurpleLoaderProps {
  className?: string;
}

const PurpleLoader: React.FC<PurpleLoaderProps> = ({ className = "" }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 8;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 ${className}`}>
      <div className="text-center max-w-md px-6">
        {/* Enhanced Brand Logo with Purple Theme */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <motion.div 
              className="w-24 h-24 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center shadow-2xl"
              animate={{ 
                scale: [1, 1.05, 1],
                rotateY: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <span className="text-purple-700 font-bold text-3xl">R</span>
            </motion.div>
            
            {/* Floating glow effect */}
            <div className="absolute inset-0 w-24 h-24 mx-auto bg-white/30 rounded-2xl opacity-40 blur-lg animate-pulse"></div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h3 className="text-3xl font-bold text-white mb-2">
              آکادمی رفیعی
            </h3>
            <p className="text-purple-200 mb-6 font-medium">
              Rafiei Academy
            </p>
          </motion.div>
        </motion.div>

        {/* Enhanced Progress Bar */}
        <motion.div 
          className="w-80 max-w-full mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Progress 
            value={loadingProgress} 
            className="h-4 mb-4 bg-purple-800/50 rounded-full overflow-hidden shadow-inner" 
          />
          <div className="flex justify-between items-center">
            <p className="text-lg text-white font-semibold">
              {Math.round(loadingProgress)}% بارگذاری شده
            </p>
            <div className="flex space-x-1 rtl:space-x-reverse">
              <motion.div 
                className="w-2 h-2 bg-white rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div 
                className="w-2 h-2 bg-white rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div 
                className="w-2 h-2 bg-white rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Enhanced Loading Messages */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <p className="text-xl text-white font-bold mb-2">
            در حال بارگذاری محتوا...
          </p>
          <p className="text-sm text-purple-200">
            آماده‌سازی بهترین تجربه یادگیری برای شما
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PurpleLoader;
