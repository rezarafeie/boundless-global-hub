
import React from "react";
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
  UserCheck,
  BookOpen,
  Award,
  MessageCircle,
  TrendingUp,
  Globe
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BoundlessTastePage = () => {
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

  const keyFeatures = [
    {
      icon: UserCheck,
      title: "تدریس رضا رفیعی",
      description: "با زبان ساده و تجربه عملی"
    },
    {
      icon: Brain,
      title: "تست شخصیت",
      description: "همراه با تمرین‌های واقعی"
    },
    {
      icon: MessageCircle,
      title: "پشتیبانی اختصاصی",
      description: "گروه ارتباطی دانشجویان"
    },
    {
      icon: DollarSign,
      title: "بدون سرمایه اولیه",
      description: "بدون نیاز به تخصص فنی"
    },
    {
      icon: Clock,
      title: "دسترسی دائمی",
      description: "به محتوای دوره"
    }
  ];

  const testimonials = [
    {
      name: "احمد محمدی",
      role: "کارآفرین دیجیتال",
      content: "این دوره واقعاً زندگی‌ام را تغییر داد. از یک کارمند معمولی به کسی که درآمد دلاری دارد تبدیل شدم.",
      rating: 5
    },
    {
      name: "مریم صادقی", 
      role: "صاحب کسب‌وکار آنلاین",
      content: "روش‌های عملی که آموختم کاملاً قابل اجرا بود. حالا یک کسب‌وکار موفق بین‌المللی دارم.",
      rating: 5
    },
    {
      name: "علی رضایی",
      role: "متخصص دراپ‌شیپینگ", 
      content: "بهترین سرمایه‌گذاری که تا به حال کردم. تست شخصیت به من کمک کرد مسیر درست را پیدا کنم.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "آیا این دوره برای مبتدیان مناسب است؟",
      answer: "بله، دوره شروع بدون مرز از پایه طراحی شده و هیچ پیش‌زمینه‌ای نیاز ندارد. تمام مفاهیم گام‌به‌گام آموزش داده می‌شود."
    },
    {
      question: "آیا نیاز به سرمایه اولیه دارم؟",
      answer: "خیر، یکی از مزایای این دوره این است که روش‌هایی آموزش می‌دهد که بدون سرمایه اولیه قابل شروع هستند."
    },
    {
      question: "چقدر زمان برای موفقیت نیاز است؟",
      answer: "با پیروی از آموزش‌ها و انجام تمرین‌های عملی، اکثر دانشجویان ظرف ۳ ماه اولین درآمدهای خود را کسب می‌کنند."
    },
    {
      question: "آیا پشتیبانی در طول دوره وجود دارد؟",
      answer: "بله، شما به گروه اختصاصی دانشجویان دسترسی خواهید داشت و می‌توانید سوالات خود را مطرح کنید."
    },
    {
      question: "کی ثبت‌نام مجدد باز می‌شود؟",
      answer: "طبق شمارش معکوس نمایش داده شده، ۱۱ روز دیگر امکان ثبت‌نام مجدد فراهم خواهد شد."
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
                <Clock className="w-4 h-4 mr-1" />
                فروش متوقف شده
              </Badge>
              
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                شروع
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> بدون مرز</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                گامی به سوی کسب‌وکار بین‌المللی و درآمد دلاری
              </motion.p>

              {/* Disabled CTA */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button 
                  disabled
                  size="lg"
                  className="bg-gray-400 text-white cursor-not-allowed rounded-full px-12 py-6 text-xl font-bold opacity-60"
                >
                  <Clock className="mr-2" size={24} />
                  ظرفیت تکمیل شده
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  فروش فعلاً متوقف شده است
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Countdown Timer */}
        <section className="py-12 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              ⏳ شمارش معکوس آغاز ثبت‌نام
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              ۱۱ روز تا باز شدن مجدد ثبت‌نام باقی‌مانده
            </p>
            <CountdownTimer 
              endDate={countdownEndDate.toISOString()}
              className="mx-auto"
            />
          </div>
        </section>

        {/* Course Description */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">درباره دوره شروع بدون مرز</h2>
              <div className="max-w-4xl mx-auto text-lg text-gray-600 leading-relaxed space-y-4">
                <p>
                  دوره «شروع بدون مرز» یک برنامه جامع آموزشی است که مسیر ورود به بازارهای بین‌المللی را برای دانشجویان، کارمندان، صاحبان کسب‌وکار و علاقه‌مندان به درآمد ارزی روشن می‌سازد.
                </p>
                <p>
                  این دوره مخصوص افرادی است که می‌خواهند کسب‌وکار آنلاین خود را راه‌اندازی کنند یا از طریق مهارت‌های دیجیتال، درآمد دلاری داشته باشند. با ترکیبی از آموزش تخصصی، پشتیبانی گام‌به‌گام، تست شخصیت، تمرین‌های عملی و مشاوره اختصاصی، این برنامه یک انتخاب کامل برای جهش به سمت جهانی شدن است.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Instructor Profile */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">معرفی مدرس</h2>
            </div>
            
            <Card className="max-w-4xl mx-auto shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCheck size={64} className="text-blue-600" />
                  </div>
                  <div className="flex-1 text-center md:text-right">
                    <h3 className="text-3xl font-bold mb-4">رضا رفیعی</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      مدرس و مشاور کسب‌وکار بین‌المللی با سال‌ها تجربه در حوزه درآمدزایی ارزی و آموزش عملی کارآفرینی. 
                      رضا رفیعی با زبان ساده و روش‌های عملی، هزاران نفر را به سمت موفقیت در کسب‌وکار آنلاین راهنمایی کرده است.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <BookOpen className="mr-3 text-blue-600" />
                محتوای دوره
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseContent.map((content, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                        <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <h3 className="text-lg font-semibold">{content}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Gifts Section */}
        <section className="py-16 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center text-orange-800">
                <Gift className="mr-3" />
                هدایای ویژه دوره (کاملاً رایگان)
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gifts.map((gift, index) => (
                <Card key={index} className="bg-white border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <Zap className="text-orange-500 mr-3 mt-1 flex-shrink-0" size={20} />
                      <span className="text-gray-800 font-medium">{gift}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
                <Award className="mr-3 text-purple-600" />
                ویژگی‌های کلیدی دوره
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {keyFeatures.map((feature, index) => (
                <Card key={index} className="text-center shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon size={32} className="text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">رضایت دانشجویان قبلی</h2>
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

        {/* FAQ */}
        <section className="py-16">
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

        {/* Final Message */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">
              آماده برای جهش بزرگ؟
            </h2>
            <p className="text-xl mb-8 opacity-90">
              ۱۱ روز دیگر فرصت ثبت‌نام مجدد فراهم خواهد شد
            </p>
            
            <div className="bg-white/10 p-6 rounded-xl mb-8">
              <CountdownTimer 
                endDate={countdownEndDate.toISOString()}
                className="mx-auto"
              />
            </div>
            
            <Button 
              disabled
              size="lg"
              className="bg-gray-400 text-white cursor-not-allowed rounded-full px-12 py-6 text-xl font-bold opacity-60"
            >
              <Heart className="mr-2" size={24} />
              فروش متوقف شده
            </Button>
            
            <p className="text-sm mt-4 opacity-80">
              🔔 برای اطلاع از باز شدن ثبت‌نام، کانال تلگرام ما را دنبال کنید
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default BoundlessTastePage;
