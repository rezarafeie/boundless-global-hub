
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import CountdownTimer from "@/components/CountdownTimer";
import { 
  GraduationCap, 
  Users, 
  Trophy, 
  Target,
  Gift,
  CheckCircle,
  Star,
  Clock,
  Globe,
  DollarSign,
  BookOpen,
  MessageSquare
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const BoundlessTastePage = () => {
  const { translations } = useLanguage();

  // تاریخ ۱۱ روز آینده برای شمارش معکوس
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

  const courseGifts = [
    "🎯 ورکشاپ درآمد فوری دلاری",
    "📌 اصل تک اولویت (برای تمرکز در مسیر هدف)",
    "🇺🇸 وبینار بیزینس آمریکایی (۲ جلسه با هدایای ویژه)",
    "💸 پروژه درآمد غیرفعال (۲ جلسه + هدایای کامل)",
    "🔄 پروژه تغییر (۳ جلسه + هدیه)",
    "🤖 پرامپت‌های هوش مصنوعی مخصوص کسب‌وکار",
    "و ده‌ها ابزار و فایل کاربردی برای شروع بیزینس آنلاین"
  ];

  const keyFeatures = [
    "تدریس توسط رضا رفیعی با زبان ساده و تجربه عملی",
    "همراه با تست شخصیت و تمرین‌های واقعی",
    "پشتیبانی اختصاصی + گروه ارتباطی دانشجویان",
    "بدون نیاز به سرمایه اولیه یا تخصص فنی",
    "دسترسی دائمی به محتوای دوره"
  ];

  const testimonials = [
    {
      name: "علی احمدی",
      text: "این دوره زندگی من را کاملاً تغییر داد. الان درآمد ماهانه ۵۰۰۰ دلاری دارم!"
    },
    {
      name: "سارا محمدی", 
      text: "بهترین سرمایه‌گذاری که در زندگیم کردم. رضا رفیعی واقعاً استاد کاره!"
    },
    {
      name: "حسین رضایی",
      text: "من که هیچ تجربه‌ای نداشتم، الان یک کسب‌وکار آنلاین موفق دارم."
    }
  ];

  const faqItems = [
    {
      question: "آیا نیاز به سرمایه اولیه دارم؟",
      answer: "خیر، این دوره بدون نیاز به سرمایه اولیه طراحی شده است."
    },
    {
      question: "چقدر زمان نیاز دارم؟",
      answer: "روزانه ۱-۲ ساعت کافی است تا تمام مطالب را فرا بگیرید."
    },
    {
      question: "آیا پشتیبانی دارد؟",
      answer: "بله، پشتیبانی اختصاصی و گروه ارتباطی دانشجویان در اختیار شماست."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* هدر اصلی */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-6 py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <GraduationCap size={64} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {translations.boundlessStartTitle}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
            {translations.boundlessStartDesc}
          </p>

          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto">
            این دوره مخصوص افرادی است که می‌خواهند کسب‌وکار آنلاین خود را راه‌اندازی کنند یا از طریق مهارت‌های دیجیتال، درآمد دلاری داشته باشند. با ترکیبی از آموزش تخصصی، پشتیبانی گام‌به‌گام، تست شخصیت، تمرین‌های عملی و مشاوره اختصاصی، این برنامه یک انتخاب کامل برای جهش به سمت جهانی شدن است.
          </p>

          {/* دکمه غیرفعال */}
          <Button 
            disabled 
            size="lg" 
            className="bg-gray-500 text-white cursor-not-allowed opacity-60 text-lg px-8 py-6 rounded-xl shadow-xl"
          >
            <Clock className="mr-2" size={24} />
            {translations.courseSoldOut}
          </Button>
        </div>
      </div>

      {/* شمارش معکوس */}
      <div className="container mx-auto px-6 -mt-8 relative z-10">
        <CountdownTimer 
          endDate={countdownEndDate.toISOString()}
          className="w-full max-w-4xl mx-auto"
        />
      </div>

      {/* محتوای اصلی */}
      <div className="container mx-auto px-6 py-16 space-y-16">
        
        {/* معرفی مدرس */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Users size={48} className="text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              {translations.courseInstructor}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">رضا رفیعی</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                کارآفرین موفق با بیش از ۱۰ سال تجربه در حوزه کسب‌وکار بین‌المللی و مؤسس آکادمی رفیعی. 
                او با استفاده از روش‌های علمی و تجربیات عملی، بیش از ۵۰۰۰ نفر را به موفقیت رسانده است.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* محتوای دوره */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 rounded-full">
                <BookOpen size={48} className="text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              {translations.courseContent}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {courseContent.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 space-x-reverse p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                  <span className="text-lg text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* هدایای دوره */}
        <Card className="shadow-2xl border-0 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-purple-100 rounded-full">
                <Gift size={48} className="text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              {translations.courseGifts} (کاملاً رایگان)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseGifts.map((gift, index) => (
                <div key={index} className="flex items-start space-x-3 space-x-reverse p-4 bg-white rounded-xl shadow-sm">
                  <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                    <Gift size={20} className="text-purple-600" />
                  </div>
                  <span className="text-lg text-gray-700 leading-relaxed">{gift}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ویژگی‌های کلیدی */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-100 rounded-full">
                <Target size={48} className="text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              {translations.courseFeatures}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 space-x-reverse p-4 bg-yellow-50 rounded-xl">
                  <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                    <Trophy size={20} className="text-yellow-600" />
                  </div>
                  <span className="text-lg text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* نظرات دانشجویان */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-orange-100 rounded-full">
                <MessageSquare size={48} className="text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              {translations.studentTestimonials}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Carousel className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index}>
                    <div className="p-8 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl text-center">
                      <div className="flex justify-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={24} className="text-yellow-500 fill-current" />
                        ))}
                      </div>
                      <p className="text-xl text-gray-700 mb-6 italic leading-relaxed">
                        "{testimonial.text}"
                      </p>
                      <p className="text-lg font-semibold text-gray-800">
                        - {testimonial.name}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* سوالات متداول */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-800">
              {translations.faq}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-w-3xl mx-auto">
              {faqItems.map((item, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-xl">
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">
                    {item.question}
                  </h4>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* پیام نهایی */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-bold mb-6">
            🚀 آماده‌اید برای شروع سفر بدون مرز؟
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            فرصت طلایی برای تغییر زندگی‌تان! شمارش معکوس شروع شده...
          </p>
          <div className="text-lg bg-white/20 rounded-xl p-6 max-w-md mx-auto backdrop-blur-sm">
            <p className="font-semibold">
              ⏰ {translations.nextRegistrationDate}
            </p>
            <p className="text-sm mt-2 opacity-90">
              برای اطلاع از بازگشایی ثبت‌نام، صفحه را دنبال کنید
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BoundlessTastePage;
