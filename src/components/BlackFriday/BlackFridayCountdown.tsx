import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BlackFridayCountdownProps {
  endDate: string;
  className?: string;
}

const BlackFridayCountdown: React.FC<BlackFridayCountdownProps> = ({ endDate, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const timeUnits = [
    { value: timeLeft.days, label: 'روز' },
    { value: timeLeft.hours, label: 'ساعت' },
    { value: timeLeft.minutes, label: 'دقیقه' },
    { value: timeLeft.seconds, label: 'ثانیه' },
  ];

  return (
    <div className={`flex gap-2 md:gap-4 ${className}`}>
      {timeUnits.map((unit, index) => (
        <motion.div
          key={unit.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center bg-gradient-to-b from-yellow-500 to-yellow-600 text-black rounded-lg p-2 md:p-4 min-w-[60px] md:min-w-[80px] shadow-xl"
        >
          <motion.span
            key={unit.value}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl md:text-4xl font-black"
          >
            {String(unit.value).padStart(2, '0')}
          </motion.span>
          <span className="text-xs md:text-sm font-bold mt-1">{unit.label}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default BlackFridayCountdown;