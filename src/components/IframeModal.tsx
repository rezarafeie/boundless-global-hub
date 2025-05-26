
import React, { useState, useEffect, useRef } from "react";
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
  showCloseButton = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Header height constant - adjusted for perfect positioning
  const HEADER_HEIGHT = 64;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeLoaded(false);
      setLoadingProgress(0);
      document.body.style.overflow = 'hidden';
      
      // Slower progressive loading
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 85) {
            clearInterval(interval);
            return 85;
          }
          return prev + Math.random() * 3; // Much slower progress
        });
      }, 400); // Slower updates

      return () => clearInterval(interval);
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

    if (isOpen && showCloseButton) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, showCloseButton]);

  // Enhanced automatic checkout redirect for add-to-cart URLs
  useEffect(() => {
    if (isOpen && url.includes('add-to-cart')) {
      const timer = setTimeout(() => {
        if (iframeRef.current) {
          try {
            // Direct iframe redirect to checkout page
            iframeRef.current.src = 'https://auth.rafiei.co/checkout/';
            console.log('Redirecting iframe to checkout after add-to-cart');
          } catch (error) {
            console.log('Iframe redirect handled by server');
          }
        }
      }, 2000); // Faster redirect - 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, url]);

  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setIframeLoaded(true);
    }, 600); // Slightly slower transition
  };

  if (!isOpen) return null;

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedUrl = url.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50">
      {/* Close Button - conditionally rendered */}
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[10000] bg-white/90 hover:bg-white text-black rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="بستن"
        >
          <X size={24} />
        </button>
      )}

      {/* Enhanced Loading Animation with Progress */}
      {isLoading && (
        <div 
          className="absolute left-0 right-0 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700"
          style={{
            top: `${HEADER_HEIGHT}px`,
            height: `calc(100vh - ${HEADER_HEIGHT}px)`
          }}
        >
          <div className="text-center">
            {/* Rafiei Academy Branded Loader */}
            <div className="mb-8">
              <div className="relative">
                {/* Animated logo placeholder */}
                <div className="w-16 h-16 mx-auto mb-4 bg-black dark:bg-white rounded-xl flex items-center justify-center animate-pulse">
                  <span className="text-white dark:text-black font-bold text-xl">R</span>
                </div>
                
                {/* Pulsing brand text */}
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white animate-pulse mb-2">
                  آکادمی رفیعی
                </h3>
                <p className="text-gray-600 dark:text-gray-300 animate-pulse">
                  Rafiei Academy
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mb-4">
              <div className="w-64 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-black dark:bg-white transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                ></div>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-200 font-medium">
                {Math.round(loadingProgress)}% تکمیل شده
              </p>
            </div>
            
            <p className="text-lg text-gray-700 dark:text-gray-200 animate-pulse">در حال بارگذاری...</p>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={updatedUrl}
        title={title}
        className={`w-full border-0 transition-opacity duration-500 ${
          iframeLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          position: 'fixed',
          top: `${HEADER_HEIGHT}px`,
          left: 0,
          width: '100vw',
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          overflow: 'hidden'
        }}
        onLoad={handleIframeLoad}
        allow="fullscreen"
      />
    </div>
  );
};

export default IframeModal;
