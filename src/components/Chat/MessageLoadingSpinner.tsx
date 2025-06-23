
import React from 'react';

interface MessageLoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const MessageLoadingSpinner: React.FC<MessageLoadingSpinnerProps> = ({ 
  text = 'در حال بارگذاری پیام‌ها...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`${sizeClasses[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3`}></div>
      <p className="text-slate-600 dark:text-slate-400 text-sm">{text}</p>
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default MessageLoadingSpinner;
