
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Users, 
  Calendar, 
  Trophy,
  Target,
  CheckCircle,
  Gift,
  Heart,
  Brain,
  Globe,
  TrendingUp,
  Star,
  Zap,
  BookOpen,
  MessageCircle,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BoundlessTastePage = () => {
  const { translations } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({
    days: 11,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // شمارش معکوس ۱۱ روزه
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const targetDate = now + (11 * 24 * 60 * 60 * 1000); // ۱۱ روز از الان
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const courseContent = [
    "نگرش بدون مرز",
    "دراپ‌شیپینگ",
    "دراپ‌سرویسینگ",
    "فروش فایل و آکادمی آنلاین",
    "بازارهای مالی و زیرساخت‌های بین‌المللی",
    "جلسه پرسش و پاسخ + مشاوره خصوصی",
    "تست شخصیت کارآفرین برای تعیین مسیر مناسب"
  ];

  const courseGifts = [
    "🎯 ورکشاپ درآمد فوری دلاری",
    "📌 اصل تک اولویت (برای تمرکز در مسیر هدف)",
    "🇺🇸 وبینار بیزینس آمریکایی (۲ جلسه با هدایای ویژه)",
    "💸 پروژه درآمد غیرفعال (۲ جلسه + هدایای کامل)",
    "🔄 پروژه تغییر (۳ جلسه + هدیه)",
    "🤖 پرامپت‌های هوش مصنوعی مخصوص کسب‌وکار",
    "و ده‌ها ابزار و فایل کاربردی برای شروع بیزینس آنلاین"
  ];

  const courseFeatures = [
    "تدریس توسط رضا رفیعی با زبان ساده و تجربه عملی",
    "همراه با تست شخصیت و تمرین‌های واقعی",
    "پشتیبانی اختصاصی + گروه ارتباطی دانشجویان",
    "بدون نیاز به سرمایه اولیه یا تخصص فنی",
    "دسترسی دائمی به محتوای دوره"
  ];

  const testimonials = [
    {
      name: "علی محمدی",
      role: "کارآفرین دیجیتال",
      content: "دوره شروع بدون مرز واقعاً نقطه عطف زندگی من بود. الان درآمد ماهانه ۵ هزار دلاری دارم.",
      rating: 5
    },
    {
      name: "سارا احمدی",
      role: "صاحب کسب‌وکار آنلاین",
      content: "آموزش‌های استاد رفیعی کاملاً عملی و قابل اجرا هستند. خیلی راضی‌ام که در این دوره شرکت کردم.",
      rating: 5
    },
    {
      name: "محمد کریمی",
      role: "مدیر فروش آنلاین",
      content: "بعد از گذراندن این دوره، کسب‌وکار من در بازارهای بین‌المللی فعال شد و درآمد چندین برابر شد.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "آیا این دوره برای مبتدیان مناسب است؟",
      answer: "بله، دوره «شروع بدون مرز» کاملاً برای مبتدیان طراحی شده و هیچ پیش‌زمینه‌ای نیاز ندارد."
    },
    {
      question: "چقدر زمان باید روزانه صرف کنم؟",
      answer: "حداقل ۲ ساعت در روز توصیه می‌شود، اما می‌توانید بر اساس برنامه خودتان پیش بروید."
    },
    {
      question: "آیا پشتیبانی دارد؟",
      answer: "بله، پشتیبانی اختصاصی و گروه ارتباطی دانشجویان در اختیار شما قرار می‌گیرد."
    },
    {
      question: "چه میزان درآمد می‌توانم انتظار داشته باشم؟",
      answer: "درآمد بستگی به میزان تلاش شما دارد، اما بسیاری از دانشجویان در ماه‌های اول درآمد قابل توجهی کسب کرده‌اند."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Trophy className="w-4 h-4 mr-1" />
                دوره پریمیوم
              </Badge>
              
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {translations.boundlessStartTitle}
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {translations.boundlessStartDesc}
              </motion.p>

              {/* دکمه غیرفعال */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Button 
                  disabled
                  size="lg"
                  className="bg-gray-400 text-white cursor-not-allowed rounded-full px-12 py-6 text-xl font-bold opacity-75"
                >
                  <Clock className="mr-2" size={24} />
                  {translations.courseSoldOut}
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* شمارش معکوس */}
        <section className="py-12 bg-gradient-to-r from-red-500 to-red-600">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">⏳ {translations.nextRegistrationDate}</h2>
              <p className="text-xl mb-8 opacity-90">11 روز دیگر باقی‌مانده...</p>
              
              <div className="flex justify-center gap-4 sm:gap-8">
                {[
                  { value: timeLeft.days, label: "روز" },
                  { value: timeLeft.hours, label: "ساعت" },
                  { value: timeLeft.minutes, label: "دقیقه" },
                  { value: timeLeft.seconds, label: "ثانیه" }
                ].map(({ value, label }, index) => (
                  <div 
                    key={index}
                    className="bg-white/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 min-w-[80px] sm:min-w-[100px] shadow-lg"
                  >
                    <div className="text-3xl sm:text-5xl font-bold text-white">
                      {value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm sm:text-base font-semibold opacity-90 mt-2">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* محتوای دوره */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <BookOpen className="mr-3 text-purple-600" />
                محتوای دوره
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseContent.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-4 space-x-reverse bg-white p-6 rounded-lg shadow-md border-r-4 border-r-purple-500"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-purple-600" />
                  </div>
                  <span className="text-lg font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* هدایای دوره */}
        <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <Gift className="mr-3 text-purple-600" />
                {translations.courseGifts}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseGifts.map((gift, index) => (
                <Card key={index} className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <p className="text-lg font-medium text-gray-700">{gift}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ویژگی‌های کلیدی */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <Zap className="mr-3 text-purple-600" />
                {translations.courseFeatures}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courseFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star size={32} className="text-purple-600" />
                      </div>
                      <p className="text-gray-700 leading-relaxed">{feature}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* معرفی مدرس */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">معرفی مدرس</h2>
            </div>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Users size={64} className="text-white" />
                  </div>
                  <div className="flex-1 text-center md:text-right">
                    <h3 className="text-3xl font-bold mb-4">رضا رفیعی</h3>
                    <p className="text-xl text-gray-600 mb-4">مدرس و مشاور کسب‌وکار بین‌المللی</p>
                    <p className="text-gray-700 leading-relaxed">
                      بیش از ۱۰ سال تجربه در زمینه کسب‌وکار بین‌المللی و کمک به هزاران نفر برای کسب درآمد ارزی. 
                      متخصص در زمینه‌های دراپ‌شیپینگ، بازاریابی دیجیتال و ساخت کسب‌وکارهای آنلاین.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* نظرات دانشجویان */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">{translations.studentTestimonials}</h2>
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

        {/* سوالات متداول */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">{translations.faq}</h2>
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

        {/* CTA نهایی */}
        <section className="py-20 bg-gradient-to-r from-gray-600 to-gray-700 text-white">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <h2 className="text-4xl font-bold mb-4">
              زودی باز می‌شویم!
            </h2>
            <p className="text-xl mb-8 opacity-90">
              برای اطلاع از باز شدن مجدد ثبت‌نام، ما را دنبال کنید
            </p>
            
            <Button 
              disabled
              size="lg"
              className="bg-gray-500 text-white cursor-not-allowed rounded-full px-12 py-6 text-xl font-bold opacity-75"
            >
              <Heart className="mr-2" size={24} />
              ظرفیت تکمیل شده
            </Button>
            
            <p className="text-sm mt-4 opacity-80">
              ✅ به زودی باز می‌شود • ✅ ظرفیت محدود • ✅ کیفیت تضمینی
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default BoundlessTastePage;
