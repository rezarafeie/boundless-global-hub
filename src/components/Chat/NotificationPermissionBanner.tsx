import React from 'react';
import { Button } from '@/components/ui/button';
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
    console.log('🔔 Banner activate button clicked');
    try {
      const granted = await onRequestPermission();
      console.log('🔔 Permission request result from banner:', granted);
      
      // Only hide banner if permission was successfully granted
      if (granted) {
        console.log('🔔 Permission granted, hiding banner');
        onDismiss();
      } else {
        console.log('🔔 Permission denied, keeping banner visible');
        // Keep banner visible so user can try again
      }
    } catch (error) {
      console.error('🔔 Error in banner permission request:', error);
      // Keep banner visible on error
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="mx-auto max-w-md">
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1">
                <Bell className="h-3.5 w-3.5 text-primary" />
                {pushSupported && <Smartphone className="h-3 w-3 text-accent" />}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">فعال‌سازی اعلان‌ها</p>
                <p className="text-xs text-muted-foreground">برای دریافت پیام‌های جدید</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                className="h-7 px-3 text-xs bg-primary hover:bg-primary/90"
              >
                فعال
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
