
import React from 'react';
import { motion } from 'framer-motion';

interface EnhancedLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedLoader: React.FC<EnhancedLoaderProps> = ({ 
  message = "در حال بارگذاری...", 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Logo Animation */}
      <div className="relative mb-6">
        <motion.div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center`}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="text-white font-bold text-lg">R</span>
        </motion.div>
        
        {/* Orbital dots */}
        <div className={`absolute inset-0 ${sizeClasses[size]}`}>
          {[0, 120, 240].map((rotation, index) => (
            <motion.div
              key={index}
              className={`absolute ${dotSizes[size]} bg-primary rounded-full`}
              style={{
                top: '50%',
                left: '50%',
                originX: 0.5,
                originY: 0.5,
              }}
              animate={{
                rotate: [rotation, rotation + 360],
                x: size === 'lg' ? 30 : size === 'md' ? 25 : 20,
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.2
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          animate={{
            x: [-200, 200],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Loading text */}
      <motion.p
        className="text-sm text-gray-600 text-center"
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {message}
      </motion.p>
      
      {/* Floating dots */}
      <div className="flex space-x-1 mt-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 0.8,
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

export default EnhancedLoader;
