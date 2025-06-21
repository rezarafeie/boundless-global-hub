
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bell, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HubCTA = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-lg">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="flex justify-center gap-3 mb-4">
            <div className="relative">
              <Bell className="w-8 h-8 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="relative">
              <MessageCircle className="w-8 h-8 text-green-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="relative">
              <Video className="w-8 h-8 text-red-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            📢 مرکز بدون مرز فعال شد
          </h3>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            برای دسترسی به اطلاعیه‌ها، پخش زنده، و چت گروهی وارد شوید.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => navigate('/hub')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 px-8 py-3 text-lg"
            >
              ✨ ورود به مرکز بدون مرز
            </Button>
            
            <Button 
              onClick={() => navigate('/hub/chat')}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 px-6 py-3"
            >
              💬 گفتگوی مستقیم
            </Button>
          </div>
          
          <div className="mt-6 flex justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Bell className="w-4 h-4" />
              <span>اطلاعیه‌ها</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>چت زنده</span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span>پخش زنده</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HubCTA;
