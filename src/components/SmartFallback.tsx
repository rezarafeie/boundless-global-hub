import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EnhancedIframe from "@/components/EnhancedIframe";

const SmartFallback = () => {
  const [iframeFailed, setIframeFailed] = useState(false);
  const location = useLocation();

  const iframeSrc = `https://auth.rafiei.co${location.pathname}`;

  console.log(`404 Fallback: Loading iframe for path: ${location.pathname}`);
  console.log(`Iframe source: ${iframeSrc}`);

  const handleIframeError = () => {
    setIframeFailed(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Fallback Error Message */}
      {iframeFailed && (
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

      {/* Enhanced Smart Fallback Iframe */}
      {!iframeFailed && (
        <EnhancedIframe
          src={iframeSrc}
          title={`Fallback content for ${location.pathname}`}
          style={{ 
            height: 'calc(100vh - 4rem)',
            minHeight: 'calc(100vh - 4rem)'
          }}
          onLoad={() => {
            // Additional handling if needed
          }}
        />
      )}
    </div>
  );
};

export default SmartFallback;
