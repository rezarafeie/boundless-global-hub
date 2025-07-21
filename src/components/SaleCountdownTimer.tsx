import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

interface SaleCountdownTimerProps {
  endDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const SaleCountdownTimer: React.FC<SaleCountdownTimerProps> = ({ endDate, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endDate.getTime();
      const difference = end - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return (
      <Card className={`p-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 ${className}`}>
        <div className="text-center">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-500" />
          <p className="text-lg font-bold text-gray-600 dark:text-gray-400">حراج به پایان رسید</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800 ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Clock className="h-5 w-5 text-red-600 ml-2 animate-pulse" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">پایان حراج</h3>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-red-200 dark:border-red-700">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">روز</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-red-200 dark:border-red-700">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{timeLeft.hours}</div>
            <div className="text-xs text-muted-foreground">ساعت</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-red-200 dark:border-red-700">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{timeLeft.minutes}</div>
            <div className="text-xs text-muted-foreground">دقیقه</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-red-200 dark:border-red-700">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{timeLeft.seconds}</div>
            <div className="text-xs text-muted-foreground">ثانیه</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SaleCountdownTimer;