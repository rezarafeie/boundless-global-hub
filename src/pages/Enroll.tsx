import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, User, Mail, Phone, BookOpen, Star, Shield, Clock, Zap } from 'lucide-react';
import { getCountryCodeOptions } from '@/lib/countryCodeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import ManualPaymentSection from '@/components/ManualPaymentSection';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  redirect_url: string;
  is_spotplayer_enabled: boolean;
  spotplayer_course_id: string | null;
}

const Enroll: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const courseSlug = searchParams.get('course');

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'zarinpal' | 'manual'>('zarinpal');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+98'
  });

  useEffect(() => {
    if (courseSlug) {
      fetchCourse();
    } else {
      setLoading(false);
    }
  }, [courseSlug]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', courseSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "خطا",
        description: "دوره مورد نظر یافت نشد",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        title: "خطا",
        description: "لطفا نام خود را وارد کنید",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.lastName.trim()) {
      toast({
        title: "خطا",
        description: "لطفا نام خانوادگی خود را وارد کنید",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "خطا", 
        description: "لطفا ایمیل معتبر وارد کنید",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast({
        title: "خطا",
        description: "لطفا شماره تلفن خود را وارد کنید", 
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !course) return;
    
    // Manual payment is handled in ManualPaymentSection component
    if (paymentMethod === 'manual') return;

    setSubmitting(true);
    
    try {
      const response = await supabase.functions.invoke('zarinpal-request', {
        body: {
          courseSlug: course.slug,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          countryCode: formData.countryCode
        }
      });

      if (response.error) throw response.error;

      const { data } = response;
      
      if (data.success) {
        // Redirect to Zarinpal payment
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت');
      }
    } catch (error) {
      console.error('Payment request error:', error);
      toast({
        title: "خطا در پرداخت",
        description: "خطا در ایجاد درخواست پرداخت. لطفا مجددا تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">دوره یافت نشد</h2>
              <p className="text-muted-foreground">
                دوره مورد نظر شما یافت نشد یا غیرفعال است.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Course Info */}
            <Card className="order-2 lg:order-1 bg-card/60 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                   <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    دوره آنلاین
                  </Badge>
                  {course.is_spotplayer_enabled && (
                    <Badge variant="default" className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg">
                      <Zap className="h-3 w-3 ml-1" />
                      Rafiei Player Support
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {course.title}
                </CardTitle>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {course.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl blur-xl"></div>
                  <div className="relative p-6 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-xl border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">قیمت دوره:</span>
                      <div className="text-left">
                        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                          {formatPrice(course.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Rafiei Player Special Feature */}
                {course.is_spotplayer_enabled && (
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                        Rafiei Player Support
                      </h3>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm leading-relaxed">
                      این دوره در پلتفرم Rafiei Player قابل دسترسی است. شما می‌توانید ویدیوها را دانلود کرده و بدون نیاز به اینترنت تماشا کنید. دسترسی شما هرگز منقضی نمی‌شود.
                    </p>
                  </div>
                )}
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">دسترسی مادام‌العمر</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">پرداخت امن</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">۲۴/۷ پشتیبانی</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">شروع فوری</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Form */}
            <Card className="order-1 lg:order-2 bg-card/60 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  ثبت‌نام در دوره
                </CardTitle>
                <p className="text-muted-foreground">
                  اطلاعات خود را وارد کنید و روش پرداخت را انتخاب کنید
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">نام</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="علی"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">نام خانوادگی</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="احمدی"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">ایمیل</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="example@email.com"
                        className="h-12 text-base"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">شماره تلفن</Label>
                      <div className="flex border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background" dir="ltr">
                        <Select 
                          value={formData.countryCode} 
                          onValueChange={(value) => handleInputChange('countryCode', value)}
                        >
                          <SelectTrigger className="w-24 border-0 border-l border-input rounded-none bg-transparent focus:ring-0 px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getCountryCodeOptions().map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            // Remove any non-digit characters and prevent starting with 0 or +
                            let cleanValue = e.target.value.replace(/[^0-9]/g, '');
                            cleanValue = cleanValue.replace(/^[0+]+/, '');
                            handleInputChange('phone', cleanValue);
                          }}
                          placeholder="912345678"
                          className="flex-1 h-12 text-base border-0 rounded-none focus-visible:ring-0"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <ManualPaymentSection
                    course={course}
                    formData={formData}
                    onPaymentMethodChange={setPaymentMethod}
                    selectedMethod={paymentMethod}
                  />

                  {/* Submit Button - Only for Zarinpal */}
                  {paymentMethod === 'zarinpal' && (
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin ml-2" />
                          در حال پردازش...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-6 w-6 ml-2" />
                          پرداخت آنلاین {formatPrice(course.price)}
                        </>
                      )}
                    </Button>
                  )}
                </form>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium text-primary">پرداخت امن</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    تمامی پرداخت‌ها از طریق درگاه‌های امن و معتبر انجام می‌شود. اطلاعات شما محفوظ است.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Enroll;