
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface PurpleLoaderProps {
  className?: string;
}

const PurpleLoader: React.FC<PurpleLoaderProps> = ({ className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} ${className}`}>
      {/* Logo with theme-based color */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
        <span className={`text-2xl font-bold ${isDarkMode ? 'text-black' : 'text-white'}`}>R</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
      </div>
      
      {/* Loading Dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
      
      {/* Loading Text */}
      <p className={`mt-6 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>در حال بارگذاری...</p>
    </div>
  );
};

export default PurpleLoader;
