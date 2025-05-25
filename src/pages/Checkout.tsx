
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useZarinpalPayment } from '@/hooks/useZarinpalPayment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, CreditCard, User, Mail, Phone, ArrowRight } from 'lucide-react';

const Checkout = () => {
  const { courseSlug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { initiatePayment, loading: paymentLoading, getCoursePrice } = useZarinpalPayment();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  // Course data for display
  const courseData = {
    'boundless': {
      title: 'برنامه بی‌حد رفیعی',
      price: 2500000,
      instructor: 'رضا رفیعی',
      benefits: ['دسترسی مادام‌العمر', 'جلسات کوچینگ زنده', 'گروه اختصاصی تلگرام', 'پشتیبانی 24/7']
    },
    'instagram': {
      title: 'اینستاگرام اسنشیالز',
      price: 1800000,
      instructor: 'رضا رفیعی',
      benefits: ['قالب‌های آماده کنتنت', 'استراتژی تبلیغات', 'تحلیل رقبا', 'ابزارهای اندازه‌گیری']
    },
    'wealth': {
      title: 'دوره ثروت‌سازی',
      price: 3200000,
      instructor: 'رضا رفیعی',
      benefits: ['کارگاه‌های عملی', 'مشاوره سرمایه‌گذاری', 'ابزار مدیریت مالی', 'گزارش‌های هفتگی']
    },
    'metaverse': {
      title: 'امپراطوری متاورس',
      price: 2800000,
      instructor: 'رضا رفیعی',
      benefits: ['راهنمای NFT', 'استراتژی‌های Web3', 'پروژه‌های عملی', 'شبکه‌سازی متاورس']
    }
  };

  const course = courseData[courseSlug as keyof typeof courseData];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      setUserInfo({
        fullName: user.user_metadata?.full_name || user.email || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!course && courseSlug) {
      toast({
        title: "خطا",
        description: "دوره مورد نظر یافت نشد",
        variant: "destructive",
      });
      navigate('/courses');
    }
  }, [course, courseSlug, navigate, toast]);

  const handlePayment = async () => {
    if (!courseSlug || !course) {
      toast({
        title: "خطا",
        description: "اطلاعات دوره ناقص است",
        variant: "destructive",
      });
      return;
    }

    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      toast({
        title: "خطا",
        description: "لطفا تمام اطلاعات را تکمیل کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await initiatePayment(courseSlug);
      
      if (!result.success) {
        toast({
          title: "خطا در پرداخت",
          description: "پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "خطا در پرداخت",
        description: "پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return (price / 1000000).toFixed(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!user || !course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            بازگشت
          </Button>
          <h1 className="text-3xl font-bold">تکمیل خرید</h1>
          <p className="text-gray-600 mt-2">تنها یک قدم تا دسترسی به دوره مانده</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                خلاصه دوره
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{course.title}</h3>
                <p className="text-gray-600">مدرس: {course.instructor}</p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">مزایای دوره:</h4>
                <ul className="space-y-2">
                  {course.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">قیمت نهایی:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(course.price)} میلیون تومان
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                اطلاعات پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    نام و نام خانوادگی
                  </Label>
                  <Input
                    id="fullName"
                    value={userInfo.fullName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="نام کامل خود را وارد کنید"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    ایمیل
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    شماره موبایل
                  </Label>
                  <Input
                    id="phone"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="09123456789"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">روش پرداخت:</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Z</span>
                    </div>
                    <span>زرین‌پال (کارت‌های بانکی ایران)</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePayment}
                  disabled={paymentLoading || !userInfo.fullName || !userInfo.email || !userInfo.phone}
                  className="w-full py-3 text-lg"
                  size="lg"
                >
                  {paymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      در حال پردازش...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      پرداخت {formatPrice(course.price)} میلیون تومان
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  با کلیک بر روی دکمه پرداخت، شرایط استفاده و حریم خصوصی را می‌پذیرید
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
