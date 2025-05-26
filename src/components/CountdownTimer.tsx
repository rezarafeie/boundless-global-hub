
import React, { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";

interface CountdownTimerProps {
  endDate: string;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endDate, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference > 0) {
        const newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };

        setTimeLeft(newTimeLeft);
        
        // Set urgent mode when less than 24 hours left
        const totalHours = newTimeLeft.days * 24 + newTimeLeft.hours;
        setIsUrgent(totalHours < 24);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsUrgent(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Background with gradient and pulse effect */}
      <div className={`absolute inset-0 ${isUrgent ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 animate-pulse' : 'bg-gradient-to-r from-red-500 via-red-600 to-red-700'}`}></div>
      
      {/* Content */}
      <div className="relative p-6 text-white text-center">
        {/* Header with icon */}
        <div className="flex items-center justify-center mb-4">
          <div className={`p-2 rounded-full bg-white/20 ${isUrgent ? 'animate-bounce' : ''}`}>
            {isUrgent ? <Zap size={20} className="text-yellow-300" /> : <Clock size={20} />}
          </div>
        </div>

        {/* Motivating message */}
        <div className="mb-4">
          <p className={`text-lg font-bold ${isUrgent ? 'animate-pulse text-yellow-300' : ''}`}>
            {isUrgent ? "⚡ فرصت رو از دست نده!" : "⏰ زمان باقی‌مانده تا پایان ثبت‌نام:"}
          </p>
          {isUrgent && (
            <p className="text-sm mt-1 text-yellow-200 animate-pulse">
              فقط چند ساعت دیگه!
            </p>
          )}
        </div>
        
        {/* Time blocks */}
        <div className="flex justify-center gap-3 sm:gap-6">
          {[
            { value: timeLeft.days, label: "روز", key: "days" },
            { value: timeLeft.hours, label: "ساعت", key: "hours" },
            { value: timeLeft.minutes, label: "دقیقه", key: "minutes" },
            { value: timeLeft.seconds, label: "ثانیه", key: "seconds" }
          ].map(({ value, label, key }) => (
            <div 
              key={key}
              className={`relative bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-w-[60px] sm:min-w-[80px] transition-all duration-300 ${
                isUrgent && key === 'seconds' ? 'animate-pulse scale-105' : ''
              } ${isUrgent ? 'shadow-lg shadow-white/20' : ''}`}
            >
              {/* Glow effect for urgent mode */}
              {isUrgent && (
                <div className="absolute inset-0 rounded-xl bg-white/10 animate-ping"></div>
              )}
              
              <div className="relative">
                <div className={`text-2xl sm:text-4xl font-bold transition-all duration-200 ${
                  isUrgent && key === 'seconds' ? 'text-yellow-300' : ''
                }`}>
                  {value.toString().padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm font-medium opacity-90 mt-1">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="mt-6">
          <p className="text-sm opacity-90">
            {isUrgent ? "🔥 جاهای محدود باقی مونده!" : "✨ همین الان ثبت‌نام کن!"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
