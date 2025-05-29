
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
      const targetDate = new Date(endDate);
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
  ];

  return (
    <div className={`text-center ${className}`}>
      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6">{label}</h3>
      <div className="flex justify-center gap-4 md:gap-6">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl p-3 md:p-4 min-w-[60px] md:min-w-[80px] shadow-lg"
          >
            <div className="text-2xl md:text-3xl font-bold">
              {unit.value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm opacity-90">{unit.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCountdownTimer;
