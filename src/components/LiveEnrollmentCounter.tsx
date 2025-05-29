
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface LiveEnrollmentCounterProps {
  initialCount: number;
  courseName: string;
  className?: string;
}

const LiveEnrollmentCounter: React.FC<LiveEnrollmentCounterProps> = ({ 
  initialCount, 
  courseName,
  className = "" 
}) => {
  const [count, setCount] = useState(initialCount);
  const [isIncrementing, setIsIncrementing] = useState(false);

  useEffect(() => {
    const incrementCounter = () => {
      // Random chance to increment (simulate real activity)
      if (Math.random() < 0.3) { // 30% chance every interval
        setIsIncrementing(true);
        setTimeout(() => {
          setCount(prev => prev + 1);
          setIsIncrementing(false);
        }, 300);
      }
    };

    // Run every 8-15 seconds
    const interval = setInterval(incrementCounter, Math.random() * 7000 + 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="text-center">
          <motion.div 
            className="text-2xl font-bold text-green-700 dark:text-green-400"
            animate={{ 
              scale: isIncrementing ? [1, 1.1, 1] : 1,
              color: isIncrementing ? "#10b981" : undefined
            }}
            transition={{ duration: 0.3 }}
          >
            {count.toLocaleString('fa-IR')}
          </motion.div>
          <div className="text-sm text-green-600 dark:text-green-300 font-medium">
            دانشجوی فعال
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveEnrollmentCounter;
