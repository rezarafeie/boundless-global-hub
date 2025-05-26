
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  showProgress = false,
  progress = 0
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-6">
        {/* Main spinning ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin border-t-black`}></div>
        
        {/* Center logo/icon */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
        </div>
      </div>
      
      {/* Progress indicator */}
      {showProgress && (
        <div className="w-64 mb-4">
          <Progress value={progress} className="h-3 mb-3" />
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium text-center">
            {Math.round(progress)}% بارگذاری شده
          </p>
        </div>
      )}
      
      {/* Loading text */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          در حال بارگذاری...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
