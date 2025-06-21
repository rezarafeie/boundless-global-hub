import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Bell, 
  MessageCircle, 
  Video, 
  Wifi, 
  Play,
  Pin,
  Eye,
  Calendar,
  Users,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  Upload
} from 'lucide-react';
import { useAnnouncements } from '@/hooks/useRealtime';
import { useLiveSettings } from '@/hooks/useRealtime';
import { useRafieiMeet } from '@/hooks/useRafieiMeet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TopicManagement from '@/components/Chat/TopicManagement';

interface AnnouncementForm {
  title: string;
  full_text: string;
  type: 'urgent' | 'general' | 'technical' | 'educational';
  is_pinned: boolean;
  media_type: 'none' | 'image' | 'audio' | 'video';
  media_content: string;
}

const BorderlessHubAdmin: React.FC = () => {
  const { announcements, loading: announcementsLoading, refetch: refetchAnnouncements } = useAnnouncements();
  const { liveSettings, loading: liveLoading, refetch: refetchLive } = useLiveSettings();
  const { settings: rafieiMeetSettings, loading: rafieiMeetLoading, refetch: refetchMeet } = useRafieiMeet();
  const { toast } = useToast();

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>({
    title: '',
    full_text: '',
    type: 'general',
    is_pinned: false,
    media_type: 'none',
    media_content: ''
  });
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  // Live stream state
  const [liveForm, setLiveForm] = useState({
    is_live: liveSettings?.is_live || false,
    stream_code: liveSettings?.stream_code || '',
    title: liveSettings?.title || '',
    viewers: liveSettings?.viewers || 0
  });
  const [isUpdatingLive, setIsUpdatingLive] = useState(false);

  // Rafiei Meet state
  const [meetForm, setMeetForm] = useState({
    is_active: rafieiMeetSettings?.is_active || false,
    meet_url: rafieiMeetSettings?.meet_url || '',
    title: rafieiMeetSettings?.title || '',
    description: rafieiMeetSettings?.description || ''
  });
  const [isUpdatingMeet, setIsUpdatingMeet] = useState(false);

  // Update forms when data loads
  React.useEffect(() => {
    if (liveSettings) {
      setLiveForm({
        is_live: liveSettings.is_live,
        stream_code: liveSettings.stream_code || '',
        title: liveSettings.title || '',
        viewers: liveSettings.viewers || 0
      });
    }
  }, [liveSettings]);

  React.useEffect(() => {
    if (rafieiMeetSettings) {
      setMeetForm({
        is_active: rafieiMeetSettings.is_active,
        meet_url: rafieiMeetSettings.meet_url || '',
        title: rafieiMeetSettings.title || '',
        description: rafieiMeetSettings.description || ''
      });
    }
  }, [rafieiMeetSettings]);

  const handleAnnouncementSubmit = async () => {
    if (!announcementForm.title.trim() || !announcementForm.full_text.trim()) {
      toast({
        title: "خطا",
        description: "عنوان و متن اطلاعیه الزامی است",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingAnnouncement(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([announcementForm]);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "اطلاعیه جدید منتشر شد"
      });
      
      setAnnouncementForm({
        title: '',
        full_text: '',
        type: 'general',
        is_pinned: false,
        media_type: 'none',
        media_content: ''
      });
      
      refetchAnnouncements();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در انتشار اطلاعیه",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  const handleLiveUpdate = async () => {
    setIsUpdatingLive(true);
    try {
      const { error } = await supabase
        .from('live_settings')
        .upsert([liveForm]);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "تنظیمات پخش زنده به‌روزرسانی شد"
      });
      
      refetchLive();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی تنظیمات",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingLive(false);
    }
  };

  const handleMeetUpdate = async () => {
    setIsUpdatingMeet(true);
    try {
      const { error } = await supabase
        .from('rafiei_meet_settings')
        .upsert([meetForm]);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "تنظیمات جلسه تصویری به‌روزرسانی شد"
      });
      
      refetchMeet();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی تنظیمات",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingMeet(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "اطلاعیه حذف شد"
      });
      
      refetchAnnouncements();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف اطلاعیه",
        variant: "destructive"
      });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:via-black dark:to-gray-800" dir="rtl">
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-700 to-pink-700 rounded-full mb-6 shadow-2xl">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              پنل مدیریت مرکز بدون مرز
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              مدیریت اطلاعیه‌ها، پخش زنده، جلسات و تنظیمات
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <Bell className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{announcements.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">اطلاعیه فعال</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <Play className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {liveSettings?.is_live ? 'فعال' : 'غیرفعال'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">پخش زنده</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <Video className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rafieiMeetSettings?.is_active ? 'فعال' : 'غیرفعال'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">جلسه تصویری</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{liveSettings?.viewers || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">بیننده آنلاین</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Topic Management */}
            <TopicManagement />
            
            {/* Announcements Management */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Bell className="w-6 h-6 text-blue-400" />
                  📢 مدیریت اطلاعیه‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Announcement Form */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white">اطلاعیه جدید</h3>
                  
                  <Input
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    placeholder="عنوان اطلاعیه..."
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                  
                  <Textarea
                    value={announcementForm.full_text}
                    onChange={(e) => setAnnouncementForm({...announcementForm, full_text: e.target.value})}
                    placeholder="متن کامل اطلاعیه..."
                    rows={4}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={announcementForm.type}
                      onValueChange={(value: any) => setAnnouncementForm({...announcementForm, type: value})}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="نوع اطلاعیه" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">عمومی</SelectItem>
                        <SelectItem value="urgent">فوری</SelectItem>
                        <SelectItem value="technical">فنی</SelectItem>
                        <SelectItem value="educational">آموزشی</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcementForm.is_pinned}
                        onCheckedChange={(checked) => setAnnouncementForm({...announcementForm, is_pinned: checked})}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">سنجاق شده</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAnnouncementSubmit}
                    disabled={isSubmittingAnnouncement}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    انتشار اطلاعیه
                  </Button>
                </div>

                {/* Existing Announcements */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">اطلاعیه‌های موجود</h3>
                  {announcementsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : announcements.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      هنوز اطلاعیه‌ای منتشر نشده است
                    </p>
                  ) : (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getAnnouncementTypeColor(announcement.type)}>
                              {getAnnouncementTypeLabel(announcement.type)}
                            </Badge>
                            {announcement.is_pinned && (
                              <Pin className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {announcement.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {announcement.full_text}
                          </p>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl" className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900 dark:text-white">حذف اطلاعیه</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                آیا مطمئن هستید که می‌خواهید این اطلاعیه را حذف کنید؟
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                                لغو
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Live Stream Management */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Play className="w-6 h-6 text-red-400" />
                  🔴 مدیریت پخش زنده
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={liveForm.is_live}
                    onCheckedChange={(checked) => setLiveForm({...liveForm, is_live: checked})}
                  />
                  <span className="text-gray-900 dark:text-white">
                    {liveForm.is_live ? '🔴 پخش زنده فعال' : '⚫ پخش زنده غیرفعال'}
                  </span>
                </div>
                
                <Input
                  value={liveForm.stream_code}
                  onChange={(e) => setLiveForm({...liveForm, stream_code: e.target.value})}
                  placeholder="کد پخش آپارات..."
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                
                <Input
                  value={liveForm.title}
                  onChange={(e) => setLiveForm({...liveForm, title: e.target.value})}
                  placeholder="عنوان پخش زنده..."
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                
                <Input
                  type="number"
                  value={liveForm.viewers}
                  onChange={(e) => setLiveForm({...liveForm, viewers: parseInt(e.target.value) || 0})}
                  placeholder="تعداد بینندگان..."
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                
                <Button
                  onClick={handleLiveUpdate}
                  disabled={isUpdatingLive}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Save className="w-4 h-4 ml-2" />
                  ذخیره تنظیمات
                </Button>
              </CardContent>
            </Card>
            
            {/* Rafiei Meet Management */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Video className="w-6 h-6 text-green-400" />
                  📹 مدیریت جلسه تصویری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={meetForm.is_active}
                    onCheckedChange={(checked) => setMeetForm({...meetForm, is_active: checked})}
                  />
                  <span className="text-gray-900 dark:text-white">
                    {meetForm.is_active ? '🟢 جلسه فعال' : '🔴 جلسه غیرفعال'}
                  </span>
                </div>
                
                <Input
                  value={meetForm.meet_url}
                  onChange={(e) => setMeetForm({...meetForm, meet_url: e.target.value})}
                  placeholder="لینک جلسه..."
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                
                <Input
                  value={meetForm.title}
                  onChange={(e) => setMeetForm({...meetForm, title: e.target.value})}
                  placeholder="عنوان جلسه..."
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                
                <Textarea
                  value={meetForm.description}
                  onChange={(e) => setMeetForm({...meetForm, description: e.target.value})}
                  placeholder="توضیحات جلسه..."
                  rows={3}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                
                <Button
                  onClick={handleMeetUpdate}
                  disabled={isUpdatingMeet}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 ml-2" />
                  ذخیره تنظیمات
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubAdmin;
