import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Video, Wifi, Megaphone, Image, Monitor, AudioLines, Trash2, Pin, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnnouncements, useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { announcementsService, liveService } from '@/lib/supabase';
import { rafieiMeetService } from '@/lib/rafieiMeet';
import type { AnnouncementInsert } from '@/types/supabase';

const HubManagementSection = () => {
  const { toast } = useToast();
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { liveSettings, loading: liveLoading } = useLiveSettings();
  const { settings: rafieiMeetSettings, loading: rafieiMeetLoading } = useRafieiMeet();

  // Form states
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

  const [liveForm, setLiveForm] = useState({
    is_live: false,
    stream_code: '',
    title: '',
    viewers: 0
  });

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

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">رفیعی میت</p>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {rafieiMeetForm.is_active ? 'فعال' : 'غیرفعال'}
                </p>
              </div>
              <Video className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">پخش زنده</p>
                <p className="text-lg font-bold text-red-800 dark:text-red-200">
                  {liveForm.is_live ? 'در حال پخش' : 'آفلاین'}
                </p>
              </div>
              <Wifi className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">اطلاعیه‌ها</p>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">
                  {announcements.length} فعال
                </p>
              </div>
              <Megaphone className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rafiei Meet Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            تنظیمات رفیعی میت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRafieiMeetSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="rafiei_meet_active"
                checked={rafieiMeetForm.is_active}
                onCheckedChange={(checked) => setRafieiMeetForm({ ...rafieiMeetForm, is_active: checked })}
              />
              <Label htmlFor="rafiei_meet_active" className="text-lg font-medium">
                {rafieiMeetForm.is_active ? '🟢 جلسه تصویری فعال' : '🔴 جلسه تصویری غیرفعال'}
              </Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rafiei_meet_title">عنوان جلسه</Label>
                <Input
                  id="rafiei_meet_title"
                  value={rafieiMeetForm.title}
                  onChange={(e) => setRafieiMeetForm({ ...rafieiMeetForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="rafiei_meet_url">لینک جلسه</Label>
                <Input
                  id="rafiei_meet_url"
                  value={rafieiMeetForm.meet_url}
                  onChange={(e) => setRafieiMeetForm({ ...rafieiMeetForm, meet_url: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="rafiei_meet_description">توضیحات</Label>
              <Textarea
                id="rafiei_meet_description"
                value={rafieiMeetForm.description}
                onChange={(e) => setRafieiMeetForm({ ...rafieiMeetForm, description: e.target.value })}
              />
            </div>
            
            <Button type="submit" className="w-full sm:w-auto">
              به‌روزرسانی تنظیمات
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Live Broadcast Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-red-600" />
            تنظیمات پخش زنده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLiveSettingsSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="is_live"
                checked={liveForm.is_live}
                onCheckedChange={(checked) => setLiveForm({ ...liveForm, is_live: checked })}
              />
              <Label htmlFor="is_live" className="text-lg font-medium">
                {liveForm.is_live ? '🔴 در حال پخش زنده' : '⚫ پخش زنده غیرفعال'}
              </Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">عنوان پخش زنده</Label>
                <Input
                  id="title"
                  value={liveForm.title}
                  onChange={(e) => setLiveForm({ ...liveForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="viewers">تعداد بینندگان</Label>
                <Input
                  type="number"
                  id="viewers"
                  value={liveForm.viewers}
                  onChange={(e) => setLiveForm({ ...liveForm, viewers: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="stream_code">کد استریم (HTML/Embed)</Label>
              <Textarea
                id="stream_code"
                value={liveForm.stream_code}
                onChange={(e) => setLiveForm({ ...liveForm, stream_code: e.target.value })}
                placeholder="کد HTML برای پخش زنده"
                rows={4}
              />
            </div>
            
            <Button type="submit" className="w-full sm:w-auto">
              به‌روزرسانی پخش زنده
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Announcement Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-green-600" />
            مدیریت اطلاعیه‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Form */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              ایجاد اطلاعیه جدید
            </h3>
            
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="type">نوع اطلاعیه</Label>
                  <Select onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عمومی</SelectItem>
                      <SelectItem value="urgent">فوری</SelectItem>
                      <SelectItem value="technical">فنی</SelectItem>
                      <SelectItem value="educational">آموزشی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  rows={4}
                />
              </div>
              
              {/* Media Type Selection */}
              <div>
                <Label>نوع رسانه</Label>
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
                </div>
              )}

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_pinned"
                  checked={announcementForm.is_pinned}
                  onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, is_pinned: checked })}
                />
                <Label htmlFor="is_pinned">سنجاق شود؟</Label>
              </div>
              
              <Button type="submit" className="w-full sm:w-auto">
                ایجاد اطلاعیه
              </Button>
            </form>
          </div>

          {/* Existing Announcements */}
          <div>
            <h3 className="font-semibold text-lg mb-4">اطلاعیه‌های موجود</h3>
            {announcementsLoading ? (
              <p className="text-center py-8">در حال بارگذاری...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{announcement.title}</CardTitle>
                        <Badge variant="outline">{announcement.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {announcement.summary}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {announcement.is_pinned && (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Pin className="w-3 h-3 mr-1" />
                            سنجاق شده
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubManagementSection;
