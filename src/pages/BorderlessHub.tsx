import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bell, Video, Play, BookOpen, ClipboardCheck, Home, Settings } from 'lucide-react';
import { useAnnouncements, useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { Link } from 'react-router-dom';
import AnnouncementMedia from '@/components/Chat/AnnouncementMedia';
import EnhancedLiveStreamCard from '@/components/Chat/EnhancedLiveStreamCard';
import EnhancedRafieiMeetCard from '@/components/Chat/EnhancedRafieiMeetCard';
import { motion } from 'framer-motion';

const BorderlessHub = () => {
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { liveSettings } = useLiveSettings();
  const { settings: rafieiMeetSettings } = useRafieiMeet();
  const [sessionToken, setSessionToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('messenger_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
    }
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const quickAccessItems = [
    {
      title: 'صفحه اصلی',
      description: 'بازگشت به صفحه اصلی',
      icon: Home,
      href: '/',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      title: 'دوره‌ها',
      description: 'مشاهده تمام دوره‌های آموزشی',
      icon: BookOpen,
      href: '/courses',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      title: 'آزمون‌ها',
      description: 'مرکز ارزیابی و آزمون‌ها',
      icon: ClipboardCheck,
      href: '/assessment',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section with Glows */}
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 pt-20 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                🌟 هاب بدون مرز
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                مرکز ارتباطات، اطلاعیه‌ها و جلسات تصویری
              </p>
            </div>
          </motion.div>

          {/* Main Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Messenger Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link to="/hub/messenger">
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                          💬 پیام‌رسان
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          گفتگو و ارتباط با دیگران
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      به گفتگوهای گروهی بپیوندید، با پشتیبانی در ارتباط باشید و با سایر اعضای جامعه بدون مرز تعامل کنید.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">گفتگوی زنده</Badge>
                      <Badge variant="outline">پشتیبانی</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Announcements Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">📢 اطلاعیه‌ها</CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        آخرین اخبار و اطلاعیه‌ها
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {announcementsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : announcements.length > 0 ? (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {announcements.slice(0, 3).map((announcement) => (
                        <div key={announcement.id} className="p-3 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={announcement.type === 'urgent' ? 'destructive' : 'secondary'}>
                              {announcement.type === 'urgent' ? '🚨 فوری' : '📝 عمومی'}
                            </Badge>
                            {announcement.is_pinned && (
                              <Badge variant="outline">📌 سنجاق</Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                            {announcement.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {announcement.summary}
                          </p>
                          {announcement.media_type !== 'none' && (
                            <div className="mt-2">
                              <AnnouncementMedia 
                                title={announcement.title}
                                mediaType={announcement.media_type} 
                                mediaUrl={announcement.media_url} 
                                mediaContent={announcement.media_content} 
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">
                        اطلاعیه‌ای موجود نیست
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Live Stream & Rafiei Meet Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Live Stream Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <EnhancedLiveStreamCard 
                isActive={liveSettings?.is_live || false}
                streamCode={liveSettings?.stream_code}
                title={liveSettings?.title}
                viewers={liveSettings?.viewers}
              />
            </motion.div>

            {/* Rafiei Meet Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <EnhancedRafieiMeetCard 
                isActive={rafieiMeetSettings?.is_active || false}
                meetUrl={rafieiMeetSettings?.meet_url}
                title={rafieiMeetSettings?.title}
                description={rafieiMeetSettings?.description}
              />
            </motion.div>
          </div>

          {/* Quick Access Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-8">
              🚀 دسترسی سریع
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'صفحه اصلی',
                  description: 'بازگشت به صفحه اصلی',
                  icon: Home,
                  href: '/',
                  color: 'bg-gradient-to-br from-blue-500 to-blue-600'
                },
                {
                  title: 'دوره‌ها',
                  description: 'مشاهده تمام دوره‌های آموزشی',
                  icon: BookOpen,
                  href: '/courses',
                  color: 'bg-gradient-to-br from-green-500 to-green-600'
                },
                {
                  title: 'آزمون‌ها',
                  description: 'مرکز ارزیابی و آزمون‌ها',
                  icon: ClipboardCheck,
                  href: '/assessment',
                  color: 'bg-gradient-to-br from-purple-500 to-purple-600'
                }
              ].map((item, index) => (
                <Link key={index} to={item.href}>
                  <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`inline-flex p-4 rounded-2xl ${item.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Admin Access */}
          {sessionToken && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center"
            >
              <Link to="/hub/admin">
                <Button variant="outline" className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 hover:bg-white/90 dark:hover:bg-slate-800/90">
                  <Settings className="w-4 h-4 mr-2" />
                  پنل مدیریت
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
