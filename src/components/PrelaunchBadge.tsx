import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Rocket, Calendar } from 'lucide-react';

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
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Badge 
        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg animate-pulse"
      >
        <Rocket className="h-3 w-3 ml-1" />
        پیش‌فروش {discountPercent}%
      </Badge>
      <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
        <Calendar className="h-3 w-3" />
        لانچ رسمی: {formattedDate}
      </div>
    </div>
  );
};

export default PrelaunchBadge;