
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageSquare, Radio, Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const HubCTABanner = () => {
  const { language } = useLanguage();

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-950/20 dark:to-blue-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-6 md:p-8 my-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center gap-2 text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          <span>📢</span>
          <h3>{language === 'en' ? 'Borderless Hub is Now Active' : 'مرکز بدون مرز فعال شد'}</h3>
        </div>
        
        <p className="text-slate-700 dark:text-slate-300 text-lg max-w-2xl mx-auto">
          {language === 'en' 
            ? 'Access announcements, group discussions, and live streams all in one place.'
            : 'برای دسترسی به اطلاعیه‌ها، گفت‌وگوهای گروهی، و پخش زنده وارد شوید.'
          }
        </p>

        <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link to="/hub" className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {language === 'en' ? 'Enter Borderless Hub' : 'ورود به مرکز بدون مرز'}
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 mt-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>{language === 'en' ? 'Live Announcements' : 'اطلاعیه‌های زنده'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>{language === 'en' ? 'Group Chat' : 'گفتگوی گروهی'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500" />
            <span>{language === 'en' ? 'Live Streaming' : 'پخش زنده'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubCTABanner;
