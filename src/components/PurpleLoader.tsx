
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface PurpleLoaderProps {
  className?: string;
}

const PurpleLoader: React.FC<PurpleLoaderProps> = ({ className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 ${className}`}>
      {/* Logo with white background */}
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
        <span className="text-2xl font-bold text-purple-600">R</span>
      </div>
      
      {/* Academy Title */}
      <h2 className="text-white text-xl font-bold mb-2">آکادمی رفیعی</h2>
      <p className="text-white/80 text-sm mb-8">Rafiei Academy</p>
      
      {/* Progress Bar */}
      <div className="w-64 bg-white/20 rounded-full h-2 mb-6">
        <div className="bg-white h-2 rounded-full animate-pulse" style={{width: '47%'}}></div>
      </div>
      
      {/* Progress Text */}
      <p className="text-white/90 text-sm mb-4">47% بارگذاری شده</p>
      
      {/* Loading Dots */}
      <div className="flex space-x-1 mb-6">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
      
      {/* Loading Text */}
      <p className="text-white/80 text-sm">در حال بارگذاری محتوا...</p>
      <p className="text-white/60 text-xs mt-1">آماده‌سازی بهترین تجربه یادگیری برای شما</p>
    </div>
  );
};

export default PurpleLoader;
