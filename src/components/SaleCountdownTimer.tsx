
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface SaleCountdownTimerProps {
  expiresAt: string;
  className?: string;
}

const SaleCountdownTimer: React.FC<SaleCountdownTimerProps> = ({ expiresAt, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = new Date(expiresAt).getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (isExpired) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 ${className}`}>
      <Clock className="h-4 w-4" />
      <span>باقی‌مانده:</span>
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <span className="bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded text-xs">
            {timeLeft.days} روز
          </span>
        )}
        <span className="bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded text-xs">
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default SaleCountdownTimer;
