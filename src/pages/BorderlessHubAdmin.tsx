import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Settings, Plus, Trash2, Pin, Send, Play, Save, Eye } from 'lucide-react';
import { useAnnouncements, useChatMessages, useLiveSettings } from '@/hooks/useRealtime';
import { announcementsService, chatService, liveService } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const BorderlessHubAdmin = () => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  
  // Real-time data hooks
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { messages, loading: messagesLoading } = useChatMessages();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  
  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    type: 'general' as 'urgent' | 'general' | 'technical' | 'educational',
    summary: '',
    fullText: '',
    mediaType: 'none' as 'none' | 'image' | 'audio' | 'video',
    mediaContent: '',
    isPinned: false
  });

  const [chatMessage, setChatMessage] = useState('');
  const [liveStreamCode, setLiveStreamCode] = useState(liveSettings?.stream_code || '');
  const [liveTitle, setLiveTitle] = useState(liveSettings?.title || '');
  const [isLive, setIsLive] = useState(liveSettings?.is_live || false);

  // Update form when live settings change
  React.useEffect(() => {
    if (liveSettings) {
      setLiveStreamCode(liveSettings.stream_code || '');
      setLiveTitle(liveSettings.title || '');
      setIsLive(liveSettings.is_live || false);
    }
  }, [liveSettings]);

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementsService.create({
        title: announcementForm.title,
        type: announcementForm.type,
        summary: announcementForm.summary,
        full_text: announcementForm.fullText,
        media_type: announcementForm.mediaType,
        media_content: announcementForm.mediaContent || null,
        is_pinned: announcementForm.isPinned
      });
      
      toast({
        title: "موفقیت",
        description: "اطلاعیه با موفقیت منتشر شد",
      });
      
      // Reset form
      setAnnouncementForm({
        title: '',
        type: 'general',
        summary: '',
        fullText: '',
        mediaType: 'none',
        mediaContent: '',
        isPinned: false
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: "خطا",
        description: "خطا در انتشار اطلاعیه",
        variant: "destructive"
      });
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    try {
      await chatService.sendMessage({
        sender_name: "مدیر سیستم",
        sender_role: "admin",
        message: chatMessage,
        is_pinned: false
      });
      
      toast({
        title: "موفقیت",
        description: "پیام ارسال شد",
      });
      
      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام",
        variant: "destructive"
      });
    }
  };

  const handleLiveStreamUpdate = async () => {
    try {
      await liveService.updateSettings({
        stream_code: liveStreamCode || null,
        title: liveTitle || null,
        is_live: isLive
      });
      
      toast({
        title: "موفقیت",
        description: "تنظیمات پخش زنده بروزرسانی شد",
      });
    } catch (error) {
      console.error('Error updating live settings:', error);
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی تنظیمات",
        variant: "destructive"
      });
    }
  };

  const deleteAnnouncement = async (id: number) => {
    try {
      await announcementsService.delete(id);
      toast({
        title: "موفقیت",
        description: "اطلاعیه حذف شد",
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف اطلاعیه",
        variant: "destructive"
      });
    }
  };

  const togglePinAnnouncement = async (id: number, isPinned: boolean) => {
    try {
      await announcementsService.togglePin(id, isPinned);
      toast({
        title: "موفقیت",
        description: isPinned ? "اطلاعیه از سنجاق برداشته شد" : "اطلاعیه سنجاق شد",
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "خطا",
        description: "خطا در تغییر وضعیت سنجاق",
        variant: "destructive"
      });
    }
  };

  const deleteChatMessage = async (id: number) => {
    try {
      await chatService.deleteMessage(id);
      toast({
        title: "موفقیت",
        description: "پیام حذف شد",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف پیام",
        variant: "destructive"
      });
    }
  };

  const togglePinChatMessage = async (id: number, isPinned: boolean) => {
    try {
      await chatService.togglePin(id, isPinned);
      toast({
        title: "موفقیت",
        description: isPinned ? "پیام از سنجاق برداشته شد" : "پیام سنجاق شد",
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "خطا",
        description: "خطا در تغییر وضعیت سنجاق",
        variant: "destructive"
      });
    }
  };

  const getAnnouncementTypeBadge = (type: string) => {
    switch (type) {
      case 'urgent': return { text: 'فوری', className: 'bg-red-100 text-red-800' };
      case 'technical': return { text: 'فنی', className: 'bg-blue-100 text-blue-800' };
      case 'educational': return { text: 'آموزشی', className: 'bg-green-100 text-green-800' };
      default: return { text: 'عمومی', className: 'bg-gray-100 text-gray-800' };
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return { text: 'مدیر', className: 'bg-purple-100 text-purple-800' };
      case 'moderator': return { text: 'مدیر بحث', className: 'bg-yellow-100 text-yellow-800' };
      default: return { text: 'عضو', className: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  مدیریت مرکز بدون مرز
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  پنل مدیریت اطلاعیه‌ها، چت گروهی و پخش زنده
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                مدیریت اطلاعیه‌ها
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                مدیریت چت
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                پخش زنده
              </TabsTrigger>
            </TabsList>

            {/* Announcements Management */}
            <TabsContent value="announcements" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Add New Announcement Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      اضافه کردن اطلاعیه جدید
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="title">عنوان اطلاعیه</Label>
                        <Input
                          id="title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="type">نوع اطلاعیه</Label>
                        <Select 
                          value={announcementForm.type} 
                          onValueChange={(value: 'urgent' | 'general' | 'technical' | 'educational') => setAnnouncementForm({...announcementForm, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">فوری</SelectItem>
                            <SelectItem value="general">عمومی</SelectItem>
                            <SelectItem value="technical">فنی</SelectItem>
                            <SelectItem value="educational">آموزشی</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="summary">خلاصه اطلاعیه</Label>
                        <Textarea
                          id="summary"
                          value={announcementForm.summary}
                          onChange={(e) => setAnnouncementForm({...announcementForm, summary: e.target.value})}
                          rows={2}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="fullText">متن کامل اطلاعیه</Label>
                        <Textarea
                          id="fullText"
                          value={announcementForm.fullText}
                          onChange={(e) => setAnnouncementForm({...announcementForm, fullText: e.target.value})}
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="mediaType">نوع مدیا</Label>
                        <Select 
                          value={announcementForm.mediaType} 
                          onValueChange={(value: 'none' | 'image' | 'audio' | 'video') => setAnnouncementForm({...announcementForm, mediaType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب کنید..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون مدیا</SelectItem>
                            <SelectItem value="image">تصویر</SelectItem>
                            <SelectItem value="audio">صوت</SelectItem>
                            <SelectItem value="video">ویدیو</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {announcementForm.mediaType && announcementForm.mediaType !== 'none' && (
                        <div>
                          <Label htmlFor="mediaContent">
                            کد HTML مدیا ({announcementForm.mediaType === 'image' ? '<img>' : 
                                           announcementForm.mediaType === 'audio' ? '<audio>' : 
                                           '<iframe>'})
                          </Label>
                          <Textarea
                            id="mediaContent"
                            value={announcementForm.mediaContent}
                            onChange={(e) => setAnnouncementForm({...announcementForm, mediaContent: e.target.value})}
                            rows={3}
                            placeholder={
                              announcementForm.mediaType === 'image' ? '<img src="..." alt="..." class="w-full rounded-lg" />' :
                              announcementForm.mediaType === 'audio' ? '<audio controls class="w-full"><source src="..." type="audio/mpeg"></audio>' :
                              '<iframe src="..." width="100%" height="300" frameborder="0" allowfullscreen></iframe>'
                            }
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isPinned"
                          checked={announcementForm.isPinned}
                          onChange={(e) => setAnnouncementForm({...announcementForm, isPinned: e.target.checked})}
                        />
                        <Label htmlFor="isPinned">سنجاق کردن در بالای صفحه</Label>
                      </div>

                      <Button type="submit" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        انتشار اطلاعیه
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Existing Announcements */}
                <Card>
                  <CardHeader>
                    <CardTitle>اطلاعیه‌های موجود ({announcements.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {announcementsLoading ? (
                      <p className="text-center text-slate-500">در حال بارگذاری...</p>
                    ) : announcements.length === 0 ? (
                      <p className="text-center text-slate-500">هیچ اطلاعیه‌ای وجود ندارد</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {announcements.map((announcement) => {
                          const typeBadge = getAnnouncementTypeBadge(announcement.type);
                          return (
                            <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">{announcement.title}</h4>
                                  {announcement.is_pinned && <Pin className="w-4 h-4 text-yellow-600" />}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={typeBadge.className + " text-xs"}>{typeBadge.text}</Badge>
                                  <span className="text-xs text-slate-500">
                                    {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs text-slate-500">{announcement.views}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => togglePinAnnouncement(announcement.id, announcement.is_pinned)}
                                >
                                  <Pin className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteAnnouncement(announcement.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Chat Management */}
            <TabsContent value="chat" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Send New Message */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      ارسال پیام جدید
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChatSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="chatMessage">متن پیام</Label>
                        <Textarea
                          id="chatMessage"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          rows={4}
                          placeholder="پیام خود را اینجا بنویسید..."
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        ارسال پیام
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Recent Messages */}
                <Card>
                  <CardHeader>
                    <CardTitle>پیام‌های اخیر ({messages.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {messagesLoading ? (
                      <p className="text-center text-slate-500">در حال بارگذاری...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-slate-500">هیچ پیامی وجود ندارد</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {messages.slice(-10).reverse().map((message) => {
                          const roleBadge = getRoleBadge(message.sender_role);
                          return (
                            <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{message.sender_name}</span>
                                  <Badge className={roleBadge.className + " text-xs"}>{roleBadge.text}</Badge>
                                  {message.is_pinned && <Pin className="w-4 h-4 text-yellow-600" />}
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{message.message}</p>
                                <span className="text-xs text-slate-500">
                                  {new Date(message.created_at).toLocaleString('fa-IR')}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => togglePinChatMessage(message.id, message.is_pinned)}
                                >
                                  <Pin className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteChatMessage(message.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Live Stream Management */}
            <TabsContent value="live" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    مدیریت پخش زنده
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {liveLoading ? (
                    <p className="text-center text-slate-500">در حال بارگذاری...</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isLive"
                          checked={isLive}
                          onChange={(e) => setIsLive(e.target.checked)}
                        />
                        <Label htmlFor="isLive">پخش زنده فعال است</Label>
                      </div>

                      <div>
                        <Label htmlFor="liveTitle">عنوان پخش زنده</Label>
                        <Input
                          id="liveTitle"
                          value={liveTitle}
                          onChange={(e) => setLiveTitle(e.target.value)}
                          placeholder="عنوان پخش زنده را وارد کنید"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="liveStreamCode">کد iframe پخش زنده</Label>
                        <Textarea
                          id="liveStreamCode"
                          value={liveStreamCode}
                          onChange={(e) => setLiveStreamCode(e.target.value)}
                          rows={6}
                          placeholder='<iframe src="https://your-stream-url.com" width="100%" height="400px" allowfullscreen></iframe>'
                        />
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">پیش‌نمایش:</h4>
                        {liveStreamCode ? (
                          <div className="border rounded-lg p-2">
                            <div dangerouslySetInnerHTML={{ __html: liveStreamCode }} />
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">کد iframe را وارد کنید تا پیش‌نمایش نمایش داده شود</p>
                        )}
                      </div>

                      <Button onClick={handleLiveStreamUpdate} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        ذخیره و بروزرسانی پخش زنده
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubAdmin;
