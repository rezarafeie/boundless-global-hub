
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const Dashboard = () => {
  const { translations } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate progressive loading - slower animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 8; // Reduced from 15 to 8 for slower progress
      });
    }, 300); // Increased from 200ms to 300ms for slower updates

    return () => clearInterval(interval);
  }, []);

  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
              {/* Rafiei Academy Branded Loader */}
              <div className="mb-8">
                <div className="relative">
                  {/* Animated logo placeholder */}
                  <div className="w-20 h-20 mx-auto mb-6 bg-black rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-white font-bold text-2xl">R</span>
                  </div>
                  
                  {/* Pulsing brand text */}
                  <h3 className="text-3xl font-bold text-gray-800 animate-pulse mb-2">
                    آکادمی رفیعی
                  </h3>
                  <p className="text-gray-600 animate-pulse text-lg">
                    Rafiei Academy
                  </p>
                </div>
              </div>

              {/* Progress with percentage */}
              <LoadingSpinner 
                size="lg" 
                showProgress={true} 
                progress={loadingProgress}
                className="mb-6"
              />
              
              <div className="space-y-2">
                <p className="text-xl text-gray-700 font-medium">در حال بارگذاری حساب کاربری...</p>
                <p className="text-sm text-gray-500">لطفاً صبر کنید</p>
              </div>
            </div>
          </div>
        )}

        <div className="relative bg-white">
          <iframe
            src="https://auth.rafiei.co/my-account"
            title={translations.myAccount}
            className="w-full border-0"
            style={{
              height: 'calc(100vh - 80px)',
              minHeight: '600px'
            }}
            allow="fullscreen"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
