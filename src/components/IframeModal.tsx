
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface IframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  height?: string;
  showCloseButton?: boolean;
}

const IframeModal: React.FC<IframeModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  height = "600px",
  showCloseButton = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeLoaded(false);
      setLoadingProgress(0);
      document.body.style.overflow = 'hidden';
      
      // Simulate progressive loading
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => {
        clearInterval(progressInterval);
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && showCloseButton) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, showCloseButton]);

  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        setIframeLoaded(true);
      }, 150);
    }, 300);
  };

  if (!isOpen) return null;

  const updatedUrl = url.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
      {/* Close Button - conditionally rendered */}
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[10000] bg-white/95 hover:bg-white text-black rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          aria-label="بستن"
        >
          <X size={24} />
        </button>
      )}

      {/* Enhanced Loading Animation */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100">
          <div className="text-center max-w-md mx-auto px-6">
            {/* Rafiei Academy Branded Loader */}
            <div className="mb-8">
              <div className="relative">
                {/* Animated logo */}
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center shadow-lg transform animate-pulse">
                  <span className="text-white font-bold text-2xl">R</span>
                </div>
                
                {/* Animated rings around logo */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 border-2 border-black/20 rounded-full animate-ping"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-22 h-22 border border-black/10 rounded-full animate-ping animation-delay-75"></div>
                
                {/* Brand text with enhanced animation */}
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-gray-800 animate-fade-in">
                    آکادمی رفیعی
                  </h3>
                  <p className="text-gray-600 font-medium animate-fade-in animation-delay-150">
                    Rafiei Academy
                  </p>
                  <p className="text-sm text-gray-500 animate-fade-in animation-delay-300">
                    مرجع آموزش کسب‌وکارهای بدون مرز
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced loading indicators */}
            <div className="space-y-6">
              {/* Animated dots loader */}
              <div className="flex justify-center items-center space-x-2">
                <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              
              <p className="text-lg text-gray-700 font-medium animate-pulse">در حال بارگذاری...</p>
              
              {/* Enhanced progress bar */}
              <div className="w-80 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-black via-gray-800 to-black rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                </div>
              </div>
              
              {/* Loading percentage */}
              <p className="text-sm text-gray-600 font-mono">
                {Math.round(loadingProgress)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={updatedUrl}
        title={title}
        className={`w-full h-full border-0 transition-opacity duration-500 ${
          iframeLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden'
        }}
        onLoad={handleIframeLoad}
        allow="fullscreen"
      />
    </div>
  );
};

export default IframeModal;
