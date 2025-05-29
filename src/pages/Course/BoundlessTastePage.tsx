
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
  DollarSign,
  Clock,
  BookOpen,
  Award,
  UserCheck,
  Lock,
  AlertCircle
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BoundlessTastePage = () => {
  const [showIframeModal, setShowIframeModal] = useState(false);

  // Calculate countdown end date (11 days from now)
  const countdownEndDate = new Date();
  countdownEndDate.setDate(countdownEndDate.getDate() + 11);

  const courseContent = [
    "نگرش بدون مرز",
    "دراپ‌شیپینگ",
    "دراپ‌سرویسینگ",
    "فروش فایل و آکادمی آنلاین",
    "بازارهای مالی و زیرساخت‌های بین‌المللی",
    "جلسه پرسش و پاسخ + مشاوره خصوصی",
    "تست شخصیت کارآفرین برای تعیین مسیر مناسب"
  ];

  const gifts = [
    "🎯 ورکشاپ درآمد فوری دلاری",
    "📌 اصل تک اولویت (برای تمرکز در مسیر هدف)",
    "🇺🇸 وبینار بیزینس آمریکایی (۲ جلسه با هدایای ویژه)",
    "💸 پروژه درآمد غیرفعال (۲ جلسه + هدایای کامل)",
    "🔄 پروژه تغییر (۳ جلسه + هدیه)",
    "🤖 پرامپت‌های هوش مصنوعی مخصوص کسب‌وکار",
    "و ده‌ها ابزار و فایل کاربردی برای شروع بیزینس آنلاین"
  ];

  const features = [
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
      content: "این دوره واقعاً زندگی‌ام را تغییر داد. حالا درآمد دلاری دارم و کسب‌وکار بین‌المللی‌ام رو شروع کردم.",
      rating: 5
    },
    {
      name: "سارا احمدی",
      role: "صاحب استارتاپ",
      content: "آموزش‌های عملی و قابل اجرا. استاد رفیعی به شکل خیلی ساده مفاهیم پیچیده رو توضیح می‌ده.",
      rating: 5
    },
    {
      name: "محمد کریمی",
      role: "مدیر فروش",
      content: "بعد از این دوره، نگاهم به کسب‌وکار کاملاً تغییر کرد. حالا می‌دونم چطور به بازارهای جهانی ورود کنم.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "آیا این دوره برای مبتدیان مناسب است؟",
      answer: "بله، دوره «شروع بدون مرز» از صفر طراحی شده و هیچ پیش‌زمینه‌ای نیاز ندارد. تمام مفاهیم گام‌به‌گام آموزش داده می‌شود."
    },
    {
      question: "چقدر زمان باید روزانه صرف کنم؟",
      answer: "حداقل ۱ ساعت در روز توصیه می‌شود. اما دوره طوری طراحی شده که با ۳۰ دقیقه در روز هم قابل اجرا باشد."
    },
    {
      question: "آیا گارانتی بازگشت وجه دارد؟",
      answer: "بله، ۳۰ روز گارانتی کامل بازگشت وجه داریم. اگر راضی نباشید، تمام پولتان برگردانده می‌شود."
    },
    {
      question: "چه میزان درآمد می‌توانم انتظار داشته باشم؟",
      answer: "با پیروی از برنامه، اکثر دانشجویان در ۳-۶ ماه اولین درآمدهای دلاری خود را کسب می‌کنند. البته نتایج بستگی به میزان تلاش شما دارد."
    },
    {
      question: "چرا ثبت‌نام متوقف شده؟",
      answer: "به دلیل کیفیت بالای آموزش و پشتیبانی شخصی‌سازی شده، تعداد دانشجویان محدود است. ثبت‌نام مجدد ۱۱ روز دیگر آغاز می‌شود."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                <Lock className="w-4 h-4 mr-1" />
                ثبت‌نام متوقف شده
              </Badge>
              
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                شروع بدون مرز
                <span className="block text-2xl md:text-3xl mt-2 text-gray-600 font-normal">
                  گامی به سوی کسب‌وکار بین‌المللی و درآمد دلاری
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                دوره «شروع بدون مرز» یک برنامه جامع آموزشی است که مسیر ورود به بازارهای بین‌المللی را برای دانشجویان، کارمندان، صاحبان کسب‌وکار و علاقه‌مندان به درآمد ارزی روشن می‌سازد.
              </motion.p>

              <motion.p 
                className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                این دوره مخصوص افرادی است که می‌خواهند کسب‌وکار آنلاین خود را راه‌اندازی کنند یا از طریق مهارت‌های دیجیتال، درآمد دلاری داشته باشند.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button 
                  disabled
                  size="lg"
                  className="bg-gray-400 text-white cursor-not-allowed rounded-full px-12 py-6 text-xl font-bold"
                >
                  <AlertCircle className="mr-2" size={24} />
                  ظرفیت تکمیل شده / فروش متوقف شده
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  ثبت‌نام مجدد ۱۱ روز دیگر آغاز می‌شود
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Countdown Timer */}
        <section className="py-8">
          <div className="container max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">⏳ شمارش معکوس آغاز ثبت‌نام</h2>
              <p className="text-lg text-gray-600">
                ظرفیت ثبت‌نام فعلاً تکمیل شده. جهت اطلاع از باز شدن مجدد ثبت‌نام، لطفاً شمارش معکوس زیر را دنبال کن 👇
              </p>
            </div>
            <CountdownTimer 
              endDate={countdownEndDate.toISOString()}
              className="mx-auto"
            />
          </div>
        </section>

        {/* Course Content Section */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <BookOpen className="mr-3 text-purple-600" />
                📦 محتوای دوره
              </h2>
              <p className="text-xl text-gray-600">آنچه در این دوره خواهید آموخت</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseContent.map((content, index) => (
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
                  <span className="text-lg font-medium">{content}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Gifts Section */}
        <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <Gift className="mr-3 text-purple-600" />
                🎁 هدایای جدید دوره (کاملاً رایگان)
              </h2>
              <p className="text-xl text-gray-600">هدایای ویژه همراه با دوره</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gifts.map((gift, index) => (
                <Card key={index} className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Gift size={20} className="text-purple-600" />
                      </div>
                      <p className="text-lg">{gift}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <Zap className="mr-3 text-purple-600" />
                🔥 ویژگی‌های کلیدی دوره
              </h2>
              <p className="text-xl text-gray-600">چرا این دوره متفاوت است؟</p>
            </div>
            
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
                        <CheckCircle size={32} className="text-purple-600" />
                      </div>
                      <p className="text-lg">{feature}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <UserCheck className="mr-3 text-purple-600" />
                معرفی مدرس
              </h2>
            </div>
            
            <Card className="max-w-4xl mx-auto border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserCheck size={64} className="text-purple-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">رضا رفیعی</h3>
                  <p className="text-xl text-gray-600 mb-6">مدرس، کارآفرین و مشاور کسب‌وکار بین‌المللی</p>
                  <p className="text-lg leading-relaxed max-w-3xl mx-auto">
                    رضا رفیعی با بیش از ۱۰ سال تجربه در حوزه کسب‌وکار بین‌المللی و درآمد ارزی، صدها دانشجو را در مسیر موفقیت راهنمایی کرده است. 
                    ایشان با زبان ساده و تجربه عملی، پیچیده‌ترین مفاهیم کسب‌وکار را به آسان‌ترین شکل آموزش می‌دهند.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 flex items-center justify-center">
              <Star className="mr-3 text-purple-600" />
              پیام اعتماد و رضایت دانشجویان قبلی
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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
        <section className="py-20 bg-gradient-to-r from-gray-600 to-gray-700 text-white">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">
              ثبت‌نام مجدد به زودی آغاز می‌شود
            </h2>
            <p className="text-xl mb-8 opacity-90">
              برای اطلاع از باز شدن ثبت‌نام، شمارش معکوس بالا را دنبال کنید
            </p>
            
            <div className="flex justify-center items-center gap-4 mb-8">
              <Clock size={32} className="text-yellow-300" />
              <span className="text-3xl font-bold">۱۱ روز باقی‌مانده</span>
            </div>
            
            <Button 
              disabled
              size="lg"
              className="bg-gray-500 text-white cursor-not-allowed rounded-full px-12 py-6 text-xl font-bold"
            >
              <Lock className="mr-2" size={24} />
              ظرفیت تکمیل شده
            </Button>
            
            <p className="text-sm mt-4 opacity-80">
              ✅ ۳۰ روز گارانتی بازگشت وجه • ✅ دسترسی فوری • ✅ پشتیبانی ۲۴/۷
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default BoundlessTastePage;
