
import React from 'react';
import { Percent } from 'lucide-react';

interface SaleBadgeProps {
  originalPrice: number;
  salePrice: number;
  className?: string;
}

const SaleBadge: React.FC<SaleBadgeProps> = ({ originalPrice, salePrice, className = '' }) => {
  const discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

  return (
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md ${className}`}>
      <Percent className="h-3 w-3" />
      <span>{discountPercentage}% تخفیف</span>
    </div>
  );
};

export default SaleBadge;
