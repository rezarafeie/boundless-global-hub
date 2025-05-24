import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Award, Users, FileCheck, BookOpen, Star, GraduationCap } from "lucide-react";
import AuthModal from "@/components/Auth/AuthModal";

// Countdown target date (2 months from now as an example)
const COUNTDOWN_TARGET = new Date();
COUNTDOWN_TARGET.setMonth(COUNTDOWN_TARGET.getMonth() + 2);

const BoundlessLanding = () => {
  const { translations } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const distance = COUNTDOWN_TARGET.getTime() - now.getTime();
      
      if (distance < 0) {
        clearInterval(interval);
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Testimonials data
  const testimonials = [
    {
      name: "سارا احمدی",
      role: "طراح گرافیک",
      content: "این دوره به من کمک کرد تا کسب و کار طراحی خودم را بین‌المللی کنم. الان برای مشتریان خارجی کار می‌کنم و درآمد دلاری دارم."
    },
    {
      name: "علی محمدی",
      role: "برنامه‌نویس",
      content: "با مفاهیم دراپ‌سرویسینگ آشنا شدم و توانستم یک کسب و کار خدماتی راه‌اندازی کنم. آموزش‌ها واقعاً کاربردی و قابل اجرا هستند."
    },
    {
      name: "مریم کریمی",
      role: "دانشجو",
      content: "حتی به عنوان یک دانشجو، توانستم با روش‌های این دوره یک محصول دیجیتال درست کنم و درآمد غیرفعال داشته باشم. کاملاً شیوه فکر کردنم عوض شد."
    }
  ];

  // FAQ data
  const faqItems = [
    {
      question: translations.boundlessLandingFAQ1Q,
      answer: translations.boundlessLandingFAQ1A
    },
    {
      question: translations.boundlessLandingFAQ2Q,
      answer: translations.boundlessLandingFAQ2A
    },
    {
      question: translations.boundlessLandingFAQ3Q,
      answer: translations.boundlessLandingFAQ3A
    },
    {
      question: translations.boundlessLandingFAQ4Q,
      answer: translations.boundlessLandingFAQ4A
    }
  ];

  // Instructor data
  const instructor = {
    name: "دکتر مهدی رفیعی",
    role: "متخصص کارآفرینی و کسب‌وکارهای جهانی",
    bio: "بیش از 10 سال تجربه در ایجاد کسب‌وکارهای اینترنتی موفق و کمک به صدها کارآفرین برای کسب درآمد ارزی"
  };

  // Course modules
  const courseModules = [
    "تفکر بدون مرز و ذهنیت کارآفرینی جهانی",
    "آشنایی با بازارهای بین‌المللی و فرصت‌های کسب درآمد",
    "اصول دراپ‌شیپینگ و راه‌اندازی فروشگاه آنلاین",
    "دراپ‌سرویسینگ و ارائه خدمات به بازار جهانی",
    "تولید محصولات دیجیتال با هزینه صفر",
    "بازاریابی محصولات و خدمات در بازارهای خارجی",
    "روش‌های دریافت پول از مشتریان بین‌المللی",
    "اتوماسیون و مقیاس‌پذیری کسب و کار"
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pt-24 pb-12 overflow-hidden">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full">
                <Star className="h-4 w-4" />
                {translations.boundlessLandingTitle}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {translations.boundlessLandingSubtitle}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {translations.boundlessLandingHeroDesc}
              </p>
              
              {/* Enhanced Price Block */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-2xl space-y-3 max-w-sm border-2 border-purple-200 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="line-through text-gray-500 text-lg">
                    {translations.boundlessLandingOriginalPrice}
                  </span>
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -86%
                  </span>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {translations.boundlessLandingSpecialOffer}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  <Check className="h-4 w-4 inline mr-1 text-green-600" />
                  {translations.boundlessLandingInclusive}
                </div>
              </div>
              
              {/* Enhanced CTA and Countdown */}
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg transform transition hover:scale-105"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Star className="h-5 w-5 mr-2" />
                  {translations.boundlessLandingStartCourse}
                </Button>
                
                <div className="text-sm text-center sm:text-left">
                  <a href="#about" className="text-purple-600 hover:text-purple-700 underline font-medium">
                    {translations.boundlessLandingJoinLater}
                  </a>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg shadow-sm">
                  <Clock size={16} className="text-orange-500" />
                  <span className="font-medium">{translations.boundlessLandingCountdown}</span>
                  <div className="flex gap-1 text-purple-600 font-mono font-bold">
                    <span className="bg-purple-100 px-2 py-1 rounded">{countdown.days}d</span>:
                    <span className="bg-purple-100 px-2 py-1 rounded">{countdown.hours}h</span>:
                    <span className="bg-purple-100 px-2 py-1 rounded">{countdown.minutes}m</span>:
                    <span className="bg-purple-100 px-2 py-1 rounded">{countdown.seconds}s</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <GraduationCap size={80} className="text-purple-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-purple-600 ml-1"></div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Floating Element */}
              <div className="absolute -bottom-5 -right-5 bg-white p-4 rounded-xl shadow-xl border border-purple-100 max-w-xs">
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-purple-600 font-bold">تنها با ۷ دلار</span>، مسیر درآمدزایی جهانی خود را آغاز کنید!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section with Enhanced Design */}
      <section id="about" className="bg-white py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {translations.boundlessLandingAboutTitle}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-gray-600 leading-relaxed">
              دوره «شروع بدون مرز» یک برنامه آموزشی جامع است که به شما کمک می‌کند ذهنیت درست برای کسب و کار جهانی را توسعه دهید و با روش‌های عملی، اولین کسب و کار اینترنتی خود را با درآمد دلاری راه‌اندازی کنید.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-200">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center text-purple-600">{translations.boundlessLandingWhoFor}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>علاقه‌مندان به کسب درآمد آنلاین</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>افراد مایل به کسب درآمد ارزی</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>افراد بدون تجربه قبلی در کسب و کار آنلاین</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>علاقه‌مندان به کار از راه دور</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-200">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                  <FileCheck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center text-purple-600">{translations.boundlessLandingSolutions}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>عدم آشنایی با روش‌های کسب درآمد دلاری</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>نداشتن ایده برای شروع کسب و کار اینترنتی</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>نداشتن منابع کافی برای سرمایه‌گذاری بزرگ</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>چالش‌های دریافت و انتقال پول بین‌المللی</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-200">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center text-purple-600">{translations.boundlessLandingResultsTitle}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>راه‌اندازی اولین کسب و کار آنلاین شما</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>دریافت اولین درآمد دلاری</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>یادگیری روش‌های دریافت پول از خارج کشور</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                    <span>ایجاد ذهنیت کارآفرینی جهانی</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Modules */}
      <section className="bg-black/5 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            سرفصل‌های دوره
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courseModules.map((module, index) => (
              <div key={index} className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-medium">{module}</h3>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <Button 
              size="lg" 
              className="bg-black hover:bg-black/90 text-white rounded-full"
              onClick={() => setShowAuthModal(true)}
            >
              {translations.boundlessLandingStartCourse}
            </Button>
          </div>
        </div>
      </section>
      
      {/* What You'll Learn */}
      <section className="bg-black text-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            {translations.boundlessLandingWhatLearn}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Award size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {translations.boundlessLandingSkill1}
              </h3>
              <p className="text-sm text-white/70">
                تفکر بدون مرز برای ساختن کسب‌وکار جهانی
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {translations.boundlessLandingSkill2}
              </h3>
              <p className="text-sm text-white/70">
                فروش محصولات فیزیکی بدون نیاز به موجودی
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <FileCheck size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {translations.boundlessLandingSkill3}
              </h3>
              <p className="text-sm text-white/70">
                ارائه خدمات و مهارت‌ها به بازارهای بین‌المللی
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <FileCheck size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {translations.boundlessLandingSkill4}
              </h3>
              <p className="text-sm text-white/70">
                ساخت و فروش محصولات دیجیتال با هزینه صفر
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <FileCheck size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {translations.boundlessLandingSkill5}
              </h3>
              <p className="text-sm text-white/70">
                آشنایی با سیستم‌های مقیاس‌پذیر کسب درآمد
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="bg-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            مدرس دوره
          </h2>
          
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full bg-black/5 mx-auto mb-6 flex items-center justify-center">
              <Users size={40} className="text-black/60" />
            </div>
            <h3 className="text-xl font-bold mb-2">{instructor.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{instructor.role}</p>
            <p className="text-gray-700">{instructor.bio}</p>
          </div>
        </div>
      </section>
      
      {/* Course Bonuses */}
      <section className="bg-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            {translations.boundlessLandingBonusesTitle}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-black/5 bg-black/5 shadow-sm">
              <CardContent className="p-6 flex flex-col h-full">
                <span className="bg-black text-white text-xs px-2 py-1 rounded-full self-start mb-4">
                  بونوس ۱
                </span>
                <div className="w-12 h-12 rounded-full bg-white mx-auto mb-4 flex items-center justify-center">
                  <Star size={24} className="text-black/70" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-center">
                  {translations.boundlessLandingBonus1}
                </h3>
                <p className="text-sm text-gray-600 flex-grow text-center">
                  با این دوره یاد می‌گیرید چگونه با کمک هوش مصنوعی محصولات دیجیتال تولید کنید و به صورت غیرفعال کسب درآمد کنید.
                </p>
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-500 line-through">ارزش: ۲۰ دلار</span>
                  <span className="text-sm bg-black text-white px-2 py-1 rounded-full ml-2">رایگان</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 bg-black/5 shadow-sm">
              <CardContent className="p-6 flex flex-col h-full">
                <span className="bg-black text-white text-xs px-2 py-1 rounded-full self-start mb-4">
                  بونوس ۲
                </span>
                <div className="w-12 h-12 rounded-full bg-white mx-auto mb-4 flex items-center justify-center">
                  <FileCheck size={24} className="text-black/70" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-center">
                  {translations.boundlessLandingBonus2}
                </h3>
                <p className="text-sm text-gray-600 flex-grow text-center">
                  با یکی از ارزیابی‌های حرفه‌ای ما، نقاط قوت و ضعف شخصیتی خود را بشناسید و مسیر شغلی مناسب خود را پیدا کنید.
                </p>
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-500 line-through">ارزش: ۱۵ دلار</span>
                  <span className="text-sm bg-black text-white px-2 py-1 rounded-full ml-2">رایگان</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 bg-black/5 shadow-sm">
              <CardContent className="p-6 flex flex-col h-full">
                <span className="bg-black text-white text-xs px-2 py-1 rounded-full self-start mb-4">
                  بونوس ۳
                </span>
                <div className="w-12 h-12 rounded-full bg-white mx-auto mb-4 flex items-center justify-center">
                  <BookOpen size={24} className="text-black/70" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-center">
                  {translations.boundlessLandingBonus3}
                </h3>
                <p className="text-sm text-gray-600 flex-grow text-center">
                  یک راهنمای گام به گام برای کسب اولین درآمد دلاری آنلاین، از صفر تا صد با جزئیات اجرایی دقیق.
                </p>
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-500 line-through">ارزش: ۱۰ دلار</span>
                  <span className="text-sm bg-black text-white px-2 py-1 rounded-full ml-2">رایگان</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="bg-black/5 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            {translations.boundlessLandingTestimonialsTitle}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-black/5 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-black/5 flex items-center justify-center">
                      <Users size={24} className="text-black/60" />
                    </div>
                    <div>
                      <h3 className="font-medium">{testimonial.name}</h3>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{testimonial.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            {translations.boundlessLandingFAQTitle}
          </h2>
          
          <div className="max-w-3xl mx-auto">
            {faqItems.map((item, index) => (
              <div key={index} className="mb-6 border-b border-black/10 pb-6 last:border-b-0">
                <h3 className="text-xl font-medium mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Is This Right For Me */}
      <section className="bg-black text-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            {translations.boundlessLandingFitTitle}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <h3 className="font-medium mb-4">{translations.boundlessLandingFitStudent}</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Check size={24} className="text-white" />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <h3 className="font-medium mb-4">{translations.boundlessLandingFitFreelancer}</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Check size={24} className="text-white" />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <h3 className="font-medium mb-4">{translations.boundlessLandingFitRemote}</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Check size={24} className="text-white" />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <h3 className="font-medium mb-4">{translations.boundlessLandingFitEntrepreneur}</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Check size={24} className="text-white" />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <h3 className="font-medium mb-4">{translations.boundlessLandingFitMigrate}</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Check size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        courseTitle={translations.boundlessLandingTitle}
        isPaid={true}
      />
    </MainLayout>
  );
};

export default BoundlessLanding;
