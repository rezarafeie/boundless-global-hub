
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Pin, Download, ExternalLink, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BorderlessHub = () => {
  const { translations } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);

  // Mock announcements data
  const announcements = [
    {
      id: 1,
      title: "شروع دوره جدید بدون مرز - فروردین ۱۴۰۴",
      date: "۲۵ بهمن ۱۴۰۳",
      type: "urgent",
      message: "ثبت‌نام دوره جدید بدون مرز از فردا آغاز می‌شود. ظرفیت محدود است.",
      actionType: "register",
      actionText: "ثبت‌نام کنید"
    },
    {
      id: 2,
      title: "بروزرسانی پلتفرم آموزشی",
      date: "۲۳ بهمن ۱۴۰۳",
      type: "technical",
      message: "سیستم آموزشی به نسخه جدید ارتقاء یافت. امکانات جدیدی اضافه شده است.",
      actionType: "view",
      actionText: "مشاهده تغییرات"
    },
    {
      id: 3,
      title: "فایل‌های جلسه ۱۵ دوره بدون مرز",
      date: "۲۰ بهمن ۱۴۰۳",
      type: "updates",
      message: "فایل‌های جلسه پانزدهم دوره بدون مرز آماده دانلود است.",
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
      pinned: true
    },
    {
      id: 2,
      sender: "علی محمدی",
      role: "member",
      message: "سلام استاد، ممنون از محتوای عالی دوره",
      time: "۱۴:۳۲",
      pinned: false
    },
    {
      id: 3,
      sender: "سارا احمدی",
      role: "moderator",
      message: "دوستان برای سوالات فنی لطفاً از بخش پشتیبانی استفاده کنید",
      time: "۱۴:۳۵",
      pinned: false
    }
  ];

  const filteredAnnouncements = selectedFilter === 'all' 
    ? announcements 
    : announcements.filter(ann => ann.type === selectedFilter);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Here you would send the message to your backend
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
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
                    {translations.borderlessWelcome}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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

              {/* Announcements List */}
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
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
                        {announcement.message}
                      </p>
                      <Button className="w-full sm:w-auto">
                        {announcement.actionType === 'download' && <Download className="w-4 h-4 mr-2" />}
                        {announcement.actionType === 'view' && <ExternalLink className="w-4 h-4 mr-2" />}
                        {announcement.actionText}
                      </Button>
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
                              <span className="text-xs opacity-75 mt-1 block">{message.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                    
                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={translations.typeMessage}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
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
