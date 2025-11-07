import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, CheckCircle2, Smartphone, Share2, Menu, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstaller: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installStep, setInstallStep] = useState<'intro' | 'installing' | 'success'>('intro');

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      // App is already installed, skip to dashboard
      navigate('/dashboard', { replace: true });
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const iOS = /ipad|iphone|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(android);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [navigate]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstallStep('installing');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallStep('success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        setInstallStep('intro');
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('pwa_installer_skipped', 'true');
    navigate('/dashboard', { replace: true });
  };

  const renderIOSInstructions = () => (
    <div className="space-y-6">
      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">1</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">روی دکمه اشتراک‌گذاری ضربه بزنید</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
            <Share2 className="w-5 h-5" />
            <span>در پایین صفحه سافاری</span>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">2</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">گزینه "Add to Home Screen" را انتخاب کنید</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
            <Plus className="w-5 h-5" />
            <span>در منوی باز شده</span>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">3</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">روی "Add" یا "اضافه کردن" کلیک کنید</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
            <CheckCircle2 className="w-5 h-5" />
            <span>تایید نهایی نصب</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAndroidInstructions = () => (
    <div className="space-y-6">
      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">1</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">روی منوی مرورگر کلیک کنید</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
            <Menu className="w-5 h-5" />
            <span>سه نقطه در بالای صفحه</span>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">2</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">گزینه "نصب برنامه" یا "Install app" را انتخاب کنید</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
            <Download className="w-5 h-5" />
            <span>از منوی باز شده</span>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">3</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">روی "نصب" کلیک کنید</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
            <CheckCircle2 className="w-5 h-5" />
            <span>تایید نهایی نصب</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl">
        {installStep === 'intro' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Smartphone className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">نصب اپلیکیشن</h1>
              <p className="text-muted-foreground">
                برای بهترین تجربه، اپلیکیشن را روی دستگاه خود نصب کنید
              </p>
            </div>

            <div className="mb-8 p-6 rounded-lg bg-accent/10 border border-accent/20">
              <h2 className="font-semibold mb-4 flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>مزایای نصب اپلیکیشن:</span>
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>دسترسی سریع‌تر از صفحه اصلی</span>
                </li>
                <li className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>کار کردن بدون نیاز به اینترنت</span>
                </li>
                <li className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>دریافت اعلان‌های فوری</span>
                </li>
                <li className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>تجربه مشابه اپلیکیشن‌های native</span>
                </li>
              </ul>
            </div>

            {deferredPrompt ? (
              <Button
                onClick={handleInstallClick}
                size="lg"
                className="w-full mb-4"
              >
                <Download className="w-5 h-5 ml-2" />
                نصب اپلیکیشن
              </Button>
            ) : (
              <div className="mb-8">
                <h2 className="font-semibold mb-4">راهنمای نصب:</h2>
                {isIOS && renderIOSInstructions()}
                {isAndroid && renderAndroidInstructions()}
                {!isIOS && !isAndroid && (
                  <p className="text-center text-muted-foreground">
                    از منوی مرورگر خود گزینه "نصب" یا "Install" را انتخاب کنید
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full"
            >
              فعلاً نه، بعداً نصب می‌کنم
            </Button>
          </>
        )}

        {installStep === 'installing' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-pulse">
              <Download className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">در حال نصب...</h2>
            <p className="text-muted-foreground">لطفاً صبر کنید</p>
          </div>
        )}

        {installStep === 'success' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">نصب موفقیت‌آمیز بود!</h2>
            <p className="text-muted-foreground">در حال انتقال به داشبورد...</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PWAInstaller;
