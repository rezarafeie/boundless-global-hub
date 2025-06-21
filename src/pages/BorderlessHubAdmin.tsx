import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, MessageSquare, Users, Pin, Trash2, Play, PlayCircle, StopCircle, Video, Image, AudioLines, Monitor, HeadphonesIcon } from 'lucide-react';
import { useAnnouncements, useChatMessages, useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { announcementsService, chatService, liveService } from '@/lib/supabase';
import { rafieiMeetService } from '@/lib/rafieiMeet';
import { useToast } from '@/hooks/use-toast';
import UserManagement from '@/components/Admin/UserManagement';
import TopicManagement from '@/components/Admin/TopicManagement';
import SupportAgentManagement from '@/components/Admin/SupportAgentManagement';
import type { AnnouncementInsert } from '@/types/supabase';

const BorderlessHubAdmin = () => {
  const { toast } = useToast();
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { messages, loading: messagesLoading } = useChatMessages();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  const { settings: rafieiMeetSettings, loading: rafieiMeetLoading } = useRafieiMeet();

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementInsert>({
    title: '',
    type: 'general',
    summary: '',
    full_text: '',
    media_type: 'none',
    media_content: '',
    media_url: '',
    is_pinned: false
  });

  // Live settings state
  const [liveForm, setLiveForm] = useState({
    is_live: false,
    stream_code: '',
    title: '',
    viewers: 0
  });

  // Rafiei Meet form state
  const [rafieiMeetForm, setRafieiMeetForm] = useState({
    is_active: false,
    title: 'جلسه تصویری رفیعی',
    description: 'جلسه تصویری زنده برای اعضای بدون مرز',
    meet_url: 'https://meet.jit.si/rafiei'
  });

  useEffect(() => {
    if (liveSettings) {
      setLiveForm({
        is_live: liveSettings.is_live || false,
        stream_code: liveSettings.stream_code || '',
        title: liveSettings.title || '',
        viewers: liveSettings.viewers || 0
      });
    }
  }, [liveSettings]);

  useEffect(() => {
    if (rafieiMeetSettings) {
      setRafieiMeetForm({
        is_active: rafieiMeetSettings.is_active,
        title: rafieiMeetSettings.title,
        description: rafieiMeetSettings.description,
        meet_url: rafieiMeetSettings.meet_url
      });
    }
  }, [rafieiMeetSettings]);

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementsService.create(announcementForm);
      toast({
        title: 'موفق',
        description: 'اطلاعیه جدید ایجاد شد',
      });
      setAnnouncementForm({
        title: '',
        type: 'general',
        summary: '',
        full_text: '',
        media_type: 'none',
        media_content: '',
        media_url: '',
        is_pinned: false
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد اطلاعیه',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await announcementsService.delete(id);
      toast({
        title: 'موفق',
        description: 'اطلاعیه حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف اطلاعیه',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAnnouncementPin = async (id: number, isPinned: boolean) => {
    try {
      await announcementsService.togglePin(id, isPinned);
      toast({
        title: 'موفق',
        description: isPinned ? 'اطلاعیه از سنجاق برداشته شد' : 'اطلاعیه سنجاق شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت سنجاق',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await chatService.deleteMessage(id);
      toast({
        title: 'موفق',
        description: 'پیام حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف پیام',
        variant: 'destructive',
      });
    }
  };

  const handleToggleMessagePin = async (id: number, isPinned: boolean) => {
    try {
      await chatService.togglePin(id, isPinned);
      toast({
        title: 'موفق',
        description: isPinned ? 'پیام از سنجاق برداشته شد' : 'پیام سنجاق شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت سنجاق',
        variant: 'destructive',
      });
    }
  };

  const handleLiveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await liveService.updateSettings(liveForm);
      toast({
        title: 'موفق',
        description: 'تنظیمات پخش زنده به‌روزرسانی شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات',
        variant: 'destructive',
      });
    }
  };

  const handleRafieiMeetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rafieiMeetService.updateSettings(rafieiMeetForm);
      toast({
        title: 'موفق',
        description: 'تنظیمات جلسه تصویری به‌روزرسانی شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات',
        variant: 'destructive',
      });
    }
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <AudioLines className="w-4 h-4" />;
      case 'iframe': return <Monitor className="w-4 h-4" />;
      default: return null;
    }
  };

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return 'تصویر';
      case 'video': return 'ویدیو';
      case 'audio': return 'صوت';
      case 'iframe': return 'iframe';
      default: return 'بدون رسانه';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 pt-20 admin-page">
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  پنل مدیریت بدون مرز
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  مدیریت اطلاعیه‌ها، چت گروهی، کاربران، پشتیبانی و پخش زنده
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                اطلاعیه‌ها
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                مدیریت چت
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                تاپیک‌ها
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                مدیریت کاربران
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <HeadphonesIcon className="w-4 h-4" />
                پشتیبان‌ها
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                پخش زنده
              </TabsTrigger>
              <TabsTrigger value="rafiei-meet" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                رفیعی میت
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ایجاد اطلاعیه جدید</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">عنوان</Label>
                      <Input
                        id="title"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">نوع</Label>
                      <Select onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value as any })}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع اطلاعیه" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">عمومی</SelectItem>
                          <SelectItem value="urgent">فوری</SelectItem>
                          <SelectItem value="technical">فنی</SelectItem>
                          <SelectItem value="educational">آموزشی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="summary">خلاصه</Label>
                      <Input
                        id="summary"
                        value={announcementForm.summary}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, summary: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_text">متن کامل</Label>
                      <Textarea
                        id="full_text"
                        value={announcementForm.full_text}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, full_text: e.target.value })}
                        required
                      />
                    </div>
                    
                    {/* Media Type Selection */}
                    <div>
                      <Label htmlFor="media_type">نوع رسانه</Label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                        {[
                          { value: 'none', label: 'بدون رسانه', icon: null },
                          { value: 'image', label: 'تصویر', icon: <Image className="w-4 h-4" /> },
                          { value: 'video', label: 'ویدیو', icon: <Video className="w-4 h-4" /> },
                          { value: 'audio', label: 'صوت', icon: <AudioLines className="w-4 h-4" /> },
                          { value: 'iframe', label: 'iframe', icon: <Monitor className="w-4 h-4" /> }
                        ].map((mediaType) => (
                          <Button
                            key={mediaType.value}
                            type="button"
                            variant={announcementForm.media_type === mediaType.value ? "default" : "outline"}
                            className="flex items-center gap-2 justify-center"
                            onClick={() => setAnnouncementForm({ ...announcementForm, media_type: mediaType.value as any })}
                          >
                            {mediaType.icon}
                            {mediaType.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Media URL Input */}
                    {announcementForm.media_type !== 'none' && (
                      <div>
                        <Label htmlFor="media_url">لینک رسانه</Label>
                        <Input
                          id="media_url"
                          value={announcementForm.media_url || ''}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, media_url: e.target.value })}
                          placeholder="مثال: https://www.aparat.com/v/xxxxx"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {announcementForm.media_type === 'iframe' ? 
                            'برای iframe کد HTML کامل وارد کنید' : 
                            'لینک مستقیم فایل را وارد کنید'
                          }
                        </p>
                      </div>
                    )}

                    {/* Media Content (fallback) */}
                    {announcementForm.media_type !== 'none' && (
                      <div>
                        <Label htmlFor="media_content">کد رسانه (اختیاری)</Label>
                        <Textarea
                          id="media_content"
                          value={announcementForm.media_content || ''}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, media_content: e.target.value })}
                          placeholder="کد HTML برای تصویر، صوت یا ویدیو"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_pinned"
                        checked={announcementForm.is_pinned}
                        onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, is_pinned: checked })}
                      />
                      <Label htmlFor="is_pinned">سنجاق شود؟</Label>
                    </div>
                    <Button type="submit">ایجاد اطلاعیه</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>مدیریت اطلاعیه‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  {announcementsLoading ? (
                    <p className="text-center">در حال بارگذاری اطلاعیه‌ها...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {announcements.map((announcement) => (
                        <Card key={announcement.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{announcement.title}</CardTitle>
                              <Badge>{announcement.type}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p>{announcement.summary}</p>
                            <div className="flex justify-between mt-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAnnouncementPin(announcement.id, announcement.is_pinned)}
                              >
                                {announcement.is_pinned ? (
                                  <>
                                    <Pin className="w-4 h-4" />
                                    برداشتن سنجاق
                                  </>
                                ) : (
                                  <>
                                    <Pin className="w-4 h-4" />
                                    سنجاق
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>مدیریت پیام‌های چت</CardTitle>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <p className="text-center">در حال بارگذاری پیام‌ها...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {messages.map((message) => (
                        <Card key={message.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{message.sender_name}</CardTitle>
                              <Badge>{message.sender_role}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p>{message.message}</p>
                            <div className="flex justify-between mt-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteMessage(message.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleMessagePin(message.id, message.is_pinned || false)}
                              >
                                {message.is_pinned ? (
                                  <>
                                    <Pin className="w-4 h-4" />
                                    برداشتن سنجاق
                                  </>
                                ) : (
                                  <>
                                    <Pin className="w-4 h-4" />
                                    سنجاق
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <TopicManagement />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <SupportAgentManagement />
            </TabsContent>

            <TabsContent value="live" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>تنظیمات پخش زنده</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLiveSettingsSubmit} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_live"
                        checked={liveForm.is_live}
                        onCheckedChange={(checked) => setLiveForm({ ...liveForm, is_live: checked })}
                      />
                      <Label htmlFor="is_live">پخش زنده فعال باشد؟</Label>
                    </div>
                    <div>
                      <Label htmlFor="stream_code">کد استریم</Label>
                      <Textarea
                        id="stream_code"
                        value={liveForm.stream_code}
                        onChange={(e) => setLiveForm({ ...liveForm, stream_code: e.target.value })}
                        placeholder="کد HTML برای پخش زنده"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">عنوان پخش زنده</Label>
                      <Input
                        id="title"
                        value={liveForm.title}
                        onChange={(e) => setLiveForm({ ...liveForm, title: e.target.value })}
                        placeholder="عنوان پخش زنده"
                      />
                    </div>
                    <div>
                      <Label htmlFor="viewers">تعداد بینندگان</Label>
                      <Input
                        type="number"
                        id="viewers"
                        value={liveForm.viewers}
                        onChange={(e) => setLiveForm({ ...liveForm, viewers: parseInt(e.target.value) })}
                        placeholder="تعداد بینندگان"
                      />
                    </div>
                    <Button type="submit">
                      به‌روزرسانی تنظیمات
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rafiei-meet" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    🎥 تنظیمات رفیعی میت (جلسه تصویری)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rafieiMeetLoading ? (
                    <p className="text-center">در حال بارگذاری...</p>
                  ) : (
                    <form onSubmit={handleRafieiMeetSubmit} className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="rafiei_meet_active"
                          checked={rafieiMeetForm.is_active}
                          onCheckedChange={(checked) => setRafieiMeetForm({ ...rafieiMeetForm, is_active: checked })}
                        />
                        <Label htmlFor="rafiei_meet_active" className="text-lg font-medium">
                          {rafieiMeetForm.is_active ? '🟢 جلسه تصویری فعال است' : '🔴 جلسه تصویری غیرفعال است'}
                        </Label>
                      </div>
                      
                      <div>
                        <Label htmlFor="rafiei_meet_title">عنوان جلسه</Label>
                        <Input
                          id="rafiei_meet_title"
                          value={rafieiMeetForm.title}
                          onChange={(e) => setRafieiMeetForm({ ...rafieiMeetForm, title: e.target.value })}
                          placeholder="عنوان جلسه تصویری"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="rafiei_meet_description">توضیحات</Label>
                        <Textarea
                          id="rafiei_meet_description"
                          value={rafieiMeetForm.description}
                          onChange={(e) => setRafieiMeetForm({ ...rafieiMeetForm, description: e.target.value })}
                          placeholder="توضیحات جلسه تصویری"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="rafiei_meet_url">لینک جلسه</Label>
                        <Input
                          id="rafiei_meet_url"
                          value={rafieiMeetForm.meet_url}
                          onChange={(e) => setRafieiMeetForm({ ...rafieiMeetForm, meet_url: e.target.value })}
                          placeholder="https://meet.jit.si/rafiei"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          می‌توانید از Jitsi Meet، Google Meet، Zoom یا هر سرویس دیگری استفاده کنید
                        </p>
                      </div>
                      
                      <Button type="submit" className="w-full">
                        <Video className="w-4 h-4 mr-2" />
                        به‌روزرسانی تنظیمات رفیعی میت
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Preview Card */}
              {rafieiMeetSettings?.is_active && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200">
                      پیش‌نمایش جلسه فعال
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <p className="text-green-800 dark:text-green-200 mb-2">
                        ✅ جلسه تصویری در حال حاضر برای کاربران نمایش داده می‌شود
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        عنوان: {rafieiMeetSettings.title}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        لینک: {rafieiMeetSettings.meet_url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubAdmin;
