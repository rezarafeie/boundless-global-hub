import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Pin, Eye, Image, Video, AudioLines } from 'lucide-react';
import { useAnnouncements, useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { announcementsService } from '@/lib/supabase';
import ChatSection from '@/components/Chat/ChatSection';
import LiveStreamCard from '@/components/Chat/LiveStreamCard';
import RafieiMeetCard from '@/components/Chat/RafieiMeetCard';

const BorderlessHub = () => {
  const { translations, language } = useLanguage();
  const isRTL = language === 'fa';
  
  // Real-time data hooks
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  const { settings: rafieiMeetSettings, loading: rafieiMeetLoading } = useRafieiMeet();
  
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<number | null>(null);

  // Calculate unread count (assuming new announcements are unread)
  const unreadCount = announcements.filter(ann => {
    const createdDate = new Date(ann.created_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return createdDate > oneDayAgo;
  }).length;

  const pinnedAnnouncements = announcements.filter(ann => ann.is_pinned);
  const regularAnnouncements = announcements.filter(ann => !ann.is_pinned);

  // Dynamic section ordering logic - Fixed order: notifications, chat, meet, live
  const isLiveActive = !liveLoading && liveSettings?.is_live;
  const isMeetActive = !rafieiMeetLoading && rafieiMeetSettings?.is_active;

  const getSectionOrder = () => {
    const sections = [
      { id: 'notifications', component: 'notifications', priority: 1 },
      { id: 'chat', component: 'chat', priority: 2 },
      { id: 'meet', component: 'meet', priority: 3 },
      { id: 'live', component: 'live', priority: 4 }
    ];

    return sections.sort((a, b) => a.priority - b.priority);
  };

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'educational': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAnnouncementTypeText = (type: string) => {
    switch (type) {
      case 'urgent': return 'فوری';
      case 'technical': return 'فنی';
      case 'educational': return 'آموزشی';
      default: return 'عمومی';
    }
  };

  const getMediaIcon = (media_type: string) => {
    switch (media_type) {
      case 'image': return <Image className="w-4 h-4 text-blue-600" />;
      case 'video': return <Video className="w-4 h-4 text-green-600" />;
      case 'audio': return <AudioLines className="w-4 h-4 text-purple-600" />;
      default: return null;
    }
  };

  const toggleAnnouncement = async (id: number) => {
    if (expandedAnnouncement !== id) {
      // Increment view count when opening announcement
      try {
        await announcementsService.incrementViews(id);
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    }
    setExpandedAnnouncement(expandedAnnouncement === id ? null : id);
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'notifications':
        return (
          <div key="notifications-section" className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6" />
              {translations.announcements}
            </h2>

            {announcementsLoading ? (
              <Card>
                <CardContent className="p-8">
                  <p className="text-center text-slate-500">در حال بارگذاری اطلاعیه‌ها...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Pinned Announcements */}
                {pinnedAnnouncements.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Pin className="w-5 h-5 text-yellow-600" />
                      اطلاعیه‌های سنجاق شده
                    </h3>
                    {pinnedAnnouncements.map((announcement) => (
                      <Card key={announcement.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMediaIcon(announcement.media_type)}
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                              <Pin className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getAnnouncementTypeColor(announcement.type)}>
                                {getAnnouncementTypeText(announcement.type)}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                              </span>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-500">{announcement.views}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700 dark:text-slate-300 mb-4">
                            {expandedAnnouncement === announcement.id ? announcement.full_text : announcement.summary}
                          </p>
                          
                          {/* Media Content */}
                          {announcement.media_content && expandedAnnouncement === announcement.id && (
                            <div className="mb-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                              <div dangerouslySetInnerHTML={{ __html: announcement.media_content }} />
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleAnnouncement(announcement.id)}
                            >
                              {expandedAnnouncement === announcement.id ? 'خلاصه' : 'ادامه مطلب'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Regular Announcements */}
                <div className="space-y-4">
                  {regularAnnouncements.length === 0 ? (
                    <Card>
                      <CardContent className="p-8">
                        <p className="text-center text-slate-500">هیچ اطلاعیه‌ای وجود ندارد</p>
                      </CardContent>
                    </Card>
                  ) : (
                    regularAnnouncements.map((announcement) => (
                      <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMediaIcon(announcement.media_type)}
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getAnnouncementTypeColor(announcement.type)}>
                                {getAnnouncementTypeText(announcement.type)}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                              </span>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-500">{announcement.views}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700 dark:text-slate-300 mb-4">
                            {expandedAnnouncement === announcement.id ? announcement.full_text : announcement.summary}
                          </p>
                          
                          {/* Media Content */}
                          {announcement.media_content && expandedAnnouncement === announcement.id && (
                            <div className="mb-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                              <div dangerouslySetInnerHTML={{ __html: announcement.media_content }} />
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleAnnouncement(announcement.id)}
                            >
                              {expandedAnnouncement === announcement.id ? 'خلاصه' : 'ادامه مطلب'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        );
      
      case 'chat':
        return (
          <div key="chat-section" className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <div className="relative">
                <span className="text-2xl">💬</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              چت گروهی بدون مرز
            </h2>
            <ChatSection />
          </div>
        );
      
      case 'meet':
        return (
          <div key="meet-section" className="mb-8">
            <RafieiMeetCard
              isActive={isMeetActive || false}
              meetUrl={rafieiMeetSettings?.meet_url}
              title={rafieiMeetSettings?.title}
              description={rafieiMeetSettings?.description}
            />
          </div>
        );
      
      case 'live':
        return (
          <div key="live-section" className="mb-8">
            <LiveStreamCard
              isActive={isLiveActive || false}
              streamCode={liveSettings?.stream_code}
              title={liveSettings?.title}
              viewers={liveSettings?.viewers}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Alert Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm md:text-base">
              📢 همراهان عزیز بدون مرز، آخرین اطلاعیه‌ها، گفتگوهای گروهی و پخش زنده را در این صفحه دنبال کنید.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-8 h-8 text-blue-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    مرکز ارتباط بدون مرز
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    مرکز اطلاع‌رسانی و ارتباطات بدون مرز
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {getSectionOrder().map((section) => renderSection(section.id))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
