
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
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset loading state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      console.log(`EnhancedIframe: URL changed from ${currentSrc} to ${src}`);
      setIsLoading(true);
      setHasError(false);
      setCurrentSrc(src);
    }
  }, [src, currentSrc]);

  // Initial loading effect
  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  const handleIframeLoad = () => {
    console.log(`EnhancedIframe: Iframe loaded for ${src}`);
    setTimeout(() => {
      setIsLoading(false);
      setHasError(false);
      if (onLoad) {
        onLoad();
      }
    }, 1000);
  };

  const handleIframeError = () => {
    console.error(`EnhancedIframe: Failed to load ${src}`);
    setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 2000);
  };

  if (!src) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="text-center p-8">
          <div className="text-slate-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">لینک موجود نیست</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            در حال حاضر محتوایی برای نمایش وجود ندارد
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">خطا در بارگذاری</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            امکان بارگذاری محتوا وجود ندارد
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (iframeRef.current) {
                iframeRef.current.src = src;
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Purple Loading Animation */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <PurpleLoader className="absolute inset-0" />
        </div>
      )}

      {/* Enhanced Iframe with Smooth Transition */}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className={`w-full h-full border-0 transition-all duration-700 ease-out ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${className}`}
        style={style}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow={allow}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
        loading="eager"
      />
    </div>
  );
};

export default EnhancedIframe;
