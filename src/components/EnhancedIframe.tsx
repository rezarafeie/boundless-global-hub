
import React, { useState, useEffect, useRef } from "react";
import PurpleLoader from "@/components/PurpleLoader";

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
  const [currentSrc, setCurrentSrc] = useState(src);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset loading state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      console.log(`EnhancedIframe: URL changed from ${currentSrc} to ${src}`);
      setIsLoading(true);
      setCurrentSrc(src);
    }
  }, [src, currentSrc]);

  // Initial loading effect
  useEffect(() => {
    setIsLoading(true);
  }, []);

  const handleIframeLoad = () => {
    console.log(`EnhancedIframe: Iframe loaded for ${src}`);
    setTimeout(() => {
      setIsLoading(false);
      if (onLoad) {
        onLoad();
      }
    }, 800);
  };

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedSrc = src.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <div className="relative w-full h-full">
      {/* Purple Loading Animation */}
      {isLoading && (
        <PurpleLoader className="absolute inset-0 z-50" />
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
