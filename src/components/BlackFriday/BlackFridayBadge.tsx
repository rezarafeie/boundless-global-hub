import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlackFridayBadgeProps {
  discount?: number;
  className?: string;
}

const BlackFridayBadge: React.FC<BlackFridayBadgeProps> = ({ discount, className = '' }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black font-bold rounded-lg shadow-lg ${className}`}
    >
      <Zap className="h-5 w-5 fill-black" />
      <span>BLACK FRIDAY</span>
      {discount && (
        <span className="bg-black text-yellow-400 px-2 py-1 rounded text-sm">
          {discount}% OFF
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-0 animate-pulse rounded-lg" />
    </motion.div>
  );
};

export default BlackFridayBadge;