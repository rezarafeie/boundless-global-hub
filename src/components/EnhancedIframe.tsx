
import React, { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";

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
      {/* Enhanced Full-screen Loading Animation */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 animate-fade-in">
          <div className="text-center max-w-md px-6">
            {/* Enhanced Brand Logo with Floating Animation */}
            <div className="mb-8">
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
                  <span className="text-white font-bold text-3xl animate-pulse">R</span>
                </div>
                
                {/* Floating glow effect */}
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl opacity-30 animate-pulse-glow blur-lg"></div>
              </div>
              
              <div className="animate-slide-up">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  آکادمی رفیعی
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
                  Rafiei Academy
                </p>
              </div>
            </div>

            {/* Enhanced Progress Bar with Smooth Animation */}
            <div className="w-80 max-w-full mb-6 animate-scale-in">
              <Progress 
                value={loadingProgress} 
                className="h-4 mb-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner" 
              />
              <div className="flex justify-between items-center">
                <p className="text-lg text-gray-700 dark:text-gray-200 font-semibold">
                  {Math.round(loadingProgress)}% بارگذاری شده
                </p>
                <div className="flex space-x-1 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Loading Messages */}
            <div className="text-center animate-fade-up">
              <p className="text-xl text-gray-700 dark:text-gray-200 font-bold mb-2">
                در حال بارگذاری محتوا...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                آماده‌سازی بهترین تجربه یادگیری برای شما
              </p>
            </div>

            {/* Animated decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-xl animate-float-glow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-2xl animate-float-glow" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      )}

      {/* Enhanced Iframe with Smooth Transition */}
      <iframe
        ref={iframeRef}
        src={updatedSrc}
        title={title}
        className={`w-full h-full border-0 transition-all duration-700 ease-out ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${className}`}
        style={style}
        onLoad={handleIframeLoad}
        allow={allow}
      />
    </div>
  );
};

export default EnhancedIframe;
