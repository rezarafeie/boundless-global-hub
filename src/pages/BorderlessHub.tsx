import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bell, Video, Play, BookOpen, ClipboardCheck, Home, Settings, Maximize, WifiOff } from 'lucide-react';
import { useAnnouncements, useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { Link } from 'react-router-dom';
import AnnouncementModal from '@/components/Chat/AnnouncementModal';
import { motion } from 'framer-motion';

const BorderlessHub = () => {
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { liveSettings } = useLiveSettings();
  const { settings: rafieiMeetSettings } = useRafieiMeet();
  const { isOnline } = useOfflineDetection();
  const [sessionToken, setSessionToken] = useState<string>('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('messenger_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
    }
  }, []);

  const isLiveActive = liveSettings?.is_live || false;
  const isMeetActive = rafieiMeetSettings?.is_active || false;
  const hasActiveLiveContent = isLiveActive || isMeetActive;

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

  const openAnnouncementModal = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const getSummary = (text: string) => {
    if (text.length <= 150) return text;
    return text.substring(0, 150) + '...';
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 pt-20">
        {/* Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Offline Banner */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-3">
                    <WifiOff className="w-6 h-6" />
                    <div className="text-center">
                      <h3 className="font-bold">⚠️ حالت آفلاین</h3>
                      <p className="text-sm text-orange-100">
                        اتصال به اینترنت برقرار نیست. برخی قابلیت‌ها محدود هستند.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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

          {/* Live Sections - Only Show at Top When Active and Online */}
          {hasActiveLiveContent && isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              {/* Rafiei Meet Active */}
              {isMeetActive && rafieiMeetSettings && (
                <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-2xl mb-6">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                          <h2 className="text-2xl font-bold">🎥 Live Now: {rafieiMeetSettings.title}</h2>
                        </div>
                        <p className="text-red-100 mb-6">{rafieiMeetSettings.description}</p>
                        <div className="flex gap-4">
                          <Button 
                            asChild
                            className="bg-white text-red-600 hover:bg-red-50"
                          >
                            <a href={rafieiMeetSettings.meet_url} target="_blank" rel="noopener noreferrer">
                              <Video className="w-5 h-5 mr-2" />
                              ورود به جلسه
                            </a>
                          </Button>
                          <Button 
                            variant="outline"
                            className="border-white text-white hover:bg-white/10"
                          >
                            <Maximize className="w-5 h-5 mr-2" />
                            تمام صفحه
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aparat Live Active */}
              {isLiveActive && liveSettings && (
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                          <h2 className="text-2xl font-bold">📺 Live Stream: {liveSettings.title}</h2>
                        </div>
                        <p className="text-purple-100 mb-6">پخش زنده در حال انجام - {liveSettings.viewers} بیننده</p>
                        <div className="flex gap-4">
                          <Button 
                            className="bg-white text-purple-600 hover:bg-purple-50"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            مشاهده پخش زنده
                          </Button>
                          <Button 
                            variant="outline"
                            className="border-white text-white hover:bg-white/10"
                          >
                            <Maximize className="w-5 h-5 mr-2" />
                            تمام صفحه
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Notices Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-center gap-3">
                <Bell className="w-8 h-8 text-green-500" />
                📢 اطلاعیه‌ها
              </h2>
            </div>

            {!isOnline ? (
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20">
                <CardContent className="p-12 text-center">
                  <WifiOff className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    اطلاعیه‌ها در حالت آفلاین
                  </h3>
                  <p className="text-slate-500 dark:text-slate-500">
                    برای مشاهده اطلاعیه‌ها به اینترنت نیاز دارید.
                  </p>
                </CardContent>
              </Card>
            ) : announcementsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6" dir="rtl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge variant={announcement.type === 'urgent' ? 'destructive' : 'secondary'} className="text-sm">
                            {announcement.type === 'urgent' ? '🚨 فوری' : '📝 عمومی'}
                          </Badge>
                          {announcement.is_pinned && (
                            <Badge variant="outline">📌 سنجاق شده</Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                        {announcement.title}
                      </h3>
                      
                      <div className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {getSummary(announcement.full_text)}
                      </div>

                      {announcement.full_text.length > 150 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openAnnouncementModal(announcement)}
                          className="mb-4"
                        >
                          ادامه مطلب
                        </Button>
                      )}

                      {announcement.views !== undefined && (
                        <div className="text-xs text-slate-400">
                          👁️ {announcement.views} بازدید
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20">
                <CardContent className="p-12 text-center">
                  <Bell className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    اطلاعیه‌ای موجود نیست
                  </h3>
                  <p className="text-slate-500 dark:text-slate-500">
                    هنوز اطلاعیه‌ای منتشر نشده است. لطفاً بعداً مراجعه کنید.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Messenger Access Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            {isOnline ? (
              <Link to="/hub/messenger">
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 cursor-pointer">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6">
                      <div className="inline-flex p-4 rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <MessageCircle className="w-12 h-12" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">✉️ پیام‌رسان بدون مرز</h2>
                    <p className="text-blue-100 text-lg mb-6">
                      وارد گفتگوها شوید و با دانشجوها و پشتیبان در ارتباط باشید
                    </p>
                    <Button 
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 transform group-hover:scale-105 transition-all duration-200"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      ورود به پیام‌رسان
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 opacity-60">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="inline-flex p-4 rounded-full bg-slate-200 dark:bg-slate-700">
                      <WifiOff className="w-12 h-12 text-slate-400" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-slate-600 dark:text-slate-400">✉️ پیام‌رسان بدون مرز</h2>
                  <p className="text-slate-500 dark:text-slate-500 text-lg mb-6">
                    برای استفاده از پیام‌رسان به اینترنت نیاز دارید
                  </p>
                  <Button disabled className="bg-slate-300 dark:bg-slate-700 text-slate-500">
                    فعلاً غیرفعال است
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Live Cards - Show Below When Inactive */}
          {!hasActiveLiveContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inactive Rafiei Meet Card */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 opacity-60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Video className="w-6 h-6" />
                      🎥 جلسه تصویری رفیعی
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 dark:text-slate-500 mb-4">
                      در حال حاضر غیرفعال است
                    </p>
                    <Button disabled className="w-full bg-slate-300 dark:bg-slate-700 text-slate-500">
                      فعلاً غیرفعال است
                    </Button>
                  </CardContent>
                </Card>

                {/* Inactive Live Stream Card */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 opacity-60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Play className="w-6 h-6" />
                      📺 پخش زنده
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 dark:text-slate-500 mb-4">
                      در حال حاضر غیرفعال است
                    </p>
                    <Button disabled className="w-full bg-slate-300 dark:bg-slate-700 text-slate-500">
                      فعلاً غیرفعال است
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

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
              {quickAccessItems.map((item, index) => (
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
          {sessionToken && isOnline && (
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

      {/* Announcement Modal */}
      <AnnouncementModal
        announcement={selectedAnnouncement}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </MainLayout>
  );
};

export default BorderlessHub;
