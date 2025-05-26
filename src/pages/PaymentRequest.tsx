
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import LoadingSpinner from "@/components/LoadingSpinner";

const PaymentRequest = () => {
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
        title="درخواست پرداخت ارزی"
        subtitle="درخواست پرداخت با ارزهای دیجیتال و روش‌های بین‌المللی"
        ctaText="ثبت درخواست"
        ctaLink="#payment-request"
        backgroundType="glow"
      />
      
      <section id="payment-request" className="py-0">
        <div className="container-fluid p-0">
          {/* Enhanced Loading Animation */}
          {isLoading && (
            <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700" style={{ height: '600px' }}>
              <div className="text-center">
                <LoadingSpinner size="lg" showProgress={true} progress={loadingProgress} />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-4 mb-2">
                  درخواست پرداخت ارزی
                </h3>
              </div>
            </div>
          )}

          {/* Payment Request Iframe */}
          <iframe
            src="https://auth.rafiei.co/payreq/"
            title="درخواست پرداخت ارزی"
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

export default PaymentRequest;
