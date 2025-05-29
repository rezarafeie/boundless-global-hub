
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

  useEffect(() => {
    // Get stored count from localStorage or use initial
    const storageKey = `enrollment_${courseName}`;
    const storedCount = localStorage.getItem(storageKey);
    
    if (storedCount) {
      setCount(parseInt(storedCount));
    }

    const incrementCounter = () => {
      setCount(prev => {
        const newCount = prev + Math.floor(Math.random() * 3) + 1;
        localStorage.setItem(storageKey, newCount.toString());
        return newCount;
      });
    };

    // Increment every 45-90 seconds
    const interval = setInterval(() => {
      const randomDelay = Math.random() * (90000 - 45000) + 45000;
      setTimeout(incrementCounter, randomDelay);
    }, 90000);

    return () => clearInterval(interval);
  }, [courseName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="text-center">
          <motion.div
            key={count}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-green-700 dark:text-green-400"
          >
            {count.toLocaleString('fa-IR')}
          </motion.div>
          <div className="text-sm text-green-600 dark:text-green-500 font-medium">
            دانشجوی فعال
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveEnrollmentCounter;
