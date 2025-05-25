
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Award, Search, Users, FileCheck, BookOpen, Star, DollarSign, User } from "lucide-react";
import AuthModal from "@/components/Auth/AuthModal";

// Countdown target date (1 month from now as an example)
const COUNTDOWN_TARGET = new Date();
COUNTDOWN_TARGET.setMonth(COUNTDOWN_TARGET.getMonth() + 1);

const InstagramLanding = () => {
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

  // Course benefits
  const courseBenefits = [
    "افزایش فالوورهای واقعی و هدفمند",
    "ساخت محتوای حرفه‌ای و جذاب",
    "تولید استوری و ریلز با بالاترین نرخ تعامل",
    "طراحی کمپین‌های تبلیغاتی موفق",
    "ایجاد استراتژی فروش مستقیم در اینستاگرام",
    "آشنایی با ابزارهای هوشمند مدیریت پیج"
  ];

  // Course modules
  const courseModules = [
    "مبانی ایجاد برند شخصی قدرتمند در اینستاگرام",
    "تکنیک‌های تولید محتوای تأثیرگذار بصری",
    "استراتژی‌های رشد ارگانیک فالوور",
    "اصول کپشن‌نویسی حرفه‌ای و جذاب",
    "ساخت استوری و ریلز با بالاترین میزان تعامل",
    "تکنیک‌های پیشرفته ادیت عکس و ویدیو",
    "طراحی و اجرای کمپین‌های تبلیغاتی موفق",
    "تبدیل فالوور به مشتری و افزایش فروش"
  ];

  // Testimonials
  const testimonials = [
    {
      name: "نسترن محمدی",
      role: "فروشنده محصولات دست‌ساز",
      content: "با آموزش‌های این دوره توانستم تعداد فالوورهای پیج کسب و کارم را از ۵۰۰ به ۸۰۰۰ نفر در مدت ۳ ماه برسانم و فروشم ۵ برابر شد!"
    },
    {
      name: "امیر رضایی",
      role: "مشاور املاک",
      content: "استراتژی‌های تولید محتوا در این دوره به من کمک کرد تا پیج املاکم را از رقبا متمایز کنم و مشتریان بیشتری جذب کنم."
    },
    {
      name: "مهسا کریمی",
      role: "مربی فیتنس",
      content: "با تکنیک‌های ساخت ریلز که در این دوره آموختم، ویدیوهای من به طرز چشمگیری بیشتر دیده شدند و درخواست‌های همکاری زیادی دریافت کردم."
    }
  ];

  // FAQ data
  const faqItems = [
    {
      question: "آیا این دوره مناسب مبتدیان است؟",
      answer: "بله، این دوره از سطح مبتدی شروع می‌شود و تا تکنیک‌های پیشرفته ادامه پیدا می‌کند. حتی اگر تازه می‌خواهید پیج اینستاگرام خود را راه‌اندازی کنید، این دوره به شما کمک خواهد کرد."
    },
    {
      question: "چقدر زمان برای تکمیل دوره نیاز است؟",
      answer: "کل محتوای دوره حدود ۱۵ ساعت است که بهتر است در طول ۴ هفته مطالعه و تمرین شود. هر جلسه بین ۳۰ تا ۶۰ دقیقه طول می‌کشد."
    },
    {
      question: "آیا نیاز به تجهیزات خاصی دارم؟",
      answer: "خیر، تنها به یک گوشی هوشمند با دوربین مناسب نیاز دارید. البته برای نتایج بهتر، چند اپلیکیشن رایگان ویرایش عکس و ویدیو معرفی می‌کنیم که می‌توانید نصب کنید."
    },
    {
      question: "آیا بعد از خرید دوره به پشتیبانی دسترسی دارم؟",
      answer: "بله، تا ۳ ماه پس از خرید دوره می‌توانید سوالات خود را از طریق پشتیبانی سایت مطرح کنید. همچنین به گروه اختصاصی دانشجویان دسترسی خواهید داشت."
    }
  ];

  // Instructor data
  const instructor = {
    name: "سارا محمدی",
    role: "متخصص دیجیتال مارکتینگ و مشاور اینستاگرام",
    bio: "با بیش از ۶ سال تجربه در زمینه بازاریابی دیجیتال و مدیریت بیش از ۵۰ پیج اینستاگرام موفق با مجموعاً بیش از ۲ میلیون فالوور"
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-white pt-24 pb-12 overflow-hidden">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block text-sm font-medium bg-black/5 px-3 py-1 rounded-full">
                {translations.instagramEssentials}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                اسباب اینستاگرام
              </h1>
              <p className="text-lg text-gray-600">
                همه آنچه برای ساخت یک پیج اینستاگرام حرفه‌ای، جذب هزاران فالوور واقعی و کسب درآمد نیاز دارید
              </p>
              
              {/* Price Block */}
              <div className="bg-black/5 p-4 sm:p-6 rounded-2xl space-y-2 max-w-sm">
                <div className="flex justify-between items-center">
                  <span className="line-through text-gray-500">
                    ۱,۳۰۰,۰۰۰ تومان
                  </span>
                  <span className="bg-black text-white px-3 py-1 rounded-full text-sm">
                    -۴۵٪
                  </span>
                </div>
                <div className="text-3xl font-bold">
                  ۷۵۰,۰۰۰ تومان
                </div>
                <div className="text-sm text-gray-600">
                  شامل پشتیبانی ۳ ماهه و به‌روزرسانی‌های رایگان
                </div>
              </div>
              
              {/* CTA and Countdown */}
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-black hover:bg-black/90 text-white rounded-full"
                  onClick={() => setShowAuthModal(true)}
                >
                  شروع دوره
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>پیشنهاد ویژه تا:</span>
                  <div className="flex gap-1 text-black font-mono">
                    <span className="bg-black/5 px-2 py-1 rounded">{countdown.days}d</span>:
                    <span className="bg-black/5 px-2 py-1 rounded">{countdown.hours}h</span>:
                    <span className="bg-black/5 px-2 py-1 rounded">{countdown.minutes}m</span>:
                    <span className="bg-black/5 px-2 py-1 rounded">{countdown.seconds}s</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border border-black/10 bg-black/5 flex items-center justify-center">
                <Search size={80} className="text-black/50" />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-black/80 flex items-center justify-center">
                    <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white ml-1"></div>
                  </div>
                </div>
              </div>
              
              {/* Floating Element */}
              <div className="absolute -bottom-5 -right-5 bg-white p-4 rounded-xl shadow-lg border border-black/10 max-w-xs animate-float">
                <p className="text-sm font-medium">
                  بیش از ۵۰۰ نفر این دوره را با موفقیت به پایان رسانده‌اند!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section id="benefits" className="bg-white py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">
              با این دوره چه چیزهایی یاد می‌گیرید؟
            </h2>
            <p className="text-lg text-gray-600">
              در دوره اسباب اینستاگرام، تمامی تکنیک‌های حرفه‌ای مدیریت پیج، تولید محتوا و کسب درآمد از اینستاگرام را به صورت گام به گام و کاربردی خواهید آموخت.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courseBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-black/5 rounded-xl hover:bg-black/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                  <Check size={18} />
                </div>
                <p className="font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Modules */}
      <section className="bg-black text-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            سرفصل‌های دوره
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courseModules.map((module, index) => (
              <div key={index} className="flex items-start gap-4 bg-white/10 p-6 rounded-xl hover:bg-white/15 transition-colors">
                <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center flex-shrink-0">
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
              className="bg-white hover:bg-white/90 text-black rounded-full"
              onClick={() => setShowAuthModal(true)}
            >
              شروع دوره
            </Button>
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
              <User size={40} className="text-black/60" />
            </div>
            <h3 className="text-xl font-bold mb-2">{instructor.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{instructor.role}</p>
            <p className="text-gray-700">{instructor.bio}</p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full">
                <Award size={18} className="text-black/70" />
                <span className="text-sm">بیش از ۱۰۰۰ دانشجو</span>
              </div>
              <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full">
                <Star size={18} className="text-black/70" />
                <span className="text-sm">رضایت ۹۷٪ دانشجویان</span>
              </div>
              <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full">
                <FileCheck size={18} className="text-black/70" />
                <span className="text-sm">۶ سال تجربه</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-black/5 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            نظرات دانشجویان
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-black/5 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-black/5 flex items-center justify-center">
                      <User size={24} className="text-black/60" />
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
            سوالات متداول
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
      
      {/* Final CTA */}
      <section className="bg-black text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">آماده ساختن یک پیج اینستاگرام حرفه‌ای هستید؟</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            همین امروز به جمع بیش از ۱۰۰۰ دانشجوی موفق دوره اسباب اینستاگرام بپیوندید و کسب و کار خود را متحول کنید.
          </p>
          <Button 
            size="lg" 
            className="bg-white hover:bg-white/90 text-black rounded-full"
            onClick={() => setShowAuthModal(true)}
          >
            شروع دوره با تخفیف ویژه
          </Button>
        </div>
      </section>
      
      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 py-3 z-30 shadow-lg">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="font-bold">قیمت ویژه: ۷۵۰,۰۰۰ تومان</div>
                <div className="text-sm text-gray-600">
                  <Clock size={14} className="inline mr-1" /> 
                  {countdown.days}د {countdown.hours}س {countdown.minutes}د
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-black hover:bg-black/90 text-white rounded-full w-full sm:w-auto"
              onClick={() => setShowAuthModal(true)}
            >
              همین الان شروع کنید
            </Button>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        courseTitle={translations.instagramEssentials}
        isPaid={true}
      />
    </MainLayout>
  );
};

export default InstagramLanding;
