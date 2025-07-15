import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, X, Smartphone } from 'lucide-react';

interface NotificationPermissionBannerProps {
  onRequestPermission: () => Promise<boolean>;
  onDismiss: () => void;
  pushSupported?: boolean;
}

const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onRequestPermission,
  onDismiss,
  pushSupported = false
}) => {
  const handleEnableNotifications = async () => {
    const granted = await onRequestPermission();
    if (granted) {
      onDismiss();
    }
  };

  return (
    <Alert className="m-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        {pushSupported && <Smartphone className="h-4 w-4 text-accent" />}
      </div>
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 ml-2">
          <p className="text-primary font-medium">
            🔔 دریافت اعلان‌های پیشرفته را فعال کنید!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            با فعال‌سازی اعلان‌ها، حتی زمانی که صفحه بسته است نیز از پیام‌های جدید آگاه خواهید شد
            {pushSupported && (
              <span className="block text-xs text-accent-foreground mt-1">
                ✨ پشتیبانی از اعلان‌های پیشرفته در دستگاه شما فعال است
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mr-4">
          <Button
            size="sm"
            onClick={handleEnableNotifications}
            className="bg-primary hover:bg-primary/90"
          >
            <Bell className="h-4 w-4 mr-2" />
            فعال‌سازی اعلان‌ها
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default NotificationPermissionBanner;