
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X, Smartphone, Loader2, AlertCircle, CheckCircle, Download, Info, RefreshCw } from 'lucide-react';
import { enhancedPushNotificationService } from '@/lib/enhancedPushNotificationService';
import { serviceWorkerManager } from '@/lib/serviceWorkerManager';
import { enhancedOneSignalLoader } from '@/lib/enhancedOneSignalLoader';
import type { MobileDeviceInfo } from '@/lib/mobilePushDetection';

interface EnhancedNotificationPermissionBannerProps {
  onRequestPermission: () => Promise<boolean>;
  onDismiss: () => void;
}

const EnhancedNotificationPermissionBanner: React.FC<EnhancedNotificationPermissionBannerProps> = ({
  onRequestPermission,
  onDismiss
}) => {
  console.log('🔔 [Enhanced Banner] Banner rendered');
  const [isLoading, setIsLoading] = useState(false);
  const [showStatus, setShowStatus] = useState<'success' | 'error' | 'info' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [isForceReloading, setIsForceReloading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  
  const deviceInfo = enhancedPushNotificationService.getDeviceInfo();

  const handleEnableNotifications = async () => {
    console.log('🔔 [Enhanced Banner] Enable button clicked');
    setIsLoading(true);
    setShowStatus(null);
    setCurrentStep('بررسی قابلیت‌ها...');
    
    if (!deviceInfo.supportsWebPush) {
      setShowStatus('info');
      setStatusMessage('اعلان‌های وب در این دستگاه محدودیت دارد');
      setIsLoading(false);
      setShowDetails(true);
      setCurrentStep('');
      return;
    }
    
    try {
      // Step-by-step progress
      setCurrentStep('راه‌اندازی OneSignal...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('درخواست مجوز...');
      const granted = await onRequestPermission();
      console.log('🔔 [Enhanced Banner] Permission request result:', granted);
      
      if (granted) {
        setCurrentStep('ذخیره اطلاعات...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setShowStatus('success');
        setStatusMessage('اعلان‌ها با موفقیت فعال شد');
        setCurrentStep('');
        setTimeout(() => {
          onDismiss();
        }, 2000);
      } else {
        setShowStatus('error');
        if (deviceInfo.isIOS) {
          setStatusMessage('iOS: نیاز به نصب سایت روی صفحه اصلی');
        } else {
          setStatusMessage('مجوز اعلان رد شد');
        }
        setShowDetails(true);
        setCurrentStep('');
      }
    } catch (error) {
      console.error('🔔 [Enhanced Banner] Error:', error);
      setShowStatus('error');
      setStatusMessage('خطا در فعال‌سازی اعلان‌ها');
      setShowDetails(true);
      setCurrentStep('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceReload = async () => {
    console.log('🔄 [Enhanced Banner] Force reload OneSignal');
    setIsForceReloading(true);
    setShowStatus(null);
    setCurrentStep('پاک‌سازی کش...');
    
    try {
      // Clear service worker cache
      await serviceWorkerManager.clearServiceWorkerCache();
      setCurrentStep('بارگذاری مجدد SDK...');
      
      // Force reload OneSignal SDK
      await enhancedOneSignalLoader.forceReloadSDK();
      setCurrentStep('راه‌اندازی مجدد...');
      
      // Reset initialization state
      enhancedPushNotificationService.isInitialized = false;
      enhancedPushNotificationService.initializationPromise = null;
      
      // Try to initialize again
      await enhancedPushNotificationService.initOneSignal();
      
      setShowStatus('success');
      setStatusMessage('OneSignal با موفقیت بارگذاری شد');
      setCurrentStep('');
      
      setTimeout(() => {
        setShowStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('🔄 [Enhanced Banner] Force reload failed:', error);
      setShowStatus('error');
      setStatusMessage('خطا در بارگذاری مجدد');
      setCurrentStep('');
    } finally {
      setIsForceReloading(false);
    }
  };

  const getStatusIcon = () => {
    switch (showStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getDeviceSpecificMessage = () => {
    if (deviceInfo.isIOS) {
      if (deviceInfo.isPWA) {
        return 'اعلان‌ها در حالت PWA';
      } else {
        return 'برای اعلان‌ها، سایت را به صفحه اصلی اضافه کنید';
      }
    } else if (deviceInfo.isAndroid) {
      return 'اعلان‌های وب پشتیبانی می‌شود';
    } else {
      return 'برای دریافت پیام‌های جدید';
    }
  };

  const renderMobileAppRecommendation = () => (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Download className="h-3 w-3 text-primary" />
        <p className="text-xs font-medium text-foreground">
          پیشنهاد: اپلیکیشن موبایل
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        برای بهترین تجربه اعلان‌ها، اپلیکیشن موبایل را نصب کنید
      </p>
    </div>
  );

  const renderLimitations = () => (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="space-y-2">
        {deviceInfo.limitations.map((limitation, index) => (
          <div key={index} className="flex items-start gap-2">
            <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{limitation}</p>
          </div>
        ))}
      </div>
      
      {deviceInfo.recommendations.length > 0 && (
        <div className="mt-2 space-y-1">
          {deviceInfo.recommendations.slice(0, 2).map((recommendation, index) => (
            <div key={index} className="flex items-start gap-2">
              <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-600">{recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="mx-auto max-w-md">
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                {deviceInfo.isMobile && <Smartphone className="h-3 w-3 text-accent" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {showStatus === 'success' ? 'اعلان‌ها فعال شد' : 'فعال‌سازی اعلان‌ها'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentStep || statusMessage || getDeviceSpecificMessage()}
                </p>
                {deviceInfo.isIOS && !deviceInfo.supportsWebPush && (
                  <p className="text-xs text-yellow-600 mt-1">
                    محدودیت iOS - {deviceInfo.browser}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!showStatus && deviceInfo.supportsWebPush && (
                <Button
                  size="sm"
                  onClick={handleEnableNotifications}
                  disabled={isLoading || isForceReloading}
                  className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      فعال‌سازی...
                    </>
                  ) : (
                    'فعال کردن'
                  )}
                </Button>
              )}
              
              {showStatus === 'error' && deviceInfo.supportsWebPush && (
                <>
                  <Button
                    size="sm"
                    onClick={handleEnableNotifications}
                    disabled={isLoading || isForceReloading}
                    className="h-8 px-3 text-xs bg-destructive hover:bg-destructive/90"
                  >
                    تلاش مجدد
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleForceReload}
                    disabled={isLoading || isForceReloading}
                    className="h-8 px-2 text-xs bg-orange-500 hover:bg-orange-600"
                  >
                    {isForceReloading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                disabled={isLoading || isForceReloading}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Details section */}
          {showDetails && (
            <>
              {deviceInfo.limitations.length > 0 && renderLimitations()}
              {deviceInfo.isMobile && renderMobileAppRecommendation()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedNotificationPermissionBanner;
