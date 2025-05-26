
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import IframeModal from "@/components/IframeModal";

const Magazine = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
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
          {/* Loading Animation */}
          {isLoading && (
            <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700" style={{ height: '600px' }}>
              <div className="text-center">
                <div className="mb-8">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto mb-4 bg-black dark:bg-white rounded-xl flex items-center justify-center animate-pulse">
                      <span className="text-white dark:text-black font-bold text-xl">R</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white animate-pulse mb-2">
                      مجله آکادمی رفیعی
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 animate-pulse">
                      در حال بارگذاری...
                    </p>
                  </div>
                </div>
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
