
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface UnreadCountBubbleProps {
  count: number;
  className?: string;
}

const UnreadCountBubble: React.FC<UnreadCountBubbleProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse ${className}`}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

export default UnreadCountBubble;
