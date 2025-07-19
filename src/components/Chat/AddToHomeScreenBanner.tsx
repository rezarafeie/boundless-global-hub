import React, { useState, useEffect } from 'react';
import { X, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AddToHomeScreenBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if banner was already dismissed
    const bannerDismissed = localStorage.getItem('addToHomeBannerDismissed');
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    if (!bannerDismissed && !isStandalone && !isInWebAppiOS) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('addToHomeBannerDismissed', 'true');
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('addToHomeBannerDismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-background/95 backdrop-blur border shadow-lg">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                نصب پیام‌رسان رفیعی
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isIOS 
                  ? 'برای دسترسی آسان‌تر، آن را به صفحه اصلی اضافه کنید'
                  : 'برای تجربه بهتر، اپلیکیشن را نصب کنید'
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          {deferredPrompt && !isIOS ? (
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              نصب
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground">
              {isIOS 
                ? 'روی آیکون اشتراک‌گذاری در سافاری ضربه بزنید و "Add to Home Screen" را انتخاب کنید'
                : 'از منوی مرورگر گزینه "Add to Home Screen" را انتخاب کنید'
              }
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AddToHomeScreenBanner;