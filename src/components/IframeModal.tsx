
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import PurpleLoader from "@/components/PurpleLoader";
import Header from "@/components/Layout/Header";

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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Header height constant
  const HEADER_HEIGHT = 64;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeLoaded(false);
      setLoadingProgress(0);
      
      // Start progress simulation
      startProgressSimulation();
      
      // Lock scroll when modal opens
      document.body.style.overflow = 'hidden';
    } else {
      // CRITICAL FIX: Properly restore page state when closing
      document.body.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.pointerEvents = 'auto';
      
      // Clear timers
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.pointerEvents = 'auto';
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen]);

  const startProgressSimulation = () => {
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15; // Random progress increments
      if (progress >= 60) {
        progress = 60;
        setLoadingProgress(progress);
        // At 60% show the iframe
        setTimeout(() => {
          setIsLoading(false);
          setIframeLoaded(true);
        }, 500);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        setLoadingProgress(progress);
      }
    }, 200);
  };

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
    console.log('Iframe loaded successfully');
    // Complete the progress and show iframe
    setLoadingProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setIframeLoaded(true);
    }, 300);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleClose = () => {
    // Ensure proper cleanup before closing
    document.body.style.overflow = 'auto';
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.pointerEvents = 'auto';
    onClose();
  };

  const handleOpenInNewTab = () => {
    // Create a new window with header
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      // Write HTML with header to new window
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .header { 
              height: 64px; 
              background: #000; 
              color: white; 
              display: flex; 
              align-items: center; 
              justify-content: space-between; 
              padding: 0 20px; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo { font-size: 18px; font-weight: bold; }
            .close-btn { 
              background: rgba(255,255,255,0.1); 
              border: none; 
              color: white; 
              padding: 8px 16px; 
              border-radius: 4px; 
              cursor: pointer; 
            }
            .close-btn:hover { background: rgba(255,255,255,0.2); }
            iframe { 
              width: 100%; 
              height: calc(100vh - 64px); 
              border: none; 
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">آکادمی رفیعی</div>
            <button class="close-btn" onclick="window.close()">✕ بستن</button>
          </div>
          <iframe src="${updatedUrl}" title="${title}"></iframe>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  if (!isOpen) return null;

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedUrl = url.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>
      
      {/* Close Button */}
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="absolute top-20 right-4 z-[10000] bg-white/90 hover:bg-white text-black rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="بستن"
        >
          <X size={24} />
        </button>
      )}

      {/* Open in New Tab Button */}
      <button
        onClick={handleOpenInNewTab}
        className="absolute top-20 left-4 z-[10000] bg-black/80 hover:bg-black text-white rounded-lg px-3 py-2 shadow-lg transition-all duration-200 text-sm"
        aria-label="باز کردن در تب جدید"
      >
        تب جدید
      </button>

      {/* Purple Loading Animation with Progress */}
      {isLoading && (
        <div className="absolute inset-0 z-[9998]">
          <PurpleLoader className="absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-lg font-medium mb-4">در حال بارگذاری...</div>
              <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/80 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="text-sm mt-2 opacity-80">{Math.round(loadingProgress)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <div className="flex-1 bg-white overflow-hidden">
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
    </div>
  );
};

export default IframeModal;
