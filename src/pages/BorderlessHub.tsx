
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Pin, Download, ExternalLink, Filter, Play, Users, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BorderlessHub = () => {
  const { translations } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<number | null>(null);

  // Mock announcements data with media support
  const announcements = [
    {
      id: 1,
      title: "شروع دوره جدید بدون مرز - فروردین ۱۴۰۴",
      date: "۲۵ بهمن ۱۴۰۳",
      type: "urgent",
      isPinned: true,
      isUnread: true,
      summary: "ثبت‌نام دوره جدید بدون مرز از فردا آغاز می‌شود. ظرفیت محدود است.",
      fullText: "دوستان عزیز، با خوشحالی اعلام می‌کنیم که ثبت‌نام دوره جدید بدون مرز از فردا ۲۶ بهمن آغاز خواهد شد. این دوره با محتوای کاملاً به‌روزرسانی شده و امکانات جدید در اختیار شما قرار می‌گیرد.",
      media: {
        type: "video",
        content: '<iframe width="100%" height="300" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>'
      },
      actionType: "register",
      actionText: "ثبت‌نام کنید"
    },
    {
      id: 2,
      title: "بروزرسانی پلتفرم آموزشی",
      date: "۲۳ بهمن ۱۴۰۳",
      type: "technical",
      isPinned: false,
      isUnread: false,
      summary: "سیستم آموزشی به نسخه جدید ارتقاء یافت. امکانات جدیدی اضافه شده است.",
      fullText: "سیستم آموزشی آکادمی رفیعی با موفقیت به نسخه ۲.۰ ارتقاء یافت. امکانات جدید شامل پخش‌کننده بهبود یافته، سیستم آزمون آنلاین و امکان دانلود فایل‌ها می‌باشد.",
      media: {
        type: "image",
        content: '<img src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png" alt="Platform Update" class="w-full rounded-lg" />'
      },
      actionType: "view",
      actionText: "مشاهده تغییرات"
    },
    {
      id: 3,
      title: "فایل‌های جلسه ۱۵ دوره بدون مرز",
      date: "۲۰ بهمن ۱۴۰۳",
      type: "updates",
      isPinned: false,
      isUnread: true,
      summary: "فایل‌های جلسه پانزدهم دوره بدون مرز آماده دانلود است.",
      fullText: "دوستان شرکت‌کننده در دوره بدون مرز، فایل‌های جلسه پانزدهم شامل ویدیو، فایل PDF و تمرین‌های عملی آماده دانلود است.",
      media: {
        type: "audio",
        content: '<audio controls class="w-full"><source src="https://example.com/audio.mp3" type="audio/mpeg">مرورگر شما از پخش صوت پشتیبانی نمی‌کند.</audio>'
      },
      actionType: "download",
      actionText: "دانلود فایل‌ها"
    }
  ];

  // Mock chat messages
  const chatMessages = [
    {
      id: 1,
      sender: "رضا رفیعی",
      role: "admin",
      message: "سلام دوستان عزیز! امیدوارم حالتان خوب باشه",
      time: "۱۴:۳۰",
      pinned: true,
      reactions: { like: 12, heart: 5 }
    },
    {
      id: 2,
      sender: "علی محمدی",
      role: "member",
      message: "سلام استاد، ممنون از محتوای عالی دوره",
      time: "۱۴:۳۲",
      pinned: false,
      reactions: { like: 3 }
    },
    {
      id: 3,
      sender: "سارا احمدی",
      role: "moderator",
      message: "دوستان برای سوالات فنی لطفاً از بخش پشتیبانی استفاده کنید",
      time: "۱۴:۳۵",
      pinned: false,
      reactions: { like: 8, heart: 2 }
    }
  ];

  // Mock live stream data
  const liveStream = {
    isLive: true,
    title: "جلسه زنده بدون مرز - استراتژی‌های پیشرفته کسب‌وکار",
    viewers: 142,
    streamUrl: "https://www.youtube.com/embed/live_stream_id"
  };

  const filteredAnnouncements = selectedFilter === 'all' 
    ? announcements 
    : announcements.filter(ann => ann.type === selectedFilter);

  const pinnedAnnouncements = filteredAnnouncements.filter(ann => ann.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter(ann => !ann.isPinned);

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
      case 'updates': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
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

  const toggleAnnouncement = (id: number) => {
    setExpandedAnnouncement(expandedAnnouncement === id ? null : id);
  };

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
        {liveStream.isLive && (
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
                      {liveStream.viewers} بیننده
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video">
                  <iframe 
                    src={liveStream.streamUrl}
                    width="100%" 
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className="rounded-b-lg"
                    title="Live Stream"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{liveStream.title}</h3>
                </div>
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
                      همه
                    </Button>
                    <Button
                      variant={selectedFilter === 'urgent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('urgent')}
                    >
                      {translations.urgent}
                    </Button>
                    <Button
                      variant={selectedFilter === 'technical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('technical')}
                    >
                      {translations.technical}
                    </Button>
                    <Button
                      variant={selectedFilter === 'updates' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('updates')}
                    >
                      {translations.updates}
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                            {announcement.isUnread && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getAnnouncementTypeColor(announcement.type)}>
                              {announcement.type === 'urgent' ? translations.urgent :
                               announcement.type === 'technical' ? translations.technical :
                               announcement.type === 'updates' ? translations.updates : translations.general}
                            </Badge>
                            <span className="text-sm text-slate-500">{announcement.date}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                          {expandedAnnouncement === announcement.id ? announcement.fullText : announcement.summary}
                        </p>
                        
                        {/* Media Content */}
                        {announcement.media && expandedAnnouncement === announcement.id && (
                          <div className="mb-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                            <div dangerouslySetInnerHTML={{ __html: announcement.media.content }} />
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
                          <Button size="sm">
                            {announcement.actionType === 'download' && <Download className="w-4 h-4 mr-2" />}
                            {announcement.actionType === 'view' && <ExternalLink className="w-4 h-4 mr-2" />}
                            {announcement.actionText}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Regular Announcements */}
              <div className="space-y-4">
                {regularAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          {announcement.isUnread && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getAnnouncementTypeColor(announcement.type)}>
                            {announcement.type === 'urgent' ? translations.urgent :
                             announcement.type === 'technical' ? translations.technical :
                             announcement.type === 'updates' ? translations.updates : translations.general}
                          </Badge>
                          <span className="text-sm text-slate-500">{announcement.date}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 dark:text-slate-300 mb-4">
                        {expandedAnnouncement === announcement.id ? announcement.fullText : announcement.summary}
                      </p>
                      
                      {/* Media Content */}
                      {announcement.media && expandedAnnouncement === announcement.id && (
                        <div className="mb-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                          <div dangerouslySetInnerHTML={{ __html: announcement.media.content }} />
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
                        <Button size="sm">
                          {announcement.actionType === 'download' && <Download className="w-4 h-4 mr-2" />}
                          {announcement.actionType === 'view' && <ExternalLink className="w-4 h-4 mr-2" />}
                          {announcement.actionText}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                          <span className="text-sm">۴۸ آنلاین</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    {/* Messages Area */}
                    <CardContent className="flex-1 overflow-y-auto space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="flex justify-end">
                          <div className="max-w-[80%]">
                            <div className="bg-blue-600 text-white rounded-lg rounded-br-none px-4 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{message.sender}</span>
                                <Badge className={getRoleColor(message.role)}>
                                  {message.role === 'admin' ? translations.admin :
                                   message.role === 'moderator' ? translations.moderator : translations.member}
                                </Badge>
                                {message.pinned && <Pin className="w-3 h-3" />}
                              </div>
                              <p className="text-sm">{message.message}</p>
                              
                              {/* Reactions */}
                              {message.reactions && (
                                <div className="flex gap-2 mt-2">
                                  {message.reactions.like && (
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                      👍 {message.reactions.like}
                                    </span>
                                  )}
                                  {message.reactions.heart && (
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                      ❤️ {message.reactions.heart}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <span className="text-xs opacity-75 mt-1 block">{message.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      <div className="space-y-3">
                        {chatMessages.filter(msg => msg.pinned).map((message) => (
                          <div key={message.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{message.sender}</span>
                              <Badge className={getRoleColor(message.role)}>
                                {message.role === 'admin' ? translations.admin :
                                 message.role === 'moderator' ? translations.moderator : translations.member}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{message.message}</p>
                            <span className="text-xs text-slate-500 mt-1 block">{message.time}</span>
                          </div>
                        ))}
                      </div>
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
