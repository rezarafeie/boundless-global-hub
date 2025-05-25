
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, CreditCard, User, Mail, Phone, ArrowRight, Shield, Clock, Star, Award } from 'lucide-react';
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
      price: 2500000,
      instructor: 'رضا رفیعی',
      originalPrice: 3500000,
      discount: 29,
      benefits: ['دسترسی مادام‌العمر', 'جلسات کوچینگ زنده', 'گروه اختصاصی تلگرام', 'پشتیبانی 24/7'],
      features: ['10+ ساعت ویدیو', '50+ فایل تمرینی', 'گواهی پایان دوره', 'پروژه عملی']
    },
    'instagram': {
      title: 'اینستاگرام اسنشیالز',
      price: 1800000,
      instructor: 'رضا رفیعی',
      originalPrice: 2500000,
      discount: 28,
      benefits: ['قالب‌های آماده کنتنت', 'استراتژی تبلیغات', 'تحلیل رقبا', 'ابزارهای اندازه‌گیری'],
      features: ['8+ ساعت ویدیو', '30+ تمپلیت', 'کتابچه راهنما', 'پشتیبانی یک ماهه']
    },
    'metaverse': {
      title: 'امپراطوری متاورس',
      price: 2800000,
      instructor: 'رضا رفیعی',
      originalPrice: 3800000,
      discount: 26,
      benefits: ['راهنمای NFT', 'استراتژی‌های Web3', 'پروژه‌های عملی', 'شبکه‌سازی متاورس'],
      features: ['12+ ساعت ویدیو', 'پروژه NFT', 'ابزارهای Web3', 'کمیونیتی اختصاصی']
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
            تکمیل خرید
          </h1>
          <p className="text-xl text-slate-600">تنها یک قدم تا شروع سفر یادگیری</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Course Summary - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl shadow-slate-200/50">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">{course.title}</CardTitle>
                    <p className="text-slate-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      مدرس: {course.instructor}
                    </p>
                  </div>
                </div>
                
                {/* Price Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500 line-through">
                      قیمت اصلی: {formatPrice(course.originalPrice)} میلیون تومان
                    </span>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {course.discount}% تخفیف
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900">قیمت نهایی:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatPrice(course.price)} میلیون تومان
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Course Features */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                    <Star className="w-5 h-5 text-yellow-500" />
                    ویژگی‌های دوره
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm bg-slate-50 p-3 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Benefits */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    مزایای دوره
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
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>پرداخت امن با زرین‌پال</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl shadow-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  اطلاعات پرداخت
                </CardTitle>
                <p className="text-slate-600">اطلاعات خود را با دقت وارد کنید</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4" />
                      نام
                    </Label>
                    <Input
                      id="firstName"
                      value={userInfo.firstName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="نام خود را وارد کنید"
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white/80"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4" />
                      نام خانوادگی
                    </Label>
                    <Input
                      id="lastName"
                      value={userInfo.lastName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="نام خانوادگی خود را وارد کنید"
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white/80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4" />
                    ایمیل
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white/80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4" />
                    شماره موبایل
                  </Label>
                  <Input
                    id="phone"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="09123456789"
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white/80"
                  />
                </div>

                {/* Payment Method */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                  <h4 className="font-semibold mb-3 text-slate-900">روش پرداخت</h4>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-200">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">Z</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">زرین‌پال</p>
                      <p className="text-sm text-slate-600">تمام کارت‌های بانکی ایران</p>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={isSubmitting || !userInfo.firstName || !userInfo.lastName || !userInfo.email || !userInfo.phone}
                  className="w-full py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300"
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
                    پرداخت امن
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-blue-500" />
                    دسترسی فوری
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
  );
};

export default Checkout;
