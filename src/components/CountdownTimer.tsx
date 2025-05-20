
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [animateSecond, setAnimateSecond] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
      setAnimateSecond(prev => !prev);
    }, 1000);

    return () => clearTimeout(timer);
  });

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : num.toString();
  };

  const timeBlocks = [
    { label: "روز", value: timeLeft.days },
    { label: "ساعت", value: timeLeft.hours },
    { label: "دقیقه", value: timeLeft.minutes },
    { label: "ثانیه", value: timeLeft.seconds },
  ];

  return (
    <div className="w-full">
      <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-black to-black/80 text-white">
        <p className="text-xl md:text-2xl font-bold mb-4 text-center text-yellow-300">
          فرصت باقی‌مانده برای استفاده از تخفیف ویژه
        </p>
        
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {timeBlocks.map((block, index) => (
            <div
              key={index}
              className="flex flex-col items-center"
            >
              <div className="relative w-full aspect-square">
                <div className="absolute inset-0 bg-white/10 rounded-lg backdrop-blur-sm"></div>
                <div 
                  className={`absolute inset-0 bg-white/5 rounded-lg flex items-center justify-center
                    ${index === 3 ? (animateSecond ? 'ring-2 ring-yellow-400 animate-pulse' : '') : ''}`}
                >
                  <motion.span 
                    className="text-2xl md:text-5xl font-bold"
                    key={`${block.label}-${block.value}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatNumber(block.value)}
                  </motion.span>
                </div>
              </div>
              <span className="mt-2 text-xs md:text-sm text-white/80">{block.label}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <div className="inline-block relative">
            <span className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-md inline-block">
              تخفیف ۳۰٪ 
            </span>
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
