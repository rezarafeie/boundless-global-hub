import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit, Trash2, Users, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Webinar {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  webinar_link: string;
  description: string | null;
  telegram_channel_link: string | null;
  created_at: string;
}

interface WebinarSignup {
  id: string;
  mobile_number: string;
  signup_time: string;
  webinar_id: string;
}

interface WebinarRegistration {
  id: string;
  mobile_number: string;
  registered_at: string;
  webinar_id: string;
}

const WebinarManagement: React.FC = () => {
  const { toast } = useToast();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [registrations, setRegistrations] = useState<WebinarRegistration[]>([]);
  const [entries, setEntries] = useState<WebinarSignup[]>([]);
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    start_date: '',
    webinar_link: '',
    description: '',
    telegram_channel_link: ''
  });

  useEffect(() => {
    fetchWebinars();
  }, []);

  useEffect(() => {
    if (selectedWebinarId) {
      fetchRegistrations(selectedWebinarId);
      fetchEntries(selectedWebinarId);
    }
  }, [selectedWebinarId]);

  const fetchWebinars = async () => {
    try {
      const { data, error } = await supabase
        .from('webinar_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebinars(data || []);
    } catch (error) {
      console.error('Error fetching webinars:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت وبینارها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (webinarId: string) => {
    try {
      const { data, error } = await supabase
        .from('webinar_registrations')
        .select('*')
        .eq('webinar_id', webinarId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت ثبت‌نام‌ها",
        variant: "destructive"
      });
    }
  };

  const fetchEntries = async (webinarId: string) => {
    try {
      const { data, error } = await supabase
        .from('webinar_signups')
        .select('*')
        .eq('webinar_id', webinarId)
        .order('signup_time', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت ورودها",
        variant: "destructive"
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use the manually entered slug or generate one from title
      const finalSlug = formData.slug.trim() || generateSlug(formData.title);
      
      // Convert Tehran time to UTC for storage
      // The datetime-local input gives us a string in format: "2024-01-15T20:00"
      // We need to treat this as Tehran time and convert to UTC
      const localDate = new Date(formData.start_date);
      // Tehran is UTC+3:30, so subtract 3.5 hours to get UTC
      const utcDate = new Date(localDate.getTime() - (3.5 * 60 * 60 * 1000));
      
      const webinarData = {
        ...formData,
        start_date: utcDate.toISOString(),
        slug: finalSlug,
        description: formData.description || null,
        telegram_channel_link: formData.telegram_channel_link || null
      };

      if (editingWebinar) {
        const { error } = await supabase
          .from('webinar_entries')
          .update(webinarData)
          .eq('id', editingWebinar.id);

        if (error) throw error;
        
        toast({
          title: "موفقیت",
          description: "وبینار با موفقیت ویرایش شد"
        });
      } else {
        const { error } = await supabase
          .from('webinar_entries')
          .insert([webinarData]);

        if (error) throw error;
        
        toast({
          title: "موفقیت",
          description: "وبینار با موفقیت ایجاد شد"
        });
      }

      setIsCreateModalOpen(false);
      setEditingWebinar(null);
      setFormData({ title: '', slug: '', start_date: '', webinar_link: '', description: '', telegram_channel_link: '' });
      fetchWebinars();
    } catch (error) {
      console.error('Error saving webinar:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره وبینار",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (webinar: Webinar) => {
    setEditingWebinar(webinar);
    
    // Convert UTC time from database to Tehran time for editing
    const utcDate = new Date(webinar.start_date);
    // Tehran is UTC+3:30, so add 3.5 hours
    const tehranDate = new Date(utcDate.getTime() + (3.5 * 60 * 60 * 1000));
    
    setFormData({
      title: webinar.title,
      slug: webinar.slug,
      start_date: format(tehranDate, 'yyyy-MM-dd\'T\'HH:mm'),
      webinar_link: webinar.webinar_link,
      description: webinar.description || '',
      telegram_channel_link: webinar.telegram_channel_link || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (webinarId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این وبینار را حذف کنید؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('webinar_entries')
        .delete()
        .eq('id', webinarId);

      if (error) throw error;
      
      toast({
        title: "موفقیت",
        description: "وبینار با موفقیت حذف شد"
      });
      
      fetchWebinars();
    } catch (error) {
      console.error('Error deleting webinar:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف وبینار",
        variant: "destructive"
      });
    }
  };

  const exportData = async (data: any[], webinarTitle: string, type: 'registrations' | 'entries') => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "اطلاع",
          description: "هیچ داده‌ای برای خروجی یافت نشد",
          variant: "default"
        });
        return;
      }

      const timeField = type === 'registrations' ? 'registered_at' : 'signup_time';
      const csvContent = [
        ['شماره موبایل', type === 'registrations' ? 'زمان ثبت‌نام' : 'زمان ورود'],
        ...data.map(item => [
          item.mobile_number,
          format(new Date(item[timeField]), 'yyyy/MM/dd HH:mm:ss')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `webinar_${type}_${webinarTitle}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "موفقیت",
        description: "فایل CSV با موفقیت دانلود شد"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "خطا",
        description: "خطا در دانلود فایل",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWebinarStatus = (startDate: string) => {
    const now = new Date();
    const webinarDate = new Date(startDate);
    
    if (webinarDate > now) {
      return { status: 'upcoming', label: 'آینده', variant: 'secondary' as const };
    } else {
      return { status: 'past', label: 'گذشته', variant: 'outline' as const };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            مدیریت وبینارها
          </CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingWebinar(null);
                setFormData({ title: '', slug: '', start_date: '', webinar_link: '', description: '', telegram_channel_link: '' });
              }}>
                <Plus className="h-4 w-4 ml-2" />
                ایجاد وبینار جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingWebinar ? 'ویرایش وبینار' : 'ایجاد وبینار جدید'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان وبینار</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData({
                        ...formData, 
                        title: newTitle,
                        // Auto-generate slug only if slug is empty and this is not an edit
                        slug: !editingWebinar && !formData.slug ? generateSlug(newTitle) : formData.slug
                      });
                    }}
                    placeholder="عنوان وبینار را وارد کنید"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    آدرس URL (اسلاگ)
                    <span className="text-xs text-muted-foreground mr-2">
                      - در صورت خالی گذاشتن، خودکار از عنوان تولید می‌شود
                    </span>
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder={generateSlug(formData.title) || "webinar-slug"}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    لینک صفحه وبینار: /webinar/{formData.slug || generateSlug(formData.title)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">تاریخ و زمان شروع</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">لینک وبینار</label>
                  <Input
                    type="url"
                    value={formData.webinar_link}
                    onChange={(e) => setFormData({...formData, webinar_link: e.target.value})}
                    placeholder="https://example.com/webinar"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">توضیحات (اختیاری)</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="توضیحات وبینار..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">لینک کانال تلگرام (اختیاری)</label>
                  <Input
                    type="url"
                    value={formData.telegram_channel_link}
                    onChange={(e) => setFormData({...formData, telegram_channel_link: e.target.value})}
                    placeholder="https://t.me/your_channel"
                    dir="ltr"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    لغو
                  </Button>
                  <Button type="submit">
                    {editingWebinar ? 'ویرایش' : 'ایجاد'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="webinars" className="space-y-4">
            <TabsList>
              <TabsTrigger value="webinars">وبینارها</TabsTrigger>
              <TabsTrigger value="registrations">ثبت نام ها</TabsTrigger>
              <TabsTrigger value="entries">ورود ها</TabsTrigger>
            </TabsList>
            
            <TabsContent value="webinars" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>در حال بارگذاری...</p>
                </div>
              ) : webinars.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">هیچ وبیناری یافت نشد</p>
                  <p className="text-sm text-muted-foreground">برای شروع، وبینار جدیدی ایجاد کنید</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>عنوان</TableHead>
                      <TableHead>تاریخ شروع</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>لینک عمومی</TableHead>
                      <TableHead>تعداد ثبت‌نام</TableHead>
                      <TableHead className="text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webinars.map((webinar) => {
                      const status = getWebinarStatus(webinar.start_date);
                      return (
                        <TableRow key={webinar.id}>
                          <TableCell className="font-medium">{webinar.title}</TableCell>
                          <TableCell>{formatDate(webinar.start_date)}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(`/webinar/${webinar.slug}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 ml-1" />
                              مشاهده صفحه
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedWebinarId(webinar.id);
                                fetchRegistrations(webinar.id);
                                fetchEntries(webinar.id);
                              }}
                            >
                              <Users className="h-4 w-4 ml-1" />
                              مشاهده آمار
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(webinar)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(webinar.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="registrations" className="space-y-4">
              {!selectedWebinarId ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">وبیناری انتخاب نشده</p>
                  <p className="text-sm text-muted-foreground">برای مشاهده ثبت‌نام‌ها، از تب وبینارها روی "مشاهده آمار" کلیک کنید</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">هیچ ثبت‌نامی یافت نشد</p>
                  <p className="text-sm text-muted-foreground">هنوز کسی در این وبینار ثبت‌نام نکرده است</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      {webinars.find(w => w.id === selectedWebinarId)?.title} - ثبت نام ها
                      <span className="text-sm text-muted-foreground mr-2">({registrations.length} نفر)</span>
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportData(
                        registrations, 
                        webinars.find(w => w.id === selectedWebinarId)?.title || 'webinar',
                        'registrations'
                      )}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      دانلود CSV
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ردیف</TableHead>
                        <TableHead>شماره موبایل</TableHead>
                        <TableHead>زمان ثبت‌نام</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((registration, index) => (
                        <TableRow key={registration.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell dir="ltr" className="text-right">{registration.mobile_number}</TableCell>
                          <TableCell>{format(new Date(registration.registered_at), 'yyyy/MM/dd HH:mm:ss')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="entries" className="space-y-4">
              {!selectedWebinarId ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">وبیناری انتخاب نشده</p>
                  <p className="text-sm text-muted-foreground">برای مشاهده ورودها، از تب وبینارها روی "مشاهده آمار" کلیک کنید</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">هیچ ورودی یافت نشد</p>
                  <p className="text-sm text-muted-foreground">هنوز کسی وارد این وبینار نشده است</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      {webinars.find(w => w.id === selectedWebinarId)?.title} - ورود ها
                      <span className="text-sm text-muted-foreground mr-2">({entries.length} نفر)</span>
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportData(
                        entries, 
                        webinars.find(w => w.id === selectedWebinarId)?.title || 'webinar',
                        'entries'
                      )}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      دانلود CSV
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ردیف</TableHead>
                        <TableHead>شماره موبایل</TableHead>
                        <TableHead>زمان ورود</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell dir="ltr" className="text-right">{entry.mobile_number}</TableCell>
                          <TableCell>{format(new Date(entry.signup_time), 'yyyy/MM/dd HH:mm:ss')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebinarManagement;