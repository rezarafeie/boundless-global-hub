
import React from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

const OnlineStatusIndicator: React.FC = () => {
  const { isOnline } = useOfflineDetection();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-muted-foreground">
        {isOnline ? 'نسخه بدون مرز آنلاین' : 'نسخه ملی آفلاین'}
      </span>
    </div>
  );
};

export default OnlineStatusIndicator;
