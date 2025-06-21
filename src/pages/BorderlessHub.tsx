
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Megaphone, 
  Users, 
  Calendar,
  BookOpen,
  TrendingUp,
  Globe,
  ArrowLeft,
  Zap
} from 'lucide-react';
import ChatSection from '@/components/Chat/ChatSection';
import HubSection from '@/components/Chat/HubSection';
import RafieiMeetSection from '@/components/Chat/RafieiMeetSection';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';

const BorderlessHub: React.FC = () => {
  const { settings } = useRafieiMeet();

  const features = [
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
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              هاب بدون مرز
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              مرکز فعالیت‌های تعاملی، گفتگوها و ابزارهای آموزشی
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Features */}
            <div className="lg:col-span-2 space-y-6">
              {/* Messenger Access Card */}
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900 dark:text-white">
                        پیام‌رسان بدون مرز
                      </CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        ارتباط با پشتیبان‌ها و شرکت در گفتگوهای گروهی
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        گفتگوی گروهی
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        پشتیبانی خصوصی
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Megaphone className="w-3 h-3 mr-1" />
                        اطلاعیه‌ها
                      </Badge>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                        امکانات پیام‌رسان:
                      </h4>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>• گفتگوی عمومی برای همه کاربران</li>
                        <li>• گروه اختصاصی دانش‌پذیران بدون مرز</li>
                        <li>• چت خصوصی با تیم پشتیبانی</li>
                        <li>• دریافت اطلاعیه‌های مهم</li>
                      </ul>
                    </div>
                    
                    <Link to="/hub/messenger">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-12 rounded-2xl font-medium">
                        ورود به پیام‌رسان
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Live Sections */}
              {settings && <RafieiMeetSection settings={settings} />}
              <HubSection />

              {/* Quick Access Features */}
              <div className="grid md:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <Link key={index} to={feature.href}>
                    <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                      <CardContent className="p-6 text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${feature.color}`}>
                          <feature.icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column - Legacy Chat */}
            <div className="space-y-6">
              <ChatSection />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
