
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import PurpleLoader from "@/components/PurpleLoader";
import EnrollHeader from "@/components/Layout/EnrollHeader";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Header height constant
  const HEADER_HEIGHT = 64;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeLoaded(false);
      
      // Lock scroll when modal opens
      document.body.style.overflow = 'hidden';
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
    setTimeout(() => {
      setIsLoading(false);
      setIframeLoaded(true);
    }, 800);
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
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0">
        <EnrollHeader showBackButton={false} />
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

      {/* Purple Loading Animation */}
      {isLoading && (
        <PurpleLoader className="absolute inset-0" />
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
