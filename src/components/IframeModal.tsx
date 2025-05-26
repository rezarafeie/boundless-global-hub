
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

  // Header height constant
  const HEADER_HEIGHT = 64;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeLoaded(false);
      setLoadingProgress(0);
      
      // Lock scroll when modal opens
      document.body.style.overflow = 'hidden';
      
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
    } else {
      // CRITICAL FIX: Properly restore page state when closing
      document.body.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.pointerEvents = 'auto';
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.pointerEvents = 'auto';
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
            iframeRef.current.src = 'https://auth.rafiei.co/checkout/';
            console.log('Redirecting iframe to checkout after add-to-cart');
          } catch (error) {
            console.log('Iframe redirect handled by server');
          }
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, url]);

  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setIframeLoaded(true);
    }, 300);
  };

  const handleClose = () => {
    // Ensure proper cleanup before closing
    document.body.style.overflow = 'auto';
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.pointerEvents = 'auto';
    onClose();
  };

  if (!isOpen) return null;

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedUrl = url.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <div 
      className="fixed z-[9999]"
      style={{
        top: `${HEADER_HEIGHT}px`,
        left: 0,
        right: 0,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`
      }}
    >
      {/* Close Button */}
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-[10000] bg-white/90 hover:bg-white text-black rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="بستن"
        >
          <X size={24} />
        </button>
      )}

      {/* Enhanced Loading Animation with Progress Bar */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
          <div className="text-center max-w-md">
            {/* Rafiei Academy Branded Loader */}
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-black dark:bg-white rounded-xl flex items-center justify-center animate-pulse">
                <span className="text-white dark:text-black font-bold text-xl">R</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                آکادمی رفیعی
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Rafiei Academy
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-80 mb-4">
              <Progress value={loadingProgress} className="h-3 mb-3" />
              <p className="text-lg text-gray-700 dark:text-gray-200 font-medium">
                {Math.round(loadingProgress)}% بارگذاری شده
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={updatedUrl}
        title={title}
        className={`w-full h-full border-0 transition-opacity duration-500 ${
          iframeLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleIframeLoad}
        allow="fullscreen"
      />
    </div>
  );
};

export default IframeModal;
