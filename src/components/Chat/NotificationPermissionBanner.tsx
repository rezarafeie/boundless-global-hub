import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X, Smartphone, Loader2, AlertCircle } from 'lucide-react';

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
  console.log('🔔 [Android] NotificationPermissionBanner rendered');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const handleEnableNotifications = async () => {
    console.log('🔔 [Android] Banner activate button clicked - IMMEDIATE LOG');
    setIsLoading(true);
    setShowError(false);
    
    try {
      const granted = await onRequestPermission();
      console.log('🔔 [Android] Permission request result from banner:', granted);
      
      if (granted) {
        console.log('🔔 [Android] Permission granted, hiding banner');
        onDismiss();
      } else {
        console.log('🔔 [Android] Permission denied, showing error state');
        setShowError(true);
        // Keep banner visible so user can try again
      }
    } catch (error) {
      console.error('🔔 [Android] Error in banner permission request:', error);
      setShowError(true);
      // Keep banner visible on error
    } finally {
      setIsLoading(false);
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
                <Smartphone className="h-3 w-3 text-accent" />
                {showError && <AlertCircle className="h-3 w-3 text-destructive" />}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">فعال‌سازی اعلان‌ها</p>
                <p className="text-xs text-muted-foreground">
                  {showError 
                    ? 'خطا در فعال‌سازی - دوباره تلاش کنید'
                    : pushSupported 
                      ? 'برای دریافت پیام‌های جدید' 
                      : 'نیاز به تعامل کاربر'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className={`h-7 px-3 text-xs ${
                  showError 
                    ? 'bg-destructive hover:bg-destructive/90' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    در حال فعال‌سازی...
                  </>
                ) : showError ? (
                  'تلاش مجدد'
                ) : (
                  'فعال'
                )}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                disabled={isLoading}
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
