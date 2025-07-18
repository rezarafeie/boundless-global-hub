
import React from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';

const OnlineStatusIndicator: React.FC = () => {
  const { isOnline, isChecking } = useOfflineDetection();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <div className="hidden sm:flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {isChecking ? 'بررسی...' : (isOnline ? 'آنلاین' : 'آفلاین')}
            </span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wifi className="w-3 h-3 ml-1" />
                متصل
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <WifiOff className="w-3 h-3 ml-1" />
                قطع
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground max-w-48">
            {isOnline ? (
              <div>
                <div className="font-medium mb-1">نسخه بدون مرز آنلاین</div>
                <div>اتصال با سرور برقرار است. تمام امکانات در دسترس.</div>
              </div>
            ) : (
              <div>
                <div className="font-medium mb-1">حالت آفلاین</div>
                <div>از داده‌های ذخیره شده استفاده می‌شود. امکانات محدود.</div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OnlineStatusIndicator;
