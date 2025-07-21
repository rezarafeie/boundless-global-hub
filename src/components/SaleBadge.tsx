import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Percent } from 'lucide-react';

interface SaleBadgeProps {
  originalPrice: number;
  salePrice: number;
  className?: string;
}

const SaleBadge: React.FC<SaleBadgeProps> = ({ originalPrice, salePrice, className = '' }) => {
  const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  
  return (
    <Badge 
      className={`bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-lg animate-pulse ${className}`}
    >
      <Zap className="h-3 w-3 ml-1" />
      حراج {discountPercent}%
    </Badge>
  );
};

export default SaleBadge;