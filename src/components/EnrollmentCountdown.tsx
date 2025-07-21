import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface EnrollmentCountdownProps {
  onTimeUp?: () => void;
  className?: string;
}

const EnrollmentCountdown: React.FC<EnrollmentCountdownProps> = ({ 
  onTimeUp, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    if (timeLeft <= 60) return 'text-red-600 dark:text-red-400'; // Last minute - red
    if (timeLeft <= 120) return 'text-orange-600 dark:text-orange-400'; // Last 2 minutes - orange
    return 'text-primary'; // Normal - primary color
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`h-4 w-4 ${getColorClass()}`} />
      <span className={`text-sm font-medium ${getColorClass()}`}>
        زمان باقی‌مانده: {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default EnrollmentCountdown;