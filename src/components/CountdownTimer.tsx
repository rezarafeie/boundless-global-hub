
import React, { useState, useEffect } from "react";
import { Clock, Zap, AlertTriangle } from "lucide-react";

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
  const [isCritical, setIsCritical] = useState(false);

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
        setIsCritical(totalHours < 6);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsUrgent(false);
        setIsCritical(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-2xl ${className}`}>
      {/* Enhanced Background with gradient and dynamic effects */}
      <div className={`absolute inset-0 ${
        isCritical 
          ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 animate-pulse' 
          : isUrgent 
          ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 animate-pulse' 
          : 'bg-gradient-to-r from-red-500 via-red-600 to-red-700'
      }`}></div>
      
      {/* Glowing overlay for urgency */}
      {isUrgent && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-orange-300/20 to-red-300/20 animate-pulse"></div>
      )}
      
      {/* Content */}
      <div className="relative p-8 text-white text-center">
        {/* Enhanced Header with dynamic icon */}
        <div className="flex items-center justify-center mb-6">
          <div className={`p-3 rounded-full bg-white/20 backdrop-blur-sm ${
            isCritical ? 'animate-bounce' : isUrgent ? 'animate-pulse' : ''
          } shadow-lg`}>
            {isCritical ? (
              <AlertTriangle size={28} className="text-yellow-300" />
            ) : isUrgent ? (
              <Zap size={28} className="text-yellow-300" />
            ) : (
              <Clock size={28} className="text-white" />
            )}
          </div>
        </div>

        {/* Enhanced motivating message */}
        <div className="mb-6 space-y-2">
          <p className={`text-2xl font-bold ${
            isCritical ? 'animate-pulse text-yellow-300' : 
            isUrgent ? 'text-yellow-300' : 'text-white'
          } drop-shadow-lg`}>
            {isCritical 
              ? "🚨 آخرین فرصت!" 
              : isUrgent 
              ? "⚡ فرصت رو از دست نده!" 
              : "⏰ زمان باقی‌مانده تا پایان ثبت‌نام:"
            }
          </p>
          <p className={`text-lg font-medium ${
            isCritical ? 'text-yellow-200 animate-pulse' :
            isUrgent ? 'text-yellow-200' : 'text-white/90'
          }`}>
            {isCritical 
              ? "فقط چند ساعت باقی مانده!" 
              : isUrgent 
              ? "ظرفیت محدود!" 
              : "همین حالا ثبت‌نام کن!"
            }
          </p>
        </div>
        
        {/* Enhanced Time blocks with bigger fonts and better styling */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-6">
          {[
            { value: timeLeft.days, label: "روز", key: "days" },
            { value: timeLeft.hours, label: "ساعت", key: "hours" },
            { value: timeLeft.minutes, label: "دقیقه", key: "minutes" },
            { value: timeLeft.seconds, label: "ثانیه", key: "seconds" }
          ].map(({ value, label, key }) => (
            <div 
              key={key}
              className={`relative bg-white/25 backdrop-blur-md rounded-2xl p-4 sm:p-6 min-w-[80px] sm:min-w-[100px] transition-all duration-300 border border-white/20 ${
                isCritical && key === 'seconds' ? 'animate-bounce scale-110 shadow-2xl' : 
                isUrgent && key === 'seconds' ? 'animate-pulse scale-105 shadow-xl' : 
                'shadow-lg hover:scale-105'
              }`}
            >
              {/* Enhanced Glow effect for urgent mode */}
              {isUrgent && (
                <div className="absolute inset-0 rounded-2xl bg-white/10 animate-ping opacity-75"></div>
              )}
              
              <div className="relative">
                <div className={`text-3xl sm:text-5xl font-bold transition-all duration-200 ${
                  isCritical && key === 'seconds' ? 'text-yellow-300 text-shadow-lg' : 
                  isUrgent && key === 'seconds' ? 'text-yellow-300' : 'text-white'
                } drop-shadow-lg`}>
                  {value.toString().padStart(2, '0')}
                </div>
                <div className="text-sm sm:text-base font-semibold opacity-90 mt-2 text-white/90">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Bottom message with urgency indicators */}
        <div className="space-y-3">
          <p className={`text-lg font-bold ${
            isCritical ? 'text-yellow-300 animate-pulse' :
            isUrgent ? 'text-yellow-200' : 'text-white/95'
          } drop-shadow`}>
            {isCritical 
              ? "🔥 تنها ۵ نفر دیگر!" 
              : isUrgent 
              ? "🔥 جاهای محدود باقی مونده!" 
              : "✨ همین الان ثبت‌نام کن!"
            }
          </p>
          
          {/* Additional urgency message */}
          {isUrgent && (
            <p className="text-sm text-yellow-100 animate-pulse font-medium">
              {isCritical ? "⏰ ثبت‌نام بسته می‌شود!" : "💎 تخفیف ویژه منقضی می‌شود!"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
