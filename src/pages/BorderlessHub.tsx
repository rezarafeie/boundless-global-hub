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
  Wifi, 
  Play,
  Pin,
  Eye,
  Calendar,
  Users,
  ArrowLeft
} from 'lucide-react';
import { useAnnouncements } from '@/hooks/useRealtime';
import { useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import EnhancedLiveStreamCard from '@/components/Chat/EnhancedLiveStreamCard';
import EnhancedRafieiMeetCard from '@/components/Chat/EnhancedRafieiMeetCard';

const BorderlessHub: React.FC = () => {
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  const { settings: rafieiMeetSettings, loading: rafieiMeetLoading } = useRafieiMeet();

  const isLiveActive = liveSettings?.is_live || false;
  const isMeetActive = rafieiMeetSettings?.is_active || false;

  const renderMediaContent = (mediaType: string, mediaContent: string | null) => {
    if (!mediaContent || mediaType === 'none') return null;

    switch (mediaType) {
      case 'image':
        return (
          <div className="mt-4">
            <img 
              src={mediaContent} 
              alt="تصویر اطلاعیه" 
              className="w-full rounded-lg shadow-lg max-h-64 object-cover"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="mt-4">
            <audio controls className="w-full">
              <source src={mediaContent} type="audio/mpeg" />
              مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
            </audio>
          </div>
        );
      case 'video':
        return (
          <div className="mt-4">
            <div 
              className="relative w-full h-64 bg-black rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: mediaContent }}
            />
          </div>
        );
      default:
        return null;
    }
  };

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
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              🌟 مرکز بدون مرز
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              مرکز اطلاع‌رسانی، پخش زنده و گفت‌وگوهای گروهی جامعه رفیعی
            </p>
          </div>

          {/* Live Cards Section - Show when active */}
          {(isLiveActive || isMeetActive) && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                🔴 پخش زنده فعال
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          )}

          {/* Chat Access Section */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700 hover:border-green-500/50 transition-all duration-300 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <MessageCircle className="w-16 h-16 text-green-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <CardTitle className="text-2xl text-white mb-2">
                💬 گفت‌وگوهای بدون مرز
              </CardTitle>
              <p className="text-gray-400">
                به گفتگوی زنده اعضای جامعه بدون مرز بپیوندید و در موضوعات مختلف شرکت کنید
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/hub/chat">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                >
                  <MessageCircle className="w-6 h-6 ml-2" />
                  ورود به گفت‌وگوها
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Announcements Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                📢 اطلاعیه‌های مهم
              </h2>
              <p className="text-gray-400">
                آخرین اخبار و اطلاعیه‌های مهم از تیم بدون مرز
              </p>
            </div>

            {announcementsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : announcements.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-700 text-center py-12">
                <Bell className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  هنوز اطلاعیه‌ای منتشر نشده است
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <Card 
                    key={announcement.id} 
                    className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-slate-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                      announcement.is_pinned ? 'border-amber-500/50 bg-gradient-to-r from-amber-50/20 to-yellow-50/20 dark:from-amber-900/20 dark:to-yellow-900/20' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {announcement.is_pinned && (
                              <Pin className="w-5 h-5 text-amber-400" />
                            )}
                            <Badge className={getAnnouncementTypeColor(announcement.type)}>
                              {getAnnouncementTypeLabel(announcement.type)}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                          
                          <CardTitle className="text-xl md:text-2xl text-white mb-3">
                            {announcement.title}
                          </CardTitle>
                          
                          <p className="text-gray-300 leading-relaxed">
                            {announcement.full_text}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Eye className="w-4 h-4" />
                          <span>{announcement.views || 0}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {announcement.media_content && (
                      <CardContent>
                        {renderMediaContent(announcement.media_type, announcement.media_content)}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Live Cards Section */}
          {(!isLiveActive || !isMeetActive) && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                📺 سرویس‌های پخش
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isLiveActive && (
                  <Card className="bg-gray-900/50 border-gray-700 opacity-60">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                      <CardTitle className="text-white">پخش زنده آپارات</CardTitle>
                      <p className="text-gray-400 text-sm">
                        در حال حاضر غیرفعال
                      </p>
                    </CardHeader>
                  </Card>
                )}
                
                {!isMeetActive && (
                  <Card className="bg-gray-900/50 border-gray-700 opacity-60">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                      <CardTitle className="text-white">جلسه تصویری رفیعی</CardTitle>
                      <p className="text-gray-400 text-sm">
                        در حال حاضر غیرفعال
                      </p>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
