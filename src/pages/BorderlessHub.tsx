
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Pin, Download, ExternalLink, Filter, Play, Users, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnnouncements, useChatMessages, useLiveSettings } from '@/hooks/useRealtime';
import { announcementsService } from '@/lib/supabase';

const BorderlessHub = () => {
  const { translations } = useLanguage();
  
  // Real-time data hooks
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { messages, loading: messagesLoading } = useChatMessages();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<number | null>(null);

  // Calculate unread count (assuming new announcements are unread)
  const unreadCount = announcements.filter(ann => {
    const createdDate = new Date(ann.created_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return createdDate > oneDayAgo;
  }).length;

  const filteredAnnouncements = selectedFilter === 'all' 
    ? announcements 
    : announcements.filter(ann => ann.type === selectedFilter);

  const pinnedAnnouncements = filteredAnnouncements.filter(ann => ann.is_pinned);
  const regularAnnouncements = filteredAnnouncements.filter(ann => !ann.is_pinned);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'educational': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  const getAnnouncementTypeText = (type: string) => {
    switch (type) {
      case 'urgent': return translations.urgent || 'فوری';
      case 'technical': return translations.technical || 'فنی';
      case 'educational': return translations.educational || 'آموزشی';
      default: return translations.general || 'عمومی';
    }
  };

  // Get pinned messages for sidebar
  const pinnedMessages = messages.filter(msg => msg.is_pinned);

  // Get recent messages (last 20)
  const recentMessages = messages.slice(-20);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
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
                    {translations.borderlessHub}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    مرکز اطلاع‌رسانی و ارتباطات بدون مرز
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stream Section */}
        {!liveLoading && liveSettings?.is_live && liveSettings?.stream_code && (
          <div className="container mx-auto px-4 py-6">
            <Card className="mb-6 border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-950">
                <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <Play className="w-5 h-5" />
                    پخش زنده ویژه بدون مرز
                  </div>
                  <div className="flex items-center gap-4 mr-auto text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {liveSettings.viewers || 0} بیننده
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video">
                  <div dangerouslySetInnerHTML={{ __html: liveSettings.stream_code }} />
                </div>
                {liveSettings.title && (
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{liveSettings.title}</h3>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {translations.announcements}
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {translations.groupChat}
              </TabsTrigger>
            </TabsList>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-6">
              {/* Filter Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    {translations.filterByType}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={selectedFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('all')}
                    >
                      همه ({announcements.length})
                    </Button>
                    <Button
                      variant={selectedFilter === 'urgent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('urgent')}
                    >
                      فوری ({announcements.filter(a => a.type === 'urgent').length})
                    </Button>
                    <Button
                      variant={selectedFilter === 'technical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('technical')}
                    >
                      فنی ({announcements.filter(a => a.type === 'technical').length})
                    </Button>
                    <Button
                      variant={selectedFilter === 'educational' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('educational')}
                    >
                      آموزشی ({announcements.filter(a => a.type === 'educational').length})
                    </Button>
                    <Button
                      variant={selectedFilter === 'general' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('general')}
                    >
                      عمومی ({announcements.filter(a => a.type === 'general').length})
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                          <p className="text-center text-slate-500">
                            {selectedFilter === 'all' ? 'هیچ اطلاعیه‌ای وجود ندارد' : `هیچ اطلاعیه ${getAnnouncementTypeText(selectedFilter)}ی وجود ندارد`}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      regularAnnouncements.map((announcement) => (
                        <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
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
            </TabsContent>

            {/* Group Chat Tab */}
            <TabsContent value="chat" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Chat Area */}
                <div className="lg:col-span-3">
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        {translations.groupChat}
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {translations.online}
                        </Badge>
                        <div className="flex items-center gap-1 mr-auto">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{messages.length} پیام</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    {/* Messages Area */}
                    <CardContent className="flex-1 overflow-y-auto space-y-4">
                      {messagesLoading ? (
                        <p className="text-center text-slate-500">در حال بارگذاری پیام‌ها...</p>
                      ) : recentMessages.length === 0 ? (
                        <p className="text-center text-slate-500">هیچ پیامی وجود ندارد</p>
                      ) : (
                        recentMessages.map((message) => (
                          <div key={message.id} className="flex justify-end">
                            <div className="max-w-[80%]">
                              <div className="bg-blue-600 text-white rounded-lg rounded-br-none px-4 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{message.sender_name}</span>
                                  <Badge className={getRoleColor(message.sender_role)}>
                                    {message.sender_role === 'admin' ? translations.admin || 'مدیر' :
                                     message.sender_role === 'moderator' ? translations.moderator || 'مدیر بحث' : translations.member || 'عضو'}
                                  </Badge>
                                  {message.is_pinned && <Pin className="w-3 h-3" />}
                                </div>
                                <p className="text-sm">{message.message}</p>
                                
                                <span className="text-xs opacity-75 mt-1 block">
                                  {new Date(message.created_at).toLocaleString('fa-IR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                    
                    {/* Message Input - Disabled for regular users */}
                    <div className="p-4 border-t bg-slate-50 dark:bg-slate-800">
                      <div className="flex gap-2">
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="فقط ادمین‌ها قابلیت ارسال پیام دارند"
                          className="flex-1"
                          disabled
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} disabled>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        💡 چت فقط برای خواندن است. برای ارسال پیام با پشتیبانی تماس بگیرید.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Pinned Messages Sidebar */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pin className="w-5 h-5" />
                        {translations.pinnedMessages}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {messagesLoading ? (
                        <p className="text-center text-slate-500 text-sm">در حال بارگذاری...</p>
                      ) : pinnedMessages.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm">هیچ پیام سنجاق شده‌ای وجود ندارد</p>
                      ) : (
                        <div className="space-y-3">
                          {pinnedMessages.map((message) => (
                            <div key={message.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{message.sender_name}</span>
                                <Badge className={getRoleColor(message.sender_role)}>
                                  {message.sender_role === 'admin' ? translations.admin || 'مدیر' :
                                   message.sender_role === 'moderator' ? translations.moderator || 'مدیر بحث' : translations.member || 'عضو'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{message.message}</p>
                              <span className="text-xs text-slate-500 mt-1 block">
                                {new Date(message.created_at).toLocaleString('fa-IR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHub;
