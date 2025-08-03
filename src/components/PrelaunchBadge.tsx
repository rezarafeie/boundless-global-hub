import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Rocket, Calendar, Clock } from 'lucide-react';

interface PrelaunchBadgeProps {
  originalPrice: number;
  prelaunchPrice: number;
  launchDate: string;
  className?: string;
}

const PrelaunchBadge: React.FC<PrelaunchBadgeProps> = ({ 
  originalPrice, 
  prelaunchPrice, 
  launchDate,
  className = '' 
}) => {
  const discountPercent = Math.round(((originalPrice - prelaunchPrice) / originalPrice) * 100);
  const formattedDate = new Date(launchDate).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate days until launch
  const daysUntilLaunch = Math.ceil((new Date(launchDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Enhanced prelaunch badge with glow effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-lg blur-lg animate-pulse"></div>
        <Badge 
          className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2"
        >
          <Rocket className="h-3 w-3 md:h-4 md:w-4 ml-1 animate-bounce" />
          <span className="font-bold">پیش‌فروش {discountPercent}%</span>
        </Badge>
      </div>
      
      {/* Launch info with countdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs md:text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
          <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
          <span className="font-medium">لانچ رسمی: {formattedDate}</span>
        </div>
        
        {daysUntilLaunch > 0 && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
            <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 animate-pulse" />
            <span className="font-medium">{daysUntilLaunch} روز تا پایان پیش‌فروش</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrelaunchBadge;