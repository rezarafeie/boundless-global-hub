import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface UserCountdownTimerProps {
  className?: string;
}

const UserCountdownTimer: React.FC<UserCountdownTimerProps> = ({ className = "" }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Get or set the countdown start time in localStorage
    const getCountdownEndTime = () => {
      const stored = localStorage.getItem('boundless-countdown-end');
      if (stored) {
        return new Date(stored);
      }
      
      // Set countdown for 2 days from now
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 2);
      localStorage.setItem('boundless-countdown-end', endTime.toISOString());
      return endTime;
    };

    const endTime = getCountdownEndTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTimeMs = endTime.getTime();
      const difference = endTimeMs - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isExpired) {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center ${className}`}>
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-5 h-5 text-green-600 ml-2" />
          <span className="text-green-600 font-bold">فرصت محدود ثبت‌نام</span>
        </div>
        <p className="text-green-600 text-sm">همین الان ثبت‌نام کنید و به جمع موفقان بپیوندید</p>
      </div>
    );
  }

  return (
    <div className={`bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center ${className}`}>
      <div className="flex items-center justify-center mb-3">
        <Clock className="w-5 h-5 text-orange-600 ml-2" />
        <span className="text-orange-600 font-bold text-sm">فرصت ویژه شما</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
          <div className="text-lg font-bold text-foreground">{timeLeft.days}</div>
          <div className="text-xs text-muted-foreground">روز</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
          <div className="text-lg font-bold text-foreground">{timeLeft.hours}</div>
          <div className="text-xs text-muted-foreground">ساعت</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
          <div className="text-lg font-bold text-foreground">{timeLeft.minutes}</div>
          <div className="text-xs text-muted-foreground">دقیقه</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
          <div className="text-lg font-bold text-foreground">{timeLeft.seconds}</div>
          <div className="text-xs text-muted-foreground">ثانیه</div>
        </div>
      </div>
      
      <p className="text-orange-600 text-xs">تا پایان فرصت ویژه ثبت‌نام</p>
    </div>
  );
};

export default UserCountdownTimer;