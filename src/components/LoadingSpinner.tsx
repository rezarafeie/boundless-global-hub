
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin border-t-primary`}></div>
        
        {/* Inner pulsing circle */}
        <div className={`absolute inset-2 bg-primary/20 rounded-full animate-pulse`}></div>
        
        {/* Center dot */}
        <div className={`absolute inset-4 bg-primary rounded-full animate-pulse`}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
