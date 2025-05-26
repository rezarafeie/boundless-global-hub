
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
  showCloseButton = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeLoaded(false);
      setLoadingProgress(0);
      document.body.style.overflow = 'hidden';
      
      // Simulate progressive loading - slower progress
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 6; // Reduced for slower progress
        });
      }, 200); // Slightly slower updates

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

    if (isOpen) {
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
            // Redirect to checkout page after add-to-cart processes
            iframeRef.current.src = 'https://auth.rafiei.co/checkout/';
            console.log('Redirecting to checkout after add-to-cart');
          } catch (error) {
            console.log('Iframe redirect handled by server');
          }
        }
      }, 3000); // Increased to 3 seconds to ensure add-to-cart processes

      return () => clearTimeout(timer);
    }
  }, [isOpen, url]);

  const handleIframeLoad = () => {
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setIframeLoaded(true);
    }, 400);
  };

  if (!isOpen) return null;

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedUrl = url.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100">
          <div className="text-center">
            {/* Rafiei Academy Branded Loader */}
            <div className="mb-8">
              <div className="relative">
                {/* Animated logo placeholder */}
                <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-xl flex items-center justify-center animate-pulse">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                
                {/* Pulsing brand text */}
                <h3 className="text-2xl font-bold text-gray-800 animate-pulse mb-2">
                  آکادمی رفیعی
                </h3>
                <p className="text-gray-600 animate-pulse">
                  Rafiei Academy
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mb-4">
              <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-black transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                ></div>
              </div>
              <p className="text-lg text-gray-700 font-medium">
                {Math.round(loadingProgress)}% تکمیل شده
              </p>
            </div>
            
            <p className="text-lg text-gray-700 animate-pulse">در حال بارگذاری...</p>
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
