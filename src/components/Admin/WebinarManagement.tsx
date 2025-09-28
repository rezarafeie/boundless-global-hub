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
  created_at: string;
}

interface WebinarSignup {
  id: string;
  mobile_number: string;
  signup_time: string;
  webinar_id: string;
}

const WebinarManagement: React.FC = () => {
  const { toast } = useToast();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [signups, setSignups] = useState<WebinarSignup[]>([]);
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    webinar_link: '',
    description: ''
  });

  useEffect(() => {
    fetchWebinars();
  }, []);

  useEffect(() => {
    if (selectedWebinarId) {
      fetchSignups(selectedWebinarId);
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

  const fetchSignups = async (webinarId: string) => {
    try {
      const { data, error } = await supabase
        .from('webinar_signups')
        .select('*')
        .eq('webinar_id', webinarId)
        .order('signup_time', { ascending: false });

      if (error) throw error;
      setSignups(data || []);
    } catch (error) {
      console.error('Error fetching signups:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت ثبت‌نام‌ها",
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
      const slug = generateSlug(formData.title);
      const webinarData = {
        ...formData,
        slug,
        description: formData.description || null
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
      setFormData({ title: '', start_date: '', webinar_link: '', description: '' });
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
    setFormData({
      title: webinar.title,
      start_date: format(new Date(webinar.start_date), 'yyyy-MM-dd\'T\'HH:mm'),
      webinar_link: webinar.webinar_link,
      description: webinar.description || ''
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

  const exportSignups = async (webinarId: string, webinarTitle: string) => {
    try {
      const { data, error } = await supabase
        .from('webinar_signups')
        .select('mobile_number, signup_time')
        .eq('webinar_id', webinarId)
        .order('signup_time', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "اطلاع",
          description: "هیچ ثبت‌نامی برای این وبینار یافت نشد",
          variant: "default"
        });
        return;
      }

      const csvContent = [
        ['شماره موبایل', 'زمان ثبت‌نام'],
        ...data.map(signup => [
          signup.mobile_number,
          format(new Date(signup.signup_time), 'yyyy/MM/dd HH:mm:ss')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `webinar_signups_${webinarTitle}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "موفقیت",
        description: "فایل CSV با موفقیت دانلود شد"
      });
    } catch (error) {
      console.error('Error exporting signups:', error);
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
                setFormData({ title: '', start_date: '', webinar_link: '', description: '' });
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
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="عنوان وبینار را وارد کنید"
                    required
                  />
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
              <TabsTrigger value="signups">ثبت‌نام‌ها</TabsTrigger>
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
                                fetchSignups(webinar.id);
                              }}
                            >
                              <Users className="h-4 w-4 ml-1" />
                              مشاهده ثبت‌نام‌ها
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
            
            <TabsContent value="signups" className="space-y-4">
              {selectedWebinarId ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      ثبت‌نام‌های وبینار: {webinars.find(w => w.id === selectedWebinarId)?.title}
                    </h3>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const webinar = webinars.find(w => w.id === selectedWebinarId);
                        if (webinar) {
                          exportSignups(selectedWebinarId, webinar.title);
                        }
                      }}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      دانلود CSV
                    </Button>
                  </div>
                  {signups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">هیچ ثبت‌نامی یافت نشد</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>شماره موبایل</TableHead>
                          <TableHead>زمان ثبت‌نام</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {signups.map((signup) => (
                          <TableRow key={signup.id}>
                            <TableCell>{signup.mobile_number}</TableCell>
                            <TableCell>{formatDate(signup.signup_time)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">وبیناری انتخاب نشده</p>
                  <p className="text-sm text-muted-foreground">برای مشاهده ثبت‌نام‌ها، ابتدا یک وبینار انتخاب کنید</p>
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