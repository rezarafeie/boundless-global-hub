import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, DollarSign, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import { TetherlandService } from '@/lib/tetherlandService';

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  use_dollar_price: boolean;
  usd_price: number | null;
  is_active: boolean;
  redirect_url: string | null;
  spotplayer_course_id: string | null;
  is_spotplayer_enabled: boolean;
  create_test_license: boolean;
  woocommerce_create_access: boolean;
  support_link: string | null;
  telegram_channel_link: string | null;
  gifts_link: string | null;
  enable_course_access: boolean;
  is_free_access: boolean;
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
    use_dollar_price: false,
    usd_price: 0,
    redirect_url: '',
    spotplayer_course_id: '',
    is_spotplayer_enabled: false,
    create_test_license: false,
    woocommerce_create_access: true,
    support_link: '',
    telegram_channel_link: '',
    gifts_link: '',
    enable_course_access: false,
    is_free_access: false,
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [calculatedRialPrice, setCalculatedRialPrice] = useState<number | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchCourse();
    }
  }, [courseId]);

  // Fetch exchange rate and calculate Rial price when USD price changes
  useEffect(() => {
    if (courseForm.use_dollar_price && courseForm.usd_price && courseForm.usd_price > 0) {
      fetchExchangeRate(courseForm.usd_price);
    } else {
      setExchangeRate(null);
      setCalculatedRialPrice(null);
    }
  }, [courseForm.use_dollar_price, courseForm.usd_price]);

  const fetchExchangeRate = async (usdAmount: number) => {
    setLoadingExchangeRate(true);
    try {
      const rialAmount = await TetherlandService.convertUSDToIRR(usdAmount);
      const rate = await TetherlandService.getUSDTToIRRRate();
      
      setExchangeRate(rate);
      setCalculatedRialPrice(rialAmount);
      
      // Update the price field with calculated Rial amount
      setCourseForm(prev => ({ ...prev, price: rialAmount }));
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت نرخ ارز",
        variant: "destructive"
      });
    } finally {
      setLoadingExchangeRate(false);
    }
  };

  const refreshExchangeRate = () => {
    if (courseForm.usd_price && courseForm.usd_price > 0) {
      fetchExchangeRate(courseForm.usd_price);
    }
  };

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
          use_dollar_price: data.use_dollar_price || false,
          usd_price: data.usd_price || 0,
          redirect_url: data.redirect_url || '',
          spotplayer_course_id: data.spotplayer_course_id || '',
          is_spotplayer_enabled: data.is_spotplayer_enabled || false,
          create_test_license: data.create_test_license || false,
          woocommerce_create_access: data.woocommerce_create_access !== false,
          support_link: data.support_link || '',
          telegram_channel_link: data.telegram_channel_link || '',
          gifts_link: data.gifts_link || '',
          enable_course_access: data.enable_course_access || false,
          is_free_access: data.is_free_access || false,
          is_active: data.is_active
        });

        // If editing a dollar-priced course, fetch the exchange rate
        if (data.use_dollar_price && data.usd_price) {
          fetchExchangeRate(data.usd_price);
        }
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
      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        slug: courseForm.slug,
        price: courseForm.price,
        use_dollar_price: courseForm.use_dollar_price,
        usd_price: courseForm.use_dollar_price ? courseForm.usd_price : null,
        redirect_url: courseForm.redirect_url,
        spotplayer_course_id: courseForm.spotplayer_course_id,
        is_spotplayer_enabled: courseForm.is_spotplayer_enabled,
        create_test_license: courseForm.create_test_license,
        woocommerce_create_access: courseForm.woocommerce_create_access,
        support_link: courseForm.support_link,
        telegram_channel_link: courseForm.telegram_channel_link,
        gifts_link: courseForm.gifts_link,
        enable_course_access: courseForm.enable_course_access,
        is_free_access: courseForm.is_free_access,
        is_active: courseForm.is_active
      };

      if (isEdit) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId);
        if (error) throw error;
        toast({ title: "دوره بروزرسانی شد" });
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert(courseData);
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

            {/* Pricing Section */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                تنظیمات قیمت‌گذاری
              </h3>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="use_dollar_price"
                  checked={courseForm.use_dollar_price}
                  onCheckedChange={(checked) => {
                    setCourseForm(prev => ({ ...prev, use_dollar_price: checked }));
                    if (!checked) {
                      setExchangeRate(null);
                      setCalculatedRialPrice(null);
                    }
                  }}
                />
                <Label htmlFor="use_dollar_price">استفاده از قیمت دلاری</Label>
              </div>

              {courseForm.use_dollar_price ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="usd_price">قیمت (دلار آمریکا) *</Label>
                    <Input
                      id="usd_price"
                      type="number"
                      step="0.01"
                      value={courseForm.usd_price}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, usd_price: parseFloat(e.target.value) || 0 }))}
                      placeholder="49.99"
                      required={courseForm.use_dollar_price}
                    />
                  </div>

                  {exchangeRate && calculatedRialPrice && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-800 dark:text-blue-400">قیمت محاسبه شده</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={refreshExchangeRate}
                          disabled={loadingExchangeRate}
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingExchangeRate ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          نرخ تتر به ریال: {TetherlandService.formatIRRAmount(exchangeRate)} ریال
                        </p>
                        <p className="font-medium text-lg text-blue-700 dark:text-blue-300">
                          قیمت نهایی: {TetherlandService.formatIRRAmount(calculatedRialPrice)} ریال
                        </p>
                      </div>
                    </div>
                  )}

                  {loadingExchangeRate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      در حال دریافت نرخ ارز...
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="price">قیمت (تومان) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="2500000"
                    required
                  />
                </div>
              )}
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

            {/* Course Access System */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-lg font-semibold">سیستم دسترسی آکادمی جدید</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="course-access-toggle" className="text-base font-medium">
                    فعال‌سازی سیستم دسترسی دوره
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    اگر فعال باشد، کاربران می‌توانند به محتوای دروس دسترسی پیدا کنند
                  </p>
                </div>
                <Switch
                  id="course-access-toggle"
                  checked={courseForm.enable_course_access}
                  onCheckedChange={(checked) => 
                    setCourseForm(prev => ({ ...prev, enable_course_access: checked }))
                  }
                />
              </div>

              {courseForm.enable_course_access && (
                <div className="mt-6 space-y-4">
                  {/* Free Access Option */}
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="space-y-1">
                      <Label htmlFor="free-access-toggle" className="text-base font-medium text-green-800 dark:text-green-400">
                        دسترسی رایگان عمومی
                      </Label>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        اگر فعال باشد، لینک /access نیازی به ورود یا احراز هویت ندارد و همه می‌توانند محتوای دوره را ببینند
                      </p>
                    </div>
                    <Switch
                      id="free-access-toggle"
                      checked={courseForm.is_free_access}
                      onCheckedChange={(checked) => 
                        setCourseForm(prev => ({ ...prev, is_free_access: checked }))
                      }
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">مدیریت دروس و بخش‌ها</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                      برای مدیریت کامل دروس و بخش‌های این دوره، ابتدا دوره را ذخیره کنید
                    </p>
                    <Button
                      variant="outline"
                      disabled={!isEdit}
                      onClick={() => navigate(`/enroll/admin/course/${courseId}/lessons`)}
                      className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      {isEdit ? 'مدیریت دروس و بخش‌ها' : 'ابتدا دوره را ذخیره کنید'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Course Links */}
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
