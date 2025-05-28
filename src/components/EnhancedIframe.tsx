
import React, { useState, useEffect, useRef } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EnhancedIframeProps {
  src: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
  allow?: string;
  onLoad?: () => void;
}

const EnhancedIframe: React.FC<EnhancedIframeProps> = ({
  src,
  title,
  className = "",
  style = {},
  allow = "fullscreen",
  onLoad
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset loading state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      console.log(`EnhancedIframe: URL changed from ${currentSrc} to ${src}`);
      setIsLoading(true);
      setLoadingProgress(0);
      setCurrentSrc(src);
      
      // Start progressive loading animation
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
    }
  }, [src, currentSrc]);

  // Initial loading effect
  useEffect(() => {
    setIsLoading(true);
    setLoadingProgress(0);
    
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
    console.log(`EnhancedIframe: Iframe loaded for ${src}`);
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      if (onLoad) {
        onLoad();
      }
    }, 300);
  };

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedSrc = src.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <div className="relative w-full h-full">
      {/* Full-screen Loading Animation */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
          <div className="text-center max-w-md">
            {/* Rafiei Academy Branded Loader */}
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-black dark:bg-white rounded-xl flex items-center justify-center animate-pulse">
                <span className="text-white dark:text-black font-bold text-2xl">R</span>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                آکادمی رفیعی
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Rafiei Academy
              </p>
            </div>

            {/* Enhanced Loading Spinner with Progress */}
            <LoadingSpinner size="lg" showProgress={true} progress={loadingProgress} />
            
            <div className="mt-6">
              <p className="text-xl text-gray-700 dark:text-gray-200 font-medium">
                در حال بارگذاری محتوا...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                لطفاً صبر کنید
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Iframe */}
      <iframe
        ref={iframeRef}
        src={updatedSrc}
        title={title}
        className={`w-full h-full border-0 transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        style={style}
        onLoad={handleIframeLoad}
        allow={allow}
      />
    </div>
  );
};

export default EnhancedIframe;
