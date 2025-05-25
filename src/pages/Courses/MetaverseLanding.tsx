
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Award, Code, Users, FileCheck, BookOpen, Star, DollarSign, User } from "lucide-react";
import AuthModal from "@/components/Auth/AuthModal";

// Countdown target date (2 months from now)
const COUNTDOWN_TARGET = new Date();
COUNTDOWN_TARGET.setMonth(COUNTDOWN_TARGET.getMonth() + 2);

const MetaverseLanding = () => {
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

  // Course outcomes
  const courseOutcomes = [
    "درک کامل از مفهوم متاورس و فناوری‌های زیربنایی آن",
    "آشنایی با انواع ارزهای دیجیتال و NFT و نحوه سرمایه‌گذاری در آنها",
    "مهارت در ایجاد و فروش دارایی‌های دیجیتال در متاورس",
    "توانایی راه‌اندازی کسب و کار متاورسی با کمترین سرمایه اولیه",
    "آشنایی با استراتژی‌های کسب درآمد از بازی‌های Play-to-Earn",
    "شناخت فرصت‌های شغلی نوظهور در اقتصاد متاورس"
  ];

  // Course modules
  const courseModules = [
    "مبانی متاورس: تاریخچه، مفاهیم و فناوری‌ها",
    "اصول بلاکچین و کاربرد آن در متاورس",
    "آشنایی با ارزهای دیجیتال و نحوه سرمایه‌گذاری ایمن",
    "NFTها: مفهوم، تولید، خرید و فروش",
    "اقتصاد متاورس و فرصت‌های کسب درآمد",
    "بازی‌های Play-to-Earn و استراتژی‌های موفقیت",
    "خرید و مدیریت زمین‌های دیجیتال در متاورس",
    "راه‌اندازی کسب و کار در متاورس و بازاریابی در این فضا",
    "آینده‌پژوهی متاورس و فرصت‌های شغلی آینده",
    "امنیت و محافظت از دارایی‌های دیجیتال"
  ];

  // Testimonials
  const testimonials = [
    {
      name: "آرش نوری",
      role: "طراح دیجیتال",
      content: "قبل از این دوره، مفهوم متاورس برایم گنگ بود. حالا نه تنها درک خوبی از آن دارم، بلکه توانستم اولین NFT خودم را هم بسازم و بفروشم!"
    },
    {
      name: "سینا محمدی",
      role: "سرمایه‌گذار ارزهای دیجیتال",
      content: "استراتژی‌های سرمایه‌گذاری در این دوره کمک کرد تا با دید بازتری در پروژه‌های متاورسی سرمایه‌گذاری کنم و بازدهی پورتفولیوی خود را افزایش دهم."
    },
    {
      name: "مینا صادقی",
      role: "بازی‌ساز مستقل",
      content: "بخش بازی‌های Play-to-Earn این دوره فوق‌العاده مفید بود. توانستم با استفاده از این آموزش‌ها، ایده بازی خودم را با مفهوم متاورس ترکیب کنم."
    }
  ];

  // FAQ data
  const faqItems = [
    {
      question: "آیا نیاز به دانش فنی قبلی برای شرکت در این دوره دارم؟",
      answer: "خیر، این دوره برای افراد با هر سطح دانش فنی طراحی شده است. ما از مفاهیم پایه شروع می‌کنیم و گام به گام شما را با پیچیدگی‌های متاورس آشنا می‌کنیم."
    },
    {
      question: "آیا برای سرمایه‌گذاری در متاورس به مبلغ زیادی پول نیاز است؟",
      answer: "لزوماً نه. در این دوره استراتژی‌های سرمایه‌گذاری با بودجه‌های مختلف را آموزش می‌دهیم و روش‌هایی برای شروع با سرمایه کم را نیز معرفی می‌کنیم."
    },
    {
      question: "آیا می‌توانم با آموزش‌های این دوره درآمد دلاری کسب کنم؟",
      answer: "بله، یکی از اهداف اصلی این دوره آموزش روش‌های کسب درآمد ارزی از متاورس است. البته میزان موفقیت شما به تلاش، استمرار و میزان اجرای آموخته‌ها بستگی دارد."
    },
    {
      question: "پس از خرید دوره، چه مدت به محتوا دسترسی خواهم داشت؟",
      answer: "شما دسترسی مادام‌العمر به محتوای دوره خواهید داشت و از تمام به‌روزرسانی‌های آینده نیز بهره‌مند می‌شوید."
    }
  ];

  // Instructor data
  const instructor = {
    name: "دکتر محمد فرهادی",
    role: "متخصص بلاکچین و اقتصاد دیجیتال",
    bio: "با بیش از ۷ سال تجربه در زمینه فناوری‌های بلاکچین و ۴ سال تمرکز بر متاورس و اقتصاد دیجیتال. مشاور چندین استارت‌آپ موفق در حوزه Web3 و متاورس."
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-white pt-24 pb-12 overflow-hidden">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block text-sm font-medium bg-black/5 px-3 py-1 rounded-full">
                {translations.metaverseEmpire}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                امپراطوری متاورس
              </h1>
              <p className="text-lg text-gray-600">
                دوره جامع آشنایی با متاورس، ارزهای دیجیتال و NFT - راهنمای قدم به قدم برای کسب درآمد دلاری در دنیای دیجیتال آینده
              </p>
              
              {/* Price Block */}
              <div className="bg-black/5 p-4 sm:p-6 rounded-2xl space-y-2 max-w-sm">
                <div className="flex justify-between items-center">
                  <span className="line-through text-gray-500">
                    ۲,۵۰۰,۰۰۰ تومان
                  </span>
                  <span className="bg-black text-white px-3 py-1 rounded-full text-sm">
                    -۴۰٪
                  </span>
                </div>
                <div className="text-3xl font-bold">
                  ۱,۵۰۰,۰۰۰ تومان
                </div>
                <div className="text-sm text-gray-600">
                  شامل پشتیبانی ۶ ماهه و به‌روزرسانی‌های رایگان
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
                <Code size={80} className="text-black/50" />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-black/80 flex items-center justify-center">
                    <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white ml-1"></div>
                  </div>
                </div>
              </div>
              
              {/* Floating Element */}
              <div className="absolute -bottom-5 -right-5 bg-white p-4 rounded-xl shadow-lg border border-black/10 max-w-xs animate-float">
                <p className="text-sm font-medium">
                  فرصتی استثنایی برای ورود به دنیای پر رونق متاورس!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Course Outcomes */}
      <section id="outcomes" className="bg-white py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">
              چه چیزی در این دوره خواهید آموخت؟
            </h2>
            <p className="text-lg text-gray-600">
              دوره امپراطوری متاورس شما را با مفاهیم و ابزارهای لازم برای ورود موفق به دنیای متاورس آشنا می‌کند و به شما کمک می‌کند تا فرصت‌های کسب درآمد در این فضای نوظهور را کشف و بهره‌برداری کنید.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courseOutcomes.map((outcome, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-black/5 rounded-xl hover:bg-black/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                  <Check size={18} />
                </div>
                <p className="font-medium">{outcome}</p>
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
                <span className="text-sm">بیش از ۴۰۰ دانشجو</span>
              </div>
              <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full">
                <Star size={18} className="text-black/70" />
                <span className="text-sm">رضایت ۹۵٪ دانشجویان</span>
              </div>
              <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full">
                <FileCheck size={18} className="text-black/70" />
                <span className="text-sm">۷ سال تجربه</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="bg-black/5 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            این دوره برای چه کسانی مناسب است؟
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-black/5 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-black/60" />
                </div>
                <h3 className="font-medium mb-2">علاقه‌مندان به تکنولوژی‌های نوین</h3>
                <p className="text-sm text-gray-600">
                  افرادی که می‌خواهند با مفاهیم جدید دنیای دیجیتال آشنا شوند
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={28} className="text-black/60" />
                </div>
                <h3 className="font-medium mb-2">سرمایه‌گذاران علاقه‌مند به ارزهای دیجیتال</h3>
                <p className="text-sm text-gray-600">
                  افرادی که به دنبال فرصت‌های سرمایه‌گذاری در بازار ارزهای دیجیتال هستند
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-4">
                  <Code size={28} className="text-black/60" />
                </div>
                <h3 className="font-medium mb-2">طراحان و توسعه‌دهندگان دیجیتال</h3>
                <p className="text-sm text-gray-600">
                  افرادی که می‌خواهند مهارت‌های خود را با فرصت‌های جدید متاورس ترکیب کنند
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} className="text-black/60" />
                </div>
                <h3 className="font-medium mb-2">علاقه‌مندان به کسب درآمد آنلاین</h3>
                <p className="text-sm text-gray-600">
                  افرادی که به دنبال کشف روش‌های جدید کسب درآمد در فضای دیجیتال هستند
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="bg-white py-20">
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
      <section className="bg-black/5 py-20">
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
          <h2 className="text-3xl font-bold mb-6">آماده ورود به دنیای متاورس هستید؟</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            با این دوره جامع، آینده دیجیتال را به فرصتی برای رشد و کسب درآمد خود تبدیل کنید.
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
                <div className="font-bold">قیمت ویژه: ۱,۵۰۰,۰۰۰ تومان</div>
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
        courseTitle={translations.metaverseEmpire}
        isPaid={true}
      />
    </MainLayout>
  );
};

export default MetaverseLanding;
