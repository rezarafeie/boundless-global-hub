
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label = "فرصت باقی‌مانده برای استفاده از تخفیف ویژه",
  onComplete
}) => {
  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else if (onComplete) {
      onComplete();
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Pulse effect every 5 seconds
    const pulseTimer = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(pulseTimer);
    };
  }, [targetDate, onComplete]);

  const timeUnits = [
    { label: 'روز', value: timeLeft.days },
    { label: 'ساعت', value: timeLeft.hours },
    { label: 'دقیقه', value: timeLeft.minutes },
    { label: 'ثانیه', value: timeLeft.seconds },
  ];

  const containerVariants = {
    pulse: {
      boxShadow: ["0 0 0 rgba(235, 168, 81, 0)", "0 0 15px rgba(235, 168, 81, 0.5)", "0 0 0 rgba(235, 168, 81, 0)"],
      transition: { 
        duration: 2,
        times: [0, 0.5, 1],
        repeat: Infinity,
        repeatDelay: 3
      }
    }
  };

  const digitVariants = {
    pulse: (custom: number) => ({
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5,
        delay: custom * 0.1
      }
    })
  };

  return (
    <motion.div 
      className="countdown-container my-6 p-6 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-md"
      variants={containerVariants}
      animate="pulse"
    >
      <div className="text-center mb-4 font-bold text-amber-800 text-lg">{label}</div>
      <div className="flex justify-center gap-4 md:gap-6">
        {timeUnits.map((unit, index) => (
          <div key={index} className="flex flex-col items-center">
            <motion.div 
              className={`text-2xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-b from-amber-400 to-amber-600 bg-clip-text text-transparent w-16 md:w-20 h-16 md:h-20 flex items-center justify-center rounded-lg border-2 border-amber-300 shadow-inner bg-white ${isPulsing ? 'animate-pulse' : ''}`}
              variants={digitVariants}
              animate={isPulsing ? "pulse" : ""}
              custom={index}
            >
              {String(unit.value).padStart(2, '0')}
            </motion.div>
            <div className="text-xs md:text-sm text-amber-700 mt-1 font-semibold">{unit.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <motion.div 
          className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-white text-xs md:text-sm font-medium"
          animate={{ 
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          پیشنهاد ویژه محدود
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CountdownTimer;
