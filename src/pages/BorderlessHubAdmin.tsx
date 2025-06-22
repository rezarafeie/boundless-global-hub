import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Bell, Settings, MessageSquare, Users, Pin, Trash2, Play, Video, Image, AudioLines, Monitor, Shield, UserCog, Plus, Edit, Loader2, Search } from 'lucide-react';
import { useAnnouncements, useChatMessages, useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { announcementsService, chatService, liveService } from '@/lib/supabase';
import { rafieiMeetService } from '@/lib/rafieiMeet';
import { messengerService, type MessengerUser, type ChatRoom } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import UserManagement from '@/components/Admin/UserManagement';
import TopicManagement from '@/components/Admin/TopicManagement';
import SupportAgentManagement from '@/components/Admin/SupportAgentManagement';
import SupportAgentAssignments from '@/components/Admin/SupportAgentAssignments';
import MessageManagement from '@/components/Admin/MessageManagement';
import type { AnnouncementInsert } from '@/types/supabase';

const BorderlessHubAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { messages, loading: messagesLoading } = useChatMessages();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  const { settings: rafieiMeetSettings, loading: rafieiMeetLoading } = useRafieiMeet();

  // Messenger state
  const [messengerUsers, setMessengerUsers] = useState<MessengerUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messengerLoading, setMessengerLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

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

  // Room form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'public_group',
    description: '',
    is_boundless_only: false
  });

  useEffect(() => {
    // Get session token from localStorage for messenger functionality
    const storedToken = localStorage.getItem('messenger_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
    }
  }, []);

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

  useEffect(() => {
    if (sessionToken) {
      fetchMessengerData();
    }
  }, [sessionToken]);

  const fetchMessengerData = async () => {
    try {
      setMessengerLoading(true);
      console.log('Fetching messenger admin data...');
      
      const [usersData, roomsData] = await Promise.all([
        messengerService.getApprovedUsers(),
        sessionToken ? messengerService.getRooms(sessionToken) : Promise.resolve([])
      ]);
      
      console.log('Fetched messenger users:', usersData.length);
      console.log('Fetched messenger rooms:', roomsData.length);
      
      setMessengerUsers(usersData);
      setRooms(roomsData);
    } catch (error: any) {
      console.error('Error fetching messenger data:', error);
      if (!sessionToken) {
        console.log('No session token - some messenger features may be limited');
      }
    } finally {
      setMessengerLoading(false);
    }
  };

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

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      toast({
        title: 'خطا',
        description: 'لطفاً دوباره وارد شوید',
        variant: 'destructive',
      });
      return;
    }

    if (!roomForm.name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام اتاق الزامی است',
        variant: 'destructive',
      });
      return;
    }

    setCreateLoading(true);
    try {
      console.log('Creating room with data:', roomForm);
      
      const newRoom = await messengerService.createRoom(roomForm, sessionToken);
      
      console.log('Room created successfully:', newRoom);
      
      toast({
        title: 'موفق',
        description: `اتاق "${newRoom.name}" ایجاد شد`,
      });
      
      setRoomForm({
        name: '',
        type: 'public_group',
        description: '',
        is_boundless_only: false
      });
      
      await fetchMessengerData();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: 'خطا در ایجاد اتاق',
        description: error.message || 'خطا در ایجاد اتاق جدید',
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRoom = async (room: ChatRoom, updates: Partial<ChatRoom>) => {
    if (!sessionToken) return;

    try {
      console.log('Updating room:', room.id, updates);
      
      const updatedRoom = await messengerService.updateRoom(room.id, updates, sessionToken);
      
      console.log('Room updated successfully:', updatedRoom);
      
      toast({
        title: 'موفق',
        description: `اتاق "${updatedRoom.name}" به‌روزرسانی شد`,
      });
      setEditingRoom(null);
      await fetchMessengerData();
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        title: 'خطا در به‌روزرسانی',
        description: error.message || 'خطا در به‌روزرسانی اتاق',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (!sessionToken) return;
    
    if (!confirm(`آیا از حذف اتاق "${roomName}" اطمینان دارید؟`)) return;

    setDeleteLoading(roomId);
    try {
      console.log('Deleting room:', roomId);
      
      await messengerService.deleteRoom(roomId, sessionToken);
      
      console.log('Room deleted successfully');
      
      toast({
        title: 'موفق',
        description: `اتاق "${roomName}" حذف شد`,
      });
      
      await fetchMessengerData();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'خطا در حذف',
        description: error.message || 'خطا در حذف اتاق',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'public_group':
        return 'گروه عمومی';
      case 'boundless_group':
        return 'گروه بدون مرز';
      case 'announcement_channel':
        return 'کانال اطلاعیه';
      default:
        return type;
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

  if (announcementsLoading || messagesLoading || liveLoading || rafieiMeetLoading || messengerLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پنل مدیریت...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 pt-20 admin-page">
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  پنل مدیریت جامع بدون مرز
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  مدیریت کامل اطلاعیه‌ها، کاربران، پیام‌رسان، پشتیبانی و پخش زنده
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                کاربران
              </TabsTrigger>
              <TabsTrigger value="support-agents" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                پشتیبانان
              </TabsTrigger>
              <TabsTrigger value="support-assignments" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                اختصاص پشتیبان
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                مدیریت پیام‌ها
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                اطلاعیه‌ها
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                اتاق‌های چت
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                تاپیک‌ها
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

            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>

            <TabsContent value="support-agents" className="space-y-6">
              <SupportAgentManagement />
            </TabsContent>

            <TabsContent value="support-assignments" className="space-y-6">
              <SupportAgentAssignments />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <MessageManagement />
            </TabsContent>

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

            <TabsContent value="rooms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ایجاد اتاق جدید</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <Label htmlFor="room-name">نام اتاق</Label>
                      <Input
                        id="room-name"
                        value={roomForm.name}
                        onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                        placeholder="نام اتاق را وارد کنید"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="room-type">نوع اتاق</Label>
                      <Select value={roomForm.type} onValueChange={(value) => setRoomForm({ ...roomForm, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع اتاق" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public_group">گروه عمومی</SelectItem>
                          <SelectItem value="boundless_group">گروه بدون مرز</SelectItem>
                          <SelectItem value="announcement_channel">کانال اطلاعیه</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room-description">توضیحات</Label>
                      <Textarea
                        id="room-description"
                        value={roomForm.description}
                        onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                        placeholder="توضیحات اتاق"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="boundless-only"
                        checked={roomForm.is_boundless_only}
                        onCheckedChange={(checked) => setRoomForm({ ...roomForm, is_boundless_only: checked })}
                      />
                      <Label htmlFor="boundless-only">فقط برای دانش‌پذیران بدون مرز</Label>
                    </div>
                    <Button type="submit" disabled={createLoading}>
                      {createLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          در حال ایجاد...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          ایجاد اتاق
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>اتاق‌های موجود ({rooms.length} اتاق)</CardTitle>
                </CardHeader>
                <CardContent>
                  {rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">هیچ اتاقی موجود نیست</p>
                      <Button onClick={fetchMessengerData} variant="ghost" className="mt-2">
                        بارگذاری مجدد
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{room.name}</h3>
                            <p className="text-sm text-slate-500">{room.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{getRoomTypeLabel(room.type)}</Badge>
                              {room.is_boundless_only && (
                                <Badge variant="secondary">بدون مرز</Badge>
                              )}
                              {room.is_active ? (
                                <Badge variant="default" className="bg-green-500">فعال</Badge>
                              ) : (
                                <Badge variant="destructive">غیرفعال</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRoom(room)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteRoom(room.id, room.name)}
                              disabled={deleteLoading === room.id}
                            >
                              {deleteLoading === room.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <TopicManagement />
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
