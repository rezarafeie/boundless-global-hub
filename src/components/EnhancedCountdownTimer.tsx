
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface EnhancedCountdownTimerProps {
  endDate: string;
  label?: string;
  className?: string;
}

const EnhancedCountdownTimer: React.FC<EnhancedCountdownTimerProps> = ({ 
  endDate, 
  label = "تا پایان ثبت‌نام",
  className = "" 
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const timeUnits = [
    { value: timeLeft.days, label: "روز" },
    { value: timeLeft.hours, label: "ساعت" },
    { value: timeLeft.minutes, label: "دقیقه" },
    { value: timeLeft.seconds, label: "ثانیه" }
  ].reverse();

  return (
    <div className={`text-center ${className}`} dir="ltr">
      <motion.h3 
        className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {label}
      </motion.h3>
      
      <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent text-left"
              key={unit.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {unit.value.toString().padStart(2, '0')}
            </motion.div>
            <div className="text-sm text-muted-foreground font-medium mt-2 text-left">
              {unit.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCountdownTimer;
