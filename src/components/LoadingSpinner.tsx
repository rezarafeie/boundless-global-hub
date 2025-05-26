
import React from 'react';

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
      <div className="relative">
        {/* Main spinning ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin border-t-black`}></div>
        
        {/* Inner pulsing circle */}
        <div className={`absolute inset-2 bg-black/10 rounded-full animate-pulse`}></div>
        
        {/* Center logo/icon */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center animate-pulse">
            <span className="text-white text-xs font-bold">R</span>
          </div>
        </div>
      </div>
      
      {/* Progress indicator */}
      {showProgress && (
        <div className="mt-4 text-center">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-black transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {Math.round(progress)}% تکمیل شده
          </p>
        </div>
      )}
      
      {/* Loading text */}
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600 animate-pulse">
          در حال بارگذاری...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
