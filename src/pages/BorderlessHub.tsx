
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  MessageCircle, 
  Video, 
  Play,
  Pin,
  Eye,
  Calendar,
  Users,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAnnouncements } from '@/hooks/useRealtime';
import { useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import EnhancedLiveStreamCard from '@/components/Chat/EnhancedLiveStreamCard';
import EnhancedRafieiMeetCard from '@/components/Chat/EnhancedRafieiMeetCard';
import AnnouncementMedia from '@/components/Chat/AnnouncementMedia';

const BorderlessHub: React.FC = () => {
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  const { settings: rafieiMeetSettings, loading: rafieiMeetLoading } = useRafieiMeet();

  const isLiveActive = liveSettings?.is_live || false;
  const isMeetActive = rafieiMeetSettings?.is_active || false;

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-600 text-white';
      case 'general':
        return 'bg-blue-600 text-white';
      case 'technical':
        return 'bg-purple-600 text-white';
      case 'educational':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getAnnouncementTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'فوری';
      case 'general':
        return 'عمومی';
      case 'technical':
        return 'فنی';
      case 'educational':
        return 'آموزشی';
      default:
        return 'عمومی';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 hub-page pt-20">
        
        {/* Hero Header */}
        <section className="py-16 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              🌟 مرکز بدون مرز
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              مرکز اطلاع‌رسانی، پخش زنده و گفت‌وگوهای گروهی جامعه رفیعی
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-16">
          
          {/* Active Services Section */}
          {(isLiveActive || isMeetActive) && (
            <section className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  پخش زنده فعال
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-pink-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {isLiveActive && !liveLoading && (
                  <EnhancedLiveStreamCard
                    isActive={true}
                    streamCode={liveSettings?.stream_code}
                    title={liveSettings?.title}
                    viewers={liveSettings?.viewers}
                  />
                )}
                
                {isMeetActive && !rafieiMeetLoading && (
                  <EnhancedRafieiMeetCard
                    isActive={true}
                    meetUrl={rafieiMeetSettings?.meet_url}
                    title={rafieiMeetSettings?.title}
                    description={rafieiMeetSettings?.description}
                  />
                )}
              </div>
            </section>
          )}

          {/* Chat Access Section */}
          <section className="mb-16">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-slate-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <MessageCircle className="w-16 h-16 text-white" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    💬 گفت‌وگوهای بدون مرز
                  </h2>
                  <p className="text-green-100 text-lg">
                    به گفتگوی زنده اعضای جامعه بدون مرز بپیوندید
                  </p>
                </div>
                <CardContent className="text-center p-8">
                  <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
                    در موضوعات مختلف شرکت کنید و با دیگر اعضا در ارتباط باشید
                  </p>
                  <Link to="/hub/chat">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 rounded-full"
                    >
                      <MessageCircle className="w-6 h-6 ml-2" />
                      ورود به گفت‌وگوها
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Announcements Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                📢 اطلاعیه‌های مهم
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                آخرین اخبار و اطلاعیه‌های مهم از تیم بدون مرز
              </p>
            </div>

            {announcementsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <Card className="bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-center py-16">
                  <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-2">
                    هنوز اطلاعیه‌ای منتشر نشده است
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    به‌زودی اطلاعیه‌های جدید منتشر خواهد شد
                  </p>
                </Card>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">
                {announcements.map((announcement) => (
                  <Card 
                    key={announcement.id} 
                    className={`bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                      announcement.is_pinned ? 'ring-2 ring-amber-400 shadow-amber-100 dark:shadow-amber-900/20' : ''
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            {announcement.is_pinned && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <Pin className="w-4 h-4" />
                                <span className="text-xs font-medium">سنجاق شده</span>
                              </div>
                            )}
                            <Badge className={getAnnouncementTypeColor(announcement.type)}>
                              {getAnnouncementTypeLabel(announcement.type)}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <Calendar className="w-4 h-4" />
                              {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                          
                          <CardTitle className="text-xl md:text-2xl text-slate-900 dark:text-white mb-4 leading-tight">
                            {announcement.title}
                          </CardTitle>
                          
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                            {announcement.full_text}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <Eye className="w-4 h-4" />
                          <span>{announcement.views || 0}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <AnnouncementMedia
                        mediaType={announcement.media_type}
                        mediaUrl={announcement.media_url}
                        mediaContent={announcement.media_content}
                        title={announcement.title}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Inactive Services Section */}
          {(!isLiveActive || !isMeetActive) && (
            <section className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  📺 سرویس‌های پخش
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-slate-400 to-slate-600 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {!isLiveActive && (
                  <Card className="bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700 opacity-75">
                    <CardHeader className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-slate-500 dark:text-gray-400" />
                      </div>
                      <CardTitle className="text-slate-700 dark:text-slate-300">پخش زنده آپارات</CardTitle>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        در حال حاضر غیرفعال
                      </p>
                    </CardHeader>
                  </Card>
                )}
                
                {!isMeetActive && (
                  <Card className="bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700 opacity-75">
                    <CardHeader className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-slate-500 dark:text-gray-400" />
                      </div>
                      <CardTitle className="text-slate-700 dark:text-slate-300">جلسه تصویری رفیعی</CardTitle>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        در حال حاضر غیرفعال
                      </p>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
