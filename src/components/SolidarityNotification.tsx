
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SolidarityNotification = () => {
  const { language } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-b border-red-100 dark:border-red-900/30">
      <div className="container py-2">
        <Link 
          to="/solidarity" 
          className="flex items-center justify-center gap-2 text-sm text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 transition-colors"
        >
          <Heart className="w-4 h-4 text-red-500" />
          <span>
            {language === 'fa' 
              ? '🇵🇸 همبستگی با مردم مظلوم فلسطین - کمک رسانی' 
              : '🇵🇸 Solidarity with Palestinian People - Humanitarian Aid'
            }
          </span>
        </Link>
      </div>
    </div>
  );
};

export default SolidarityNotification;
