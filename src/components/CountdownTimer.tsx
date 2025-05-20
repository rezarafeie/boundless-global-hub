
import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label = "فقط تا پایان این فرصت ویژه",
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
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Pulse effect every 10 seconds
    const pulseTimer = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(pulseTimer);
    };
  });

  const timeUnits = [
    { label: 'روز', value: timeLeft.days },
    { label: 'ساعت', value: timeLeft.hours },
    { label: 'دقیقه', value: timeLeft.minutes },
    { label: 'ثانیه', value: timeLeft.seconds },
  ];

  return (
    <div className="countdown-container my-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
      <div className="text-center mb-2 text-amber-800 font-medium">{label}</div>
      <div className="flex justify-center gap-4 md:gap-6">
        {timeUnits.map((unit, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className={`text-2xl md:text-3xl lg:text-4xl font-bold bg-white w-14 md:w-16 h-14 md:h-16 flex items-center justify-center rounded-lg border border-amber-200 shadow-inner ${isPulsing ? 'animate-pulse text-amber-600' : 'text-black'}`}
            >
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm text-amber-700 mt-1">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
