
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, Video, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LiveStreamCard from './LiveStreamCard';
import RafieiMeetCard from './RafieiMeetCard';

interface HubSectionProps {
  liveSettings?: {
    is_live: boolean;
    stream_code?: string;
    title?: string;
    viewers?: number;
  };
  rafieiMeetSettings?: {
    is_active: boolean;
    meet_url?: string;
    title?: string;
    description?: string;
  };
  showFullChat?: boolean;
}

const HubSection: React.FC<HubSectionProps> = ({ 
  liveSettings, 
  rafieiMeetSettings, 
  showFullChat = false 
}) => {
  const isLiveActive = liveSettings?.is_live || false;
  const isMeetActive = rafieiMeetSettings?.is_active || false;

  return (
    <section className="force-dark py-20 px-4 bg-gradient-to-b from-gray-800/90 to-black/90 backdrop-blur-sm border-t border-red-800/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-full mb-8 shadow-2xl">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            مرکز ارتباط بدون مرز
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-4xl mx-auto">
            اطلاعیه‌ها، گفتگوی زنده، جلسات تصویری و پخش مستقیم - همه در یک مکان
          </p>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Live Stream Card */}
          <LiveStreamCard
            isActive={isLiveActive}
            streamCode={liveSettings?.stream_code}
            title={liveSettings?.title}
            viewers={liveSettings?.viewers}
          />

          {/* Rafiei Meet Card */}
          <RafieiMeetCard
            isActive={isMeetActive}
            meetUrl={rafieiMeetSettings?.meet_url}
            title={rafieiMeetSettings?.title}
            description={rafieiMeetSettings?.description}
          />
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Announcements Card */}
          <Card className="force-dark-card bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Bell className="w-6 h-6 text-blue-400" />
                اطلاعیه‌های مهم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                آخرین اخبار و اطلاعیه‌های مهم از تیم بدون مرز
              </p>
              <Link to="/hub">
                <Button className="w-full bg-blue-700 hover:bg-blue-600">
                  مشاهده اطلاعیه‌ها
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card className="force-dark-card bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-green-500/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="relative">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                چت گروهی زنده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                به گفتگوی زنده اعضای جامعه بدون مرز بپیوندید
              </p>
              <Link to="/hub">
                <Button className="w-full bg-green-700 hover:bg-green-600">
                  ورود به چت
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Hub Access Card */}
          <Card className="force-dark-card bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Wifi className="w-6 h-6 text-purple-400" />
                دسترسی کامل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                دسترسی کامل به تمام امکانات مرکز ارتباط
              </p>
              <Link to="/hub">
                <Button className="w-full bg-purple-700 hover:bg-purple-600">
                  ورود به مرکز ارتباط
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HubSection;
