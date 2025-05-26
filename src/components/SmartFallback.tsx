
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import LoadingSpinner from "@/components/LoadingSpinner";

const SmartFallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const location = useLocation();

  const iframeSrc = `https://auth.rafiei.co${location.pathname}`;

  useEffect(() => {
    // Progressive loading animation
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 8;
      });
    }, 200);

    console.log(`404 Fallback: Loading iframe for path: ${location.pathname}`);
    console.log(`Iframe source: ${iframeSrc}`);

    return () => clearInterval(interval);
  }, [location.pathname, iframeSrc]);

  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeFailed(true);
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-4rem)]">
        {/* Enhanced Loading Animation */}
        {isLoading && (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
            <div className="text-center">
              <LoadingSpinner size="lg" showProgress={true} progress={loadingProgress} />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4 mb-2">
                در حال بارگذاری صفحه
              </h3>
            </div>
          </div>
        )}

        {/* Fallback Error Message */}
        {iframeFailed && !isLoading && (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                صفحه یافت نشد
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                صفحه مورد نظر در هیچ‌یک از پلتفرم‌های آکادمی و auth موجود نیست.
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                بازگشت
              </button>
            </div>
          </div>
        )}

        {/* Smart Fallback Iframe */}
        {!iframeFailed && (
          <iframe
            src={iframeSrc}
            title={`Fallback content for ${location.pathname}`}
            className={`w-full border-0 transition-opacity duration-500 ${
              isLoading ? 'opacity-0 h-0' : 'opacity-100'
            }`}
            style={{ 
              height: isLoading ? '0px' : 'calc(100vh - 4rem)',
              minHeight: isLoading ? '0px' : 'calc(100vh - 4rem)'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="fullscreen"
          />
        )}
      </div>
    </MainLayout>
  );
};

export default SmartFallback;
