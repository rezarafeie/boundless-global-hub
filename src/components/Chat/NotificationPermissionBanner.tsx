import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X, Smartphone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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
  console.log('🔔 [NotificationBanner] NotificationPermissionBanner rendered');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  const handleEnableNotifications = async () => {
    console.log('🔔 [NotificationBanner] Banner activate button clicked - IMMEDIATE LOG');
    setIsLoading(true);
    setShowError(false);
    setShowSuccess(false);
    setStatusMessage('درحال درخواست مجوز...');
    
    try {
      const granted = await onRequestPermission();
      console.log('🔔 [NotificationBanner] Permission request result from banner:', granted);
      
      if (granted) {
        console.log('🔔 [NotificationBanner] Permission granted, showing success');
        setShowSuccess(true);
        setStatusMessage('اعلان‌ها با موفقیت فعال شد');
        
        // Hide banner after success
        setTimeout(() => {
          onDismiss();
        }, 2000);
      } else {
        console.log('🔔 [NotificationBanner] Permission denied, showing error state');
        setShowError(true);
        
        if (isMobile) {
          if (isIOS) {
            setStatusMessage('iOS: لطفاً در تنظیمات مرورگر اعلان‌ها را فعال کنید');
          } else {
            setStatusMessage('Android: لطفاً در تنظیمات Chrome اعلان‌ها را فعال کنید');
          }
        } else {
          setStatusMessage('مجوز اعلان رد شد - می‌توانید دوباره تلاش کنید');
        }
        
        // Keep banner visible so user can try again
      }
    } catch (error) {
      console.error('🔔 [NotificationBanner] Error in banner permission request:', error);
      setShowError(true);
      setStatusMessage('خطا در فعال‌سازی اعلان‌ها');
      // Keep banner visible on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="mx-auto max-w-md">
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-1">
                <Bell className="h-4 w-4 text-primary" />
                {isMobile && <Smartphone className="h-3 w-3 text-accent" />}
                {showError && <AlertCircle className="h-3 w-3 text-destructive" />}
                {showSuccess && <CheckCircle className="h-3 w-3 text-green-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {showSuccess ? 'اعلان‌ها فعال شد' : 'فعال‌سازی اعلان‌ها'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statusMessage || (isMobile 
                    ? (isIOS ? 'برای دریافت اعلان‌ها در iOS' : 'برای دریافت اعلان‌ها در Android')
                    : 'برای دریافت پیام‌های جدید'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!showSuccess && (
                <Button
                  size="sm"
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className={`h-8 px-3 text-xs ${
                    showError 
                      ? 'bg-destructive hover:bg-destructive/90' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {isMobile ? 'در حال فعال‌سازی...' : 'فعال‌سازی...'}
                    </>
                  ) : showError ? (
                    'تلاش مجدد'
                  ) : (
                    isMobile ? 'فعال کردن' : 'فعال'
                  )}
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Mobile-specific instructions */}
          {isMobile && showError && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {isIOS 
                  ? 'راهنمایی: تنظیمات → Safari → اعلان‌ها → اجازه دهید'
                  : 'راهنمایی: تنظیمات → اعلان‌ها → Chrome → اجازه دهید'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
