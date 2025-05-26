
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import LoadingSpinner from "@/components/LoadingSpinner";

const Magazine = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

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

    return () => clearInterval(interval);
  }, []);

  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return (
    <MainLayout>
      <Hero
        title="مجله آکادمی رفیعی"
        subtitle="آخرین مقالات، اخبار و نکات آموزشی در زمینه کسب‌وکار، موفقیت و تحول دیجیتال"
        ctaText="مطالعه مقالات"
        ctaLink="#magazine"
        backgroundType="glow"
      />
      
      <section id="magazine" className="py-0">
        <div className="container-fluid p-0">
          {/* Enhanced Loading Animation */}
          {isLoading && (
            <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700" style={{ height: '600px' }}>
              <div className="text-center">
                <LoadingSpinner size="lg" showProgress={true} progress={loadingProgress} />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-4 mb-2">
                  مجله آکادمی رفیعی
                </h3>
              </div>
            </div>
          )}

          {/* Magazine Iframe */}
          <iframe
            src="https://auth.rafiei.co/mag/"
            title="مجله آکادمی رفیعی"
            className={`w-full border-0 transition-opacity duration-500 ${
              isLoading ? 'opacity-0 h-0' : 'opacity-100'
            }`}
            style={{ height: isLoading ? '0px' : '100vh' }}
            onLoad={handleIframeLoad}
            allow="fullscreen"
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default Magazine;
