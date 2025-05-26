
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Users, 
  Calendar, 
  Trophy,
  Target,
  Lightbulb,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Gift,
  Heart,
  Brain,
  DollarSign
} from "lucide-react";
import IframeModal from "@/components/IframeModal";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BoundlessLanding = () => {
  const [showIframeModal, setShowIframeModal] = useState(false);

  const handleEnrollClick = () => {
    setShowIframeModal(true);
  };

  // Calculate countdown end date (30 days from now)
  const countdownEndDate = new Date();
  countdownEndDate.setDate(countdownEndDate.getDate() + 30);

  const features = [
    { icon: Crown, title: "کوچینگ کسب‌وکار", description: "راهنمایی مستقیم برای راه‌اندازی و توسعه کسب‌وکار" },
    { icon: Brain, title: "کوچینگ روانشناختی", description: "تقویت مهارت‌های ذهنی و مدیریت احساسات" },
    { icon: Users, title: "جامعه اختصاصی", description: "عضویت در گروه ویژه با دسترسی به شبکه حرفه‌ای‌ها" },
    { icon: Calendar, title: "۱۸۰ تکلیف روزانه", description: "برنامه عملی و گام‌به‌گام برای پیشرفت مداوم" },
    { icon: Trophy, title: "جلسات زنده", description: "شرکت در وبینارهای تعاملی و سؤال و جواب" },
    { icon: Target, title: "دسترسی مادام‌العمر", description: "دسترسی بدون محدودیت زمانی به تمام محتوا" }
  ];

  const benefits = [
    "ایجاد درآمد ۵ رقمی دلاری در ۶ ماه",
    "راه‌اندازی کسب‌وکار بین‌المللی",
    "ساخت برند شخصی قدرتمند",
    "دسترسی به بازارهای جهانی",
    "شبکه‌سازی با موفق‌ترین افراد",
    "تغییر کامل نگرش و ذهنیت"
  ];

  const bonuses = [
    { title: "هوش مصنوعی اختصاصی", value: "$500", description: "دستیار AI شخصی برای مشاوره کسب‌وکار" },
    { title: "پکیج طراحی برند", value: "$300", description: "لوگو، کارت ویزیت و هویت بصری کامل" },
    { title: "دوره مکمل اینستاگرام", value: "$200", description: "استراتژی‌های پیشرفته بازاریابی شبکه‌های اجتماعی" },
    { title: "کتاب الکترونیکی ۱۰۰ صفحه‌ای", value: "$100", description: "راهنمای کامل ساخت امپراتوری کسب‌وکار" }
  ];

  const testimonials = [
    {
      name: "علی محمدی",
      role: "کارآفرین دیجیتال",
      content: "در ۴ ماه توانستم درآمدم را ۱۰ برابر کنم. برنامه شروع بدون مرز واقعاً زندگی‌ام را تغییر داد.",
      rating: 5
    },
    {
      name: "سارا احمدی",
      role: "صاحب استارتاپ",
      content: "کوچینگ‌های روانشناختی به من کمک کرد تا اعتماد به نفسم را بازیابم و کسب‌وکار موفقی راه‌اندازی کنم.",
      rating: 5
    },
    {
      name: "محمد کریمی",
      role: "مدیر فروش",
      content: "جامعه اختصاصی این برنامه فوق‌العاده است. شبکه‌ای از افراد موفق که همیشه آماده کمک هستند.",
      rating: 5
    }
  ];

  const modules = [
    { week: "هفته ۱-۲", title: "پایه‌گذاری ذهنیت", description: "شناخت خود، تعیین اهداف و ساخت ذهنیت پیروزی" },
    { week: "هفته ۳-۶", title: "راه‌اندازی کسب‌وکار", description: "انتخاب نیچ، ساخت محصول و تعیین استراتژی" },
    { week: "هفته ۷-۱۲", title: "بازاریابی و فروش", description: "ساخت قیف فروش، تبلیغات و جذب مشتری" },
    { week: "هفته ۱۳-۱۸", title: "مقیاس‌پذیری", description: "اتوماسیون، استخدام تیم و گسترش کسب‌وکار" },
    { week: "هفته ۱۹-۲۴", title: "حرفه‌ای‌سازی", description: "بهینه‌سازی سیستم‌ها و ایجاد درآمد غیرفعال" }
  ];

  const faqs = [
    {
      question: "آیا این برنامه برای مبتدیان مناسب است؟",
      answer: "بله، برنامه شروع بدون مرز از صفر طراحی شده و هیچ پیش‌زمینه‌ای نیاز ندارد. تمام مفاهیم گام‌به‌گام آموزش داده می‌شود."
    },
    {
      question: "چقدر زمان باید روزانه صرف کنم؟",
      answer: "حداقل ۲ ساعت در روز توصیه می‌شود. اما برنامه طوری طراحی شده که با ۳۰ دقیقه در روز هم قابل اجرا باشد."
    },
    {
      question: "آیا گارانتی بازگشت وجه دارد؟",
      answer: "بله، ۳۰ روز گارانتی کامل بازگشت وجه داریم. اگر راضی نباشید، تمام پولتان برگردانده می‌شود."
    },
    {
      question: "چه میزان درآمد می‌توانم انتظار داشته باشم؟",
      answer: "با پیروی از برنامه، اکثر دانشجویان در ۶ ماه درآمد ۵ رقمی دلاری کسب می‌کنند. البته نتایج بستگی به میزان تلاش شما دارد."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Crown className="w-4 h-4 mr-1" />
                برنامه پریمیوم
              </Badge>
              
              <motion.h1 
                className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                شروع
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> بدون مرز</span>
              </motion.h1>
              
              <motion.p 
                className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                تنها برنامه جامع کسب‌وکار که در ۶ ماه زندگی‌تان را کاملاً متحول می‌کند
              </motion.p>

              {/* Pricing Section */}
              <motion.div 
                className="flex justify-center items-center gap-4 mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl text-gray-400 line-through">$50</span>
                    <span className="text-4xl font-bold text-green-600">$7</span>
                    <Badge variant="destructive" className="text-xs">
                      ۸۶% تخفیف
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    معادل ۵۰۰,۰۰۰ تومان
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button 
                  onClick={handleEnrollClick}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-full px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  <DollarSign className="mr-2" size={24} />
                  همین حالا شروع کن - فقط $7
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Countdown Timer */}
        <section className="py-8">
          <div className="container max-w-4xl mx-auto">
            <CountdownTimer 
              endDate={countdownEndDate.toISOString()}
              className="mx-auto"
            />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">چرا شروع بدون مرز؟</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <feature.icon size={32} className="text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">نتایجی که کسب خواهید کرد</h2>
              <p className="text-xl text-gray-600">تغییراتی که زندگی‌تان را متحول می‌کند</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-4 space-x-reverse bg-white p-6 rounded-lg shadow-md"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                  <span className="text-lg font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bonuses Section */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <Gift className="mr-3 text-purple-600" />
                هدایای ویژه
              </h2>
              <p className="text-xl text-gray-600">بیش از $1100 هدیه رایگان</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bonuses.map((bonus, index) => (
                <Card key={index} className="border-2 border-purple-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">{bonus.title}</h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {bonus.value}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{bonus.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">نظرات دانشجویان</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={20} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Course Modules */}
        <section className="py-16">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">برنامه ۶ ماهه شما</h2>
            <div className="space-y-6">
              {modules.map((module, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge variant="outline" className="text-xs mr-3">
                            {module.week}
                          </Badge>
                          <h3 className="text-xl font-bold">{module.title}</h3>
                        </div>
                        <p className="text-gray-600">{module.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">سوالات متداول</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-right text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">
              آخرین فرصت برای تغییر زندگی‌تان
            </h2>
            <p className="text-xl mb-8 opacity-90">
              فقط با $7 به جمع موفق‌ترین کارآفرینان بپیوندید
            </p>
            
            <div className="flex justify-center items-center gap-4 mb-8">
              <span className="text-2xl line-through opacity-70">$50</span>
              <span className="text-5xl font-bold">$7</span>
              <Badge className="bg-red-500 text-white">
                محدود!
              </Badge>
            </div>
            
            <Button 
              onClick={handleEnrollClick}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 rounded-full px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <Heart className="mr-2" size={24} />
              همین الان شروع کن
            </Button>
            
            <p className="text-sm mt-4 opacity-80">
              ✅ ۳۰ روز گارانتی بازگشت وجه • ✅ دسترسی فوری • ✅ پشتیبانی ۲۴/۷
            </p>
          </div>
        </section>
      </div>

      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title="ثبت‌نام در شروع بدون مرز"
        url="https://auth.rafiei.co/?add-to-cart=5311"
      />
    </MainLayout>
  );
};

export default BoundlessLanding;
