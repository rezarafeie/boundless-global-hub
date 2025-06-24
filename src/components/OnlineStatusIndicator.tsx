
import React, { useState } from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const OnlineStatusIndicator: React.FC = () => {
  const { isOnline } = useOfflineDetection();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-center w-3 h-3 rounded-full hover:scale-110 transition-transform cursor-pointer">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 text-xs" align="start">
        <span>
          {isOnline ? 'نسخه بدون مرز آنلاین' : 'نسخه ملی آفلاین'}
        </span>
      </PopoverContent>
    </Popover>
  );
};

export default OnlineStatusIndicator;
