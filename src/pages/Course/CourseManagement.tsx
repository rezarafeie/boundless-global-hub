import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  is_active: boolean;
  redirect_url: string | null;
  spotplayer_course_id: string | null;
  is_spotplayer_enabled: boolean;
  create_test_license: boolean;
  woocommerce_create_access: boolean;
  support_link: string | null;
  telegram_channel_link: string | null;
  gifts_link: string | null;
  created_at: string;
}

const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = courseId && courseId !== 'new';
  const { toast } = useToast();
  
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    slug: '',
    price: 0,
    redirect_url: '',
    spotplayer_course_id: '',
    is_spotplayer_enabled: false,
    create_test_license: false,
    woocommerce_create_access: true,
    support_link: '',
    telegram_channel_link: '',
    gifts_link: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      
      if (data) {
        setCourseForm({
          title: data.title,
          description: data.description || '',
          slug: data.slug,
          price: data.price,
          redirect_url: data.redirect_url || '',
          spotplayer_course_id: data.spotplayer_course_id || '',
          is_spotplayer_enabled: data.is_spotplayer_enabled || false,
          create_test_license: data.create_test_license || false,
          woocommerce_create_access: data.woocommerce_create_access !== false,
          support_link: data.support_link || '',
          telegram_channel_link: data.telegram_channel_link || '',
          gifts_link: data.gifts_link || '',
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات دوره",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      if (isEdit) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseForm)
          .eq('id', courseId);
        if (error) throw error;
        toast({ title: "دوره بروزرسانی شد" });
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert(courseForm);
        if (error) throw error;
        toast({ title: "دوره جدید ایجاد شد" });
      }
      
      // Navigate back to admin panel
      navigate('/enroll/admin?tab=courses');
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره دوره",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    navigate('/enroll/admin?tab=courses');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'ویرایش دوره' : 'ایجاد دوره جدید'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEdit ? 'ویرایش اطلاعات دوره موجود' : 'ایجاد دوره جدید در سیستم'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات دوره</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان دوره *</Label>
                <Input
                  id="title"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="نام دوره"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">اسلاگ *</Label>
                <Input
                  id="slug"
                  value={courseForm.slug}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="course-slug"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="توضیحات دوره..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">قیمت (تومان)</Label>
                <Input
                  id="price"
                  type="number"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="redirect_url">لینک دسترسی</Label>
                <Input
                  id="redirect_url"
                  value={courseForm.redirect_url}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, redirect_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Course Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="course-active" className="text-base font-medium">
                  وضعیت دوره
                </Label>
                <p className="text-sm text-muted-foreground">
                  دوره فعال برای کاربران قابل مشاهده است
                </p>
              </div>
              <Switch
                id="course-active"
                checked={courseForm.is_active}
                onCheckedChange={(checked) => 
                  setCourseForm(prev => ({ ...prev, is_active: checked }))
                }
              />
            </div>

            {/* SpotPlayer Configuration */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-lg font-semibold">تنظیمات رفیعی پلیر</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="spotplayer-toggle" className="text-base font-medium">
                    رفیعی پلیر (SpotPlayer)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    فعال‌سازی پخش ویدیو از طریق رفیعی پلیر
                  </p>
                </div>
                <Switch
                  id="spotplayer-toggle"
                  checked={courseForm.is_spotplayer_enabled}
                  onCheckedChange={(checked) => 
                    setCourseForm(prev => ({ 
                      ...prev, 
                      is_spotplayer_enabled: checked,
                      spotplayer_course_id: checked ? prev.spotplayer_course_id : ''
                    }))
                  }
                />
              </div>

              {courseForm.is_spotplayer_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spotplayer_course_id">شناسه دوره در رفیعی پلیر</Label>
                    <Input
                      id="spotplayer_course_id"
                      value={courseForm.spotplayer_course_id}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, spotplayer_course_id: e.target.value }))}
                      placeholder="شناسه دوره از رفیعی پلیر"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="test-license-toggle" className="text-base font-medium">
                        ایجاد لایسنس تستی
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        برای کاربران ثبت‌نام شده لایسنس تستی ایجاد شود
                      </p>
                    </div>
                    <Switch
                      id="test-license-toggle"
                      checked={courseForm.create_test_license}
                      onCheckedChange={(checked) => 
                        setCourseForm(prev => ({ ...prev, create_test_license: checked }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* WooCommerce Configuration */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-lg font-semibold">تنظیمات ووکامرس</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="woocommerce-access-toggle" className="text-base font-medium">
                    ایجاد دسترسی ووکامرس
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    پس از ثبت‌نام موفق، کاربر به ووکامرس منتقل شود
                  </p>
                </div>
                <Switch
                  id="woocommerce-access-toggle"
                  checked={courseForm.woocommerce_create_access}
                  onCheckedChange={(checked) => 
                    setCourseForm(prev => ({ ...prev, woocommerce_create_access: checked }))
                  }
                />
              </div>
            </div>

            {/* Course Links Configuration - Only show if course is active */}
            {courseForm.is_active && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold">لینک‌های دوره</h3>
                <p className="text-sm text-muted-foreground">
                  لینک‌های اختیاری که به کاربران ثبت‌نام شده نمایش داده می‌شود
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="support_link">لینک فعال‌سازی پشتیبانی</Label>
                    <Input
                      id="support_link"
                      value={courseForm.support_link}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, support_link: e.target.value }))}
                      placeholder="https://t.me/your_support_bot"
                    />
                    <p className="text-xs text-muted-foreground">
                      لینک بات تلگرام یا سیستم پشتیبانی دوره
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram_channel_link">لینک کانال تلگرام</Label>
                    <Input
                      id="telegram_channel_link"
                      value={courseForm.telegram_channel_link}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, telegram_channel_link: e.target.value }))}
                      placeholder="https://t.me/your_course_channel"
                    />
                    <p className="text-xs text-muted-foreground">
                      لینک کانال تلگرام مخصوص این دوره
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gifts_link">لینک دانلود هدایا</Label>
                    <Input
                      id="gifts_link"
                      value={courseForm.gifts_link}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, gifts_link: e.target.value }))}
                      placeholder="https://drive.google.com/your_bonus_materials"
                    />
                    <p className="text-xs text-muted-foreground">
                      لینک دانلود محتوای تکمیلی و هدایای دوره
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleBack}>
                انصراف
              </Button>
              <Button onClick={handleSave} disabled={processing}>
                <Save className="h-4 w-4 ml-2" />
                {processing ? 'در حال ذخیره...' : 'ذخیره دوره'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CourseManagement;