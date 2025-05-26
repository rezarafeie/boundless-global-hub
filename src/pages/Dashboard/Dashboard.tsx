
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const { translations } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800); // Slightly slower transition
  };

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center">
            <div className="text-center">
              {/* Rafiei Academy Branded Loader */}
              <div className="mb-8">
                <div className="relative">
                  {/* Animated logo placeholder */}
                  <div className="w-20 h-20 mx-auto mb-6 bg-black dark:bg-white rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-white dark:text-black font-bold text-2xl">R</span>
                  </div>
                  
                  {/* Pulsing brand text */}
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white animate-pulse mb-2">
                    آکادمی رفیعی
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 animate-pulse text-lg">
                    Rafiei Academy
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl text-gray-700 dark:text-gray-200 font-medium">در حال بارگذاری حساب کاربری...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">لطفاً صبر کنید</p>
              </div>
            </div>
          </div>
        )}

        <div className="relative bg-white dark:bg-gray-900">
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
