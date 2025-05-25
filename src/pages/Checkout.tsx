
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, CreditCard, User, Mail, Phone, ArrowRight, Shield, Clock, Star, Award, Gift, Play } from 'lucide-react';
import { createWooCommerceOrder } from '@/services/wordpressApi';
import { motion } from 'framer-motion';

const Checkout = () => {
  const { courseSlug } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course data for display
  const courseData = {
    'boundless': {
      title: 'برنامه بی‌حد رفیعی',
      subtitle: 'مسیر جامع تحول شخصی و کسب‌وکاری',
      price: 2500000,
      instructor: 'رضا رفیعی',
      originalPrice: 3500000,
      discount: 29,
      duration: '6 ماه',
      modules: 12,
      students: 450,
      benefits: [
        'دسترسی مادام‌العمر به تمام محتوا',
        'جلسات کوچینگ زنده با رضا رفیعی', 
        'گروه اختصاصی تلگرام',
        'پشتیبانی 24/7',
        '180 تکلیف عملی روزانه',
        'کتاب‌های صوتی اختصاصی'
      ],
      features: [
        '100+ ساعت ویدیو آموزشی',
        '50+ فایل تمرینی و کاربرگ',
        'گواهی پایان دوره معتبر',
        'پروژه عملی شخصی‌سازی شده'
      ]
    },
    'instagram': {
      title: 'اسباب اینستاگرام',
      subtitle: 'راز موفقیت در اینستاگرام',
      price: 1800000,
      instructor: 'رضا رفیعی',
      originalPrice: 2500000,
      discount: 28,
      duration: '4 هفته',
      modules: 6,
      students: 850,
      benefits: [
        'قالب‌های آماده کنتنت',
        'استراتژی تبلیغات حرفه‌ای',
        'تحلیل دقیق رقبا',
        'ابزارهای اندازه‌گیری پیشرفته',
        'راهنمای کامل الگوریتم',
        'تکنیک‌های فروش در استوری'
      ],
      features: [
        '8+ ساعت ویدیو عملی',
        '30+ تمپلیت طراحی',
        'کتابچه راهنمای کامل',
        'پشتیبانی یک ماهه اختصاصی'
      ]
    },
    'metaverse': {
      title: 'امپراطوری متاورس',
      subtitle: 'آینده کسب‌وکار دیجیتال',
      price: 2800000,
      instructor: 'رضا رفیعی',
      originalPrice: 3800000,
      discount: 26,
      duration: '10 هفته',
      modules: 10,
      students: 380,
      benefits: [
        'راهنمای کامل NFT و Web3',
        'استراتژی‌های سرمایه‌گذاری',
        'پروژه‌های عملی متاورس',
        'شبکه‌سازی در فضای مجازی',
        'ابزارهای تحلیل بازار',
        'راهنمای امنیت دیجیتال'
      ],
      features: [
        '12+ ساعت محتوای جامع',
        'پروژه NFT اختصاصی',
        'ابزارهای Web3 حرفه‌ای',
        'کمیونیتی اختصاصی متاورس'
      ]
    }
  };

  const course = courseData[courseSlug as keyof typeof courseData];

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

    if (!userInfo.firstName || !userInfo.lastName || !userInfo.email || !userInfo.phone) {
      toast({
        title: "خطا",
        description: "لطفا تمام اطلاعات را تکمیل کنید",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createWooCommerceOrder(courseSlug, userInfo);
      
      toast({
        title: "سفارش ایجاد شد",
        description: "در حال هدایت به صفحه پرداخت...",
      });

      const paymentUrl = order.payment_url || `/payment-success/${courseSlug}`;
      window.location.href = paymentUrl;
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "خطا در پرداخت",
        description: "پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return (price / 1000000).toFixed(1);
  };

  if (!course) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        
        <div className="container max-w-7xl mx-auto py-12 px-4">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-6 hover:bg-white/50"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              بازگشت
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
              خرید دوره
            </h1>
            <p className="text-xl text-slate-600">تنها یک قدم تا شروع سفر یادگیری</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Course Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{course.title}</h2>
                      <p className="text-blue-100">{course.subtitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-blue-100">
                    <User className="w-4 h-4" />
                    <span>مدرس: {course.instructor}</span>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-6">
                  {/* Price Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500 line-through">
                        قیمت اصلی: {formatPrice(course.originalPrice)} میلیون تومان
                      </span>
                      <Badge className="bg-red-500">
                        {course.discount}% تخفیف
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">قیمت نهایی:</span>
                      <span className="text-3xl font-bold text-green-600">
                        {formatPrice(course.price)} میلیون تومان
                      </span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
                    <div className="text-center">
                      <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">{course.duration}</p>
                      <p className="text-xs text-slate-500">مدت دوره</p>
                    </div>
                    <div className="text-center">
                      <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">{course.modules} ماژول</p>
                      <p className="text-xs text-slate-500">تعداد بخش</p>
                    </div>
                    <div className="text-center">
                      <User className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">{course.students}+</p>
                      <p className="text-xs text-slate-500">دانشجو</p>
                    </div>
                  </div>
                  
                  {/* Course Features */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                      <Play className="w-5 h-5 text-blue-500" />
                      ویژگی‌های دوره
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {course.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm bg-slate-50 p-3 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                      <Gift className="w-5 h-5 text-green-600" />
                      مزایای ویژه
                    </h4>
                    <ul className="space-y-3">
                      {course.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-slate-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Security Badge */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>پرداخت امن با زرین‌پال - اطلاعات شما محفوظ است</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-slate-200/50">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    اطلاعات پرداخت
                  </CardTitle>
                  <p className="text-slate-600">اطلاعات خود را با دقت وارد کنید</p>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex items-center gap-2 text-slate-700 font-medium">
                        <User className="w-4 h-4" />
                        نام
                      </Label>
                      <Input
                        id="firstName"
                        value={userInfo.firstName}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="نام خود را وارد کنید"
                        className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex items-center gap-2 text-slate-700 font-medium">
                        <User className="w-4 h-4" />
                        نام خانوادگی
                      </Label>
                      <Input
                        id="lastName"
                        value={userInfo.lastName}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="نام خانوادگی خود را وارد کنید"
                        className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-slate-700 font-medium">
                      <Mail className="w-4 h-4" />
                      ایمیل
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-slate-700 font-medium">
                      <Phone className="w-4 h-4" />
                      شماره موبایل
                    </Label>
                    <Input
                      id="phone"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="09123456789"
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white h-12"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                    <h4 className="font-semibold mb-3 text-slate-900">روش پرداخت</h4>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-green-200 shadow-sm">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg font-bold">Z</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">زرین‌پال</p>
                        <p className="text-sm text-slate-600">پرداخت امن با تمام کارت‌های بانکی</p>
                      </div>
                      <div className="mr-auto">
                        <Shield className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button 
                    onClick={handlePayment}
                    disabled={isSubmitting || !userInfo.firstName || !userInfo.lastName || !userInfo.email || !userInfo.phone}
                    className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300 font-bold"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        در حال پردازش...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        پرداخت {formatPrice(course.price)} میلیون تومان
                      </>
                    )}
                  </Button>

                  {/* Trust Indicators */}
                  <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>پرداخت امن</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>دسترسی فوری</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span>گارانتی بازگشت</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    با کلیک بر روی دکمه پرداخت، شرایط استفاده و حریم خصوصی را می‌پذیرید
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Checkout;
