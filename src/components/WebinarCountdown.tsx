import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

interface WebinarCountdownProps {
  endDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const WebinarCountdown: React.FC<WebinarCountdownProps> = ({ endDate, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = () => {
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
      setIsExpired(false);
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsExpired(true);
    }
  };

  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return (
      <Card className={`bg-gradient-to-r from-muted to-muted/50 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-muted-foreground ml-2" />
            <span className="text-lg font-semibold text-muted-foreground">وبینار شروع شده</span>
          </div>
          <p className="text-sm text-muted-foreground">
            زمان شروع این وبینار فرا رسیده است
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 ${className}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-primary ml-2" />
            <span className="text-lg font-semibold text-primary">زمان باقی‌مانده تا شروع وبینار</span>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {[
              { value: timeLeft.days, label: "روز", key: "days" },
              { value: timeLeft.hours, label: "ساعت", key: "hours" },
              { value: timeLeft.minutes, label: "دقیقه", key: "minutes" },
              { value: timeLeft.seconds, label: "ثانیه", key: "seconds" }
            ].map(({ value, label, key }) => (
              <div key={key} className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {value.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-muted-foreground font-medium mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            ⏰ تاریخ برگزاری: {new Date(endDate).toLocaleDateString('fa-IR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebinarCountdown;