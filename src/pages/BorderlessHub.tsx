
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  Calendar,
  BookOpen,
  TrendingUp,
  Globe,
  ArrowLeft,
  Zap,
  Bell
} from 'lucide-react';
import ChatSection from '@/components/Chat/ChatSection';
import HubSection from '@/components/Chat/HubSection';
import RafieiMeetSection from '@/components/Chat/RafieiMeetSection';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { useAnnouncements } from '@/hooks/useRealtime';

const BorderlessHub: React.FC = () => {
  const { settings } = useRafieiMeet();
  const { announcements } = useAnnouncements();

  const quickAccessFeatures = [
    {
      title: 'آرشیو دوره‌ها',
      description: 'دسترسی به تمام دوره‌های آموزشی',
      icon: BookOpen,
      href: '/courses',
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'مرکز ارزیابی',
      description: 'تست‌های شخصیت‌شناسی و ارزیابی',
      icon: TrendingUp,
      href: '/assessment-center',
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
    },
    {
      title: 'وبسایت اصلی',
      description: 'بازگشت به صفحه اصلی',
      icon: Globe,
      href: '/',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              هاب بدون مرز
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              مرکز فعالیت‌های تعاملی، گفتگوها و ابزارهای آموزشی
            </p>
          </div>

          {/* Live Sessions - Only show if active */}
          {settings?.is_active && (
            <div className="mb-8">
              <RafieiMeetSection settings={settings} />
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-8">
            {/* Boundless Messenger CTA */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1">
                <div className="bg-white dark:bg-slate-800 rounded-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                          <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-slate-900 dark:text-white mb-2">
                            پیام‌رسان بدون مرز
                          </CardTitle>
                          <p className="text-slate-600 dark:text-slate-400">
                            ارتباط مستقیم با جامعه و پشتیبانی
                          </p>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          گفتگوی گروهی
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          پشتیبانی آنلاین
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            گفتگوهای گروهی
                          </h4>
                          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              گفتگوی عمومی برای همه کا‍ربران
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              گروه اختصاصی دانش‌پذیران بدون مرز
                            </li>
                          </ul>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-green-500" />
                            پشتیبانی خصوصی
                          </h4>
                          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              چت مستقیم با تیم پشتیبانی
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              پاسخ سریع به سوالات شما
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      <Link to="/hub/messenger" className="block">
                        <Button className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all">
                          ورود به پیام‌رسان
                          <ArrowLeft className="w-5 h-5 mr-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>

            {/* Announcements */}
            {announcements.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Bell className="w-6 h-6 text-amber-500" />
                    آخرین اطلاعیه‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.slice(0, 3).map((announcement) => (
                      <div key={announcement.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                              {announcement.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {announcement.summary}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {announcement.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hub Section */}
            <HubSection />

            {/* Quick Access Features */}
            <div className="grid md:grid-cols-3 gap-6">
              {quickAccessFeatures.map((feature, index) => (
                <Link key={index} to={feature.href}>
                  <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <CardContent className="p-8 text-center">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${feature.color}`}>
                        <feature.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Legacy Chat - Smaller section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <ChatSection />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
