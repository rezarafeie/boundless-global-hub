
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SolidarityNotification = () => {
  const { language } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40 border-b border-emerald-200 dark:border-emerald-800/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <div className="absolute top-2 right-1/3 w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-1 left-1/2 w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>
      </div>
      
      <div className="container py-3 relative">
        <Link 
          to="/solidarity" 
          className="flex items-center justify-center gap-3 text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-all duration-300 group"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" />
            <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" />
          </div>
          <span className="font-medium group-hover:scale-105 transition-transform duration-200">
            {language === 'fa' 
              ? '🇮🇷 همبستگی با مردم عزیز ایران - کمک رسانی و حمایت' 
              : '🇮🇷 Solidarity with Iranian People - Humanitarian Aid & Support'
            }
          </span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" style={{ animationDelay: '0.5s' }} />
            <Heart className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" style={{ animationDelay: '0.3s' }} />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SolidarityNotification;
