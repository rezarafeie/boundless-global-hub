
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";

const PaymentRequest = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
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
          {/* Loading Animation */}
          {isLoading && (
            <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700" style={{ height: '600px' }}>
              <div className="text-center">
                <div className="mb-8">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto mb-4 bg-black dark:bg-white rounded-xl flex items-center justify-center animate-pulse">
                      <span className="text-white dark:text-black font-bold text-xl">₿</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white animate-pulse mb-2">
                      درخواست پرداخت ارزی
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 animate-pulse">
                      در حال بارگذاری...
                    </p>
                  </div>
                </div>
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
