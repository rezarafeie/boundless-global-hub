
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SolidarityNotification = () => {
  const { language } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 dark:from-red-950 dark:via-red-900 dark:to-red-950 border-b-2 border-red-600 dark:border-red-700 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
        <div className="absolute top-2 right-1/3 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-1 left-1/2 w-2.5 h-2.5 bg-red-300 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-2 right-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container py-4 relative">
        <Link 
          to="/solidarity" 
          className="flex items-center justify-center gap-4 text-base font-bold text-white hover:text-red-100 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 animate-pulse" fill="currentColor" />
            <Zap className="w-5 h-5 text-orange-400 animate-bounce" />
          </div>
          <span className="text-lg font-black group-hover:scale-105 transition-transform duration-200 tracking-wide">
            {language === 'fa' 
              ? '🇮🇷 حالت اضطراری جنگ فعال شد : مشاهده صفحه همبستگی' 
              : '🇮🇷 Emergency War Mode Activated: View Solidarity Page'
            }
          </span>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
            <AlertTriangle className="w-6 h-6 text-yellow-400 animate-pulse" fill="currentColor" style={{ animationDelay: '0.7s' }} />
          </div>
        </Link>
      </div>
      
      {/* Pulsing border effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-pulse"></div>
    </div>
  );
};

export default SolidarityNotification;
