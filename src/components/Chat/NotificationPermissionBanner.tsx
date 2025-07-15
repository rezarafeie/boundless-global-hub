import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, X } from 'lucide-react';

interface NotificationPermissionBannerProps {
  onRequestPermission: () => Promise<boolean>;
  onDismiss: () => void;
}

const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onRequestPermission,
  onDismiss
}) => {
  const handleEnableNotifications = async () => {
    const granted = await onRequestPermission();
    if (granted) {
      onDismiss();
    }
  };

  return (
    <Alert className="m-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 ml-2">
          <p className="text-blue-800 dark:text-blue-200 font-medium">
            🔔 دریافت نوتیفیکیشن برای پیام‌های جدید را فعال کنید!
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
            با فعال‌سازی نوتیفیکیشن‌ها، از دریافت پیام‌های جدید آگاه خواهید شد
          </p>
        </div>
        
        <div className="flex items-center gap-2 mr-4">
          <Button
            size="sm"
            onClick={handleEnableNotifications}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            فعال‌سازی نوتیفیکیشن
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default NotificationPermissionBanner;