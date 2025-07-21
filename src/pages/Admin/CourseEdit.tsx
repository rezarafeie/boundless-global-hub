import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, DollarSign, RefreshCw, Percent, Clock, Link as LinkIcon, MessageCircle, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TetherlandService } from '@/lib/tetherlandService';
import MainLayout from '@/components/Layout/MainLayout';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  use_dollar_price: boolean;
  usd_price: number | null;
  is_sale_enabled?: boolean;
  sale_price?: number | null;
  sale_expires_at?: string | null;
  woocommerce_product_id: number | null;
  redirect_url: string | null;
  is_active: boolean;
  spotplayer_course_id?: string | null;
  is_spotplayer_enabled?: boolean;
  create_test_license?: boolean;
  woocommerce_create_access?: boolean;
  use_landing_page_merge?: boolean;
  enable_course_access?: boolean;
  support_link?: string | null;
  telegram_channel_link?: string | null;
  gifts_link?: string | null;
  created_at: string;
  updated_at: string;
}

const CourseEdit: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    price: '',
    use_dollar_price: false,
    usd_price: '',
    is_sale_enabled: false,
    sale_price: '',
    sale_expires_at: '',
    woocommerce_product_id: '',
    redirect_url: '',
    is_active: true,
    spotplayer_course_id: '',
    is_spotplayer_enabled: false,
    create_test_license: false,
    woocommerce_create_access: true,
    use_landing_page_merge: false,
    enable_course_access: false,
    support_link: '',
    telegram_channel_link: '',
    gifts_link: ''
  });

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [calculatedRialPrice, setCalculatedRialPrice] = useState<number | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Fetch exchange rate and calculate Rial price when USD price changes
  useEffect(() => {
    if (formData.use_dollar_price && formData.usd_price && parseFloat(formData.usd_price) > 0) {
      fetchExchangeRate(parseFloat(formData.usd_price));
    } else {
      setExchangeRate(null);
      setCalculatedRialPrice(null);
    }
  }, [formData.use_dollar_price, formData.usd_price]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      
      setCourse(data);
      setFormData({
        slug: data.slug,
        title: data.title,
        description: data.description || '',
        price: data.price.toString(),
        use_dollar_price: data.use_dollar_price || false,
        usd_price: data.usd_price?.toString() || '',
        is_sale_enabled: data.is_sale_enabled || false,
        sale_price: data.sale_price?.toString() || '',
        sale_expires_at: data.sale_expires_at ? new Date(data.sale_expires_at).toISOString().slice(0, 16) : '',
        woocommerce_product_id: data.woocommerce_product_id?.toString() || '',
        redirect_url: data.redirect_url || '',
        is_active: data.is_active,
        spotplayer_course_id: data.spotplayer_course_id || '',
        is_spotplayer_enabled: data.is_spotplayer_enabled || false,
        create_test_license: data.create_test_license || false,
        woocommerce_create_access: data.woocommerce_create_access !== false,
        use_landing_page_merge: data.use_landing_page_merge || false,
        enable_course_access: data.enable_course_access || false,
        support_link: data.support_link || '',
        telegram_channel_link: data.telegram_channel_link || '',
        gifts_link: data.gifts_link || ''
      });

      // If editing a dollar-priced course, fetch the exchange rate
      if (data.use_dollar_price && data.usd_price) {
        fetchExchangeRate(data.usd_price);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری دوره",
        variant: "destructive"
      });
      navigate('/enroll/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRate = async (usdAmount: number) => {
    setLoadingExchangeRate(true);
    try {
      const rialAmount = await TetherlandService.convertUSDToIRR(usdAmount);
      const rate = await TetherlandService.getUSDTToIRRRate();
      
      setExchangeRate(rate);
      setCalculatedRialPrice(rialAmount);
      
      // Update the price field with calculated Rial amount
      setFormData(prev => ({ ...prev, price: rialAmount.toString() }));
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
    if (formData.usd_price && parseFloat(formData.usd_price) > 0) {
      fetchExchangeRate(parseFloat(formData.usd_price));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.slug.trim() || !formData.price) {
      toast({
        title: "خطا",
        description: "لطفا تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    try {
      const courseData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        use_dollar_price: formData.use_dollar_price,
        usd_price: formData.use_dollar_price && formData.usd_price ? parseFloat(formData.usd_price) : null,
        is_sale_enabled: formData.is_sale_enabled,
        sale_price: formData.is_sale_enabled && formData.sale_price ? parseFloat(formData.sale_price) : null,
        sale_expires_at: formData.is_sale_enabled && formData.sale_expires_at ? new Date(formData.sale_expires_at).toISOString() : null,
        woocommerce_product_id: formData.woocommerce_product_id ? parseInt(formData.woocommerce_product_id) : null,
        redirect_url: formData.redirect_url.trim() || null,
        is_active: formData.is_active,
        spotplayer_course_id: formData.spotplayer_course_id.trim() || null,
        is_spotplayer_enabled: formData.is_spotplayer_enabled,
        create_test_license: formData.create_test_license,
        woocommerce_create_access: formData.woocommerce_create_access,
        use_landing_page_merge: formData.use_landing_page_merge,
        enable_course_access: formData.enable_course_access,
        support_link: formData.support_link.trim() || null,
        telegram_channel_link: formData.telegram_channel_link.trim() || null,
        gifts_link: formData.gifts_link.trim() || null
      };

      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseId);
      
      if (error) throw error;
      
      toast({
        title: "موفق",
        description: "دوره با موفقیت به‌روزرسانی شد"
      });

      navigate('/enroll/admin');
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره دوره",
        variant: "destructive"
      });
    }
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

  if (!course) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">دوره یافت نشد</p>
            <Button onClick={() => navigate('/enroll/admin')} className="mt-4">
              بازگشت
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/enroll/admin')}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-3xl font-bold">ویرایش دوره</h1>
            <p className="text-muted-foreground">ویرایش دوره: {course.title}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>اطلاعات دوره</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">عنوان دوره *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: دوره بدون مرز"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">نامک (Slug) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="مثال: boundless"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات دوره..."
                  rows={3}
                />
              </div>

              {/* Pricing Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  تنظیمات قیمت‌گذاری
                </h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_dollar_price"
                    checked={formData.use_dollar_price}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, use_dollar_price: checked }));
                      if (!checked) {
                        setExchangeRate(null);
                        setCalculatedRialPrice(null);
                      }
                    }}
                  />
                  <Label htmlFor="use_dollar_price">استفاده از قیمت دلاری</Label>
                </div>

                {formData.use_dollar_price ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="usd_price">قیمت (دلار آمریکا) *</Label>
                      <Input
                        id="usd_price"
                        type="number"
                        step="0.01"
                        value={formData.usd_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, usd_price: e.target.value }))}
                        placeholder="49.99"
                        required={formData.use_dollar_price}
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
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="2500000"
                      required
                    />
                  </div>
                )}

                {/* Sale Section */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    تنظیمات حراج
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_sale_enabled"
                      checked={formData.is_sale_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sale_enabled: checked }))}
                    />
                    <Label htmlFor="is_sale_enabled">فعال‌سازی حراج</Label>
                  </div>

                  {formData.is_sale_enabled && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sale_price">
                          قیمت حراج ({formData.use_dollar_price ? 'دلار آمریکا' : 'تومان'}) *
                        </Label>
                        <Input
                          id="sale_price"
                          type="number"
                          step={formData.use_dollar_price ? "0.01" : "1"}
                          value={formData.sale_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                          placeholder={formData.use_dollar_price ? "29.99" : "1500000"}
                          required={formData.is_sale_enabled}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="sale_expires_at">تاریخ پایان حراج *</Label>
                        <Input
                          id="sale_expires_at"
                          type="datetime-local"
                          value={formData.sale_expires_at}
                          onChange={(e) => setFormData(prev => ({ ...prev, sale_expires_at: e.target.value }))}
                          required={formData.is_sale_enabled}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Academy Access Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  سیستم دسترسی دوره آکادمی
                </h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_course_access"
                    checked={formData.enable_course_access}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_course_access: checked }))}
                  />
                  <Label htmlFor="enable_course_access">فعال‌سازی سیستم دسترسی دوره</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="support_link">لینک پشتیبانی</Label>
                    <Input
                      id="support_link"
                      type="url"
                      value={formData.support_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, support_link: e.target.value }))}
                      placeholder="https://t.me/support"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telegram_channel_link">لینک کانال تلگرام</Label>
                    <Input
                      id="telegram_channel_link"
                      type="url"
                      value={formData.telegram_channel_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, telegram_channel_link: e.target.value }))}
                      placeholder="https://t.me/channel"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gifts_link">لینک هدایا</Label>
                  <Input
                    id="gifts_link"
                    type="url"
                    value={formData.gifts_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, gifts_link: e.target.value }))}
                    placeholder="https://example.com/gifts"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="woocommerce_product_id">ID محصول WooCommerce</Label>
                  <Input
                    id="woocommerce_product_id"
                    type="number"
                    value={formData.woocommerce_product_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, woocommerce_product_id: e.target.value }))}
                    placeholder="123"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="redirect_url">URL هدایت پس از خرید</Label>
                <Input
                  id="redirect_url"
                  type="url"
                  value={formData.redirect_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirect_url: e.target.value }))}
                  placeholder="https://academy.rafiei.co/course/boundless"
                />
              </div>

              {/* SpotPlayer Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">تنظیمات رفیعی پلیر (SpotPlayer)</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_spotplayer_enabled"
                    checked={formData.is_spotplayer_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_spotplayer_enabled: checked }))}
                  />
                  <Label htmlFor="is_spotplayer_enabled">فعال‌سازی رفیعی پلیر</Label>
                </div>

                {formData.is_spotplayer_enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="spotplayer_course_id">شناسه دوره در SpotPlayer *</Label>
                      <Input
                        id="spotplayer_course_id"
                        value={formData.spotplayer_course_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, spotplayer_course_id: e.target.value }))}
                        placeholder="مثال: course_123"
                        required={formData.is_spotplayer_enabled}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        شناسه دوره در پنل SpotPlayer که برای ایجاد لایسنس استفاده می‌شود
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="create_test_license"
                        checked={formData.create_test_license}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, create_test_license: checked }))}
                      />
                      <Label htmlFor="create_test_license">ایجاد لایسنس تستی</Label>
                      <p className="text-sm text-muted-foreground">
                        لایسنس‌های تستی محدودیت زمانی دارند
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* WooCommerce Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">تنظیمات WooCommerce</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="woocommerce_create_access"
                    checked={formData.woocommerce_create_access}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, woocommerce_create_access: checked }))}
                  />
                  <Label htmlFor="woocommerce_create_access">ایجاد دسترسی در WooCommerce</Label>
                  <p className="text-sm text-muted-foreground">
                    در صورت غیرفعال بودن، دکمه دسترسی به دوره حذف می‌شود
                  </p>
                </div>
              </div>

              {/* Landing Page Merge Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">تنظیمات صفحه فرود</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_landing_page_merge"
                    checked={formData.use_landing_page_merge}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_landing_page_merge: checked }))}
                  />
                  <Label htmlFor="use_landing_page_merge">ادغام دکمه شروع دوره</Label>
                  <p className="text-sm text-muted-foreground">
                    جایگزین کردن لینک خارجی با صفحه ثبت‌نام داخلی (/enroll?course=slug)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">دوره فعال است</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/enroll/admin')}
                >
                  لغو
                </Button>
                <Button type="submit">
                  به‌روزرسانی دوره
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CourseEdit;