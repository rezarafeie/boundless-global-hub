import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

const WebinarEdit: React.FC = () => {
  const { webinarId } = useParams<{ webinarId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    start_date: '',
    webinar_link: '',
    description: '',
    telegram_channel_link: '',
    iframe_embed_code: '',
    host_name: ''
  });

  useEffect(() => {
    if (webinarId) fetchWebinar();
  }, [webinarId]);

  const fetchWebinar = async () => {
    try {
      const { data, error } = await supabase
        .from('webinar_entries')
        .select('*')
        .eq('id', webinarId)
        .single();

      if (error) throw error;

      const utcDate = new Date(data.start_date);
      const tehranDate = new Date(utcDate.getTime() + (3.5 * 60 * 60 * 1000));

      setFormData({
        title: data.title,
        slug: data.slug,
        start_date: format(tehranDate, "yyyy-MM-dd'T'HH:mm"),
        webinar_link: data.webinar_link,
        description: data.description || '',
        telegram_channel_link: data.telegram_channel_link || '',
        iframe_embed_code: (data as any).iframe_embed_code || '',
        host_name: (data as any).host_name || ''
      });
    } catch (error) {
      console.error('Error fetching webinar:', error);
      toast({ title: "خطا", description: "وبینار یافت نشد", variant: "destructive" });
    } finally {
      setLoading(false);
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
    setSaving(true);

    try {
      const finalSlug = formData.slug.trim() || generateSlug(formData.title);
      const localDate = new Date(formData.start_date);
      const utcDate = new Date(localDate.getTime() - (3.5 * 60 * 60 * 1000));

      const webinarData = {
        title: formData.title,
        slug: finalSlug,
        start_date: utcDate.toISOString(),
        webinar_link: formData.webinar_link,
        description: formData.description || null,
        telegram_channel_link: formData.telegram_channel_link || null,
        iframe_embed_code: formData.iframe_embed_code || null,
        host_name: formData.host_name || null
      };

      const { error } = await supabase
        .from('webinar_entries')
        .update(webinarData)
        .eq('id', webinarId);

      if (error) throw error;

      toast({ title: "موفقیت", description: "وبینار با موفقیت ویرایش شد" });
      navigate('/enroll/admin/webinar');
    } catch (error) {
      console.error('Error saving webinar:', error);
      toast({ title: "خطا", description: "خطا در ذخیره وبینار", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!role) {
    return <div className="text-center py-8 text-muted-foreground">دسترسی غیرمجاز</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/enroll/admin/webinar')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">ویرایش وبینار</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان وبینار</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">لینک وبینار</label>
              <Input
                type="url"
                value={formData.webinar_link}
                onChange={(e) => setFormData({ ...formData, webinar_link: e.target.value })}
                placeholder="https://example.com/webinar"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">توضیحات (اختیاری)</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات وبینار..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">لینک کانال تلگرام (اختیاری)</label>
              <Input
                type="url"
                value={formData.telegram_channel_link}
                onChange={(e) => setFormData({ ...formData, telegram_channel_link: e.target.value })}
                placeholder="https://t.me/your_channel"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نام میزبان (اختیاری)</label>
              <Input
                value={formData.host_name}
                onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                placeholder="نام میزبان وبینار"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">کد iframe پخش زنده (اختیاری)</label>
              <Textarea
                value={formData.iframe_embed_code}
                onChange={(e) => setFormData({ ...formData, iframe_embed_code: e.target.value })}
                placeholder='<iframe src="..." ...></iframe>'
                rows={3}
                dir="ltr"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/enroll/admin/webinar')}>
                لغو
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 ml-2" />
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebinarEdit;
