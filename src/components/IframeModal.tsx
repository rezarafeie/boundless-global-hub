
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface IframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  height?: string;
}

const IframeModal: React.FC<IframeModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  height = "600px"
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeLoaded(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setTimeout(() => {
      setIframeLoaded(true);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10000] bg-white/90 hover:bg-white text-black rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="بستن"
      >
        <X size={24} />
      </button>

      {/* Enhanced Loading Animation */}
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

            {/* Animated dots loader */}
            <div className="flex justify-center items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            <p className="text-lg text-gray-700 animate-pulse">در حال بارگذاری...</p>
            
            {/* Progress bar */}
            <div className="w-64 h-1 bg-gray-200 rounded-full mx-auto mt-4 overflow-hidden">
              <div className="h-full bg-black rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={url}
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
