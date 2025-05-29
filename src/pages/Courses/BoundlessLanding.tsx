
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
  Globe,
  GraduationCap,
  Award,
  BookOpen,
  MessageCircle
} from "lucide-react";
import IframeModal from "@/components/IframeModal";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import InstructorProfile from "@/components/InstructorProfile";

const BoundlessLanding = () => {
  const [showIframeModal, setShowIframeModal] = useState(false);
  const { translations } = useLanguage();

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
      content: "دوره شروع بدون مرز واقعاً چشم‌انداز من را نسبت به کسب‌وکار بین‌المللی تغییر داد. مفاهیم پیچیده به زبان ساده آموزش داده شد.",
      rating: 5
    },
    {
      name: "سارا احمدی",
      role: "صاحب کسب‌وکار آنلاین",
      content: "بخش دراپ‌شیپینگ و دراپ‌سرویسینگ کاملاً کاربردی بود. الان دارم اولین کسب‌وکار بین‌المللی‌ام رو راه‌اندازی می‌کنم.",
      rating: 5
    },
    {
      name: "محمد کریمی",
      role: "دانشجوی رشته مدیریت",
      content: "تست شخصیت کارآفرین کمکم کرد تا مسیر مناسب خودم رو پیدا کنم. حالا مطمئنم که در مسیر درستی حرکت می‌کنم.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "این دوره برای چه کسانی مناسب است؟",
      answer: "دوره شروع بدون مرز برای دانشجویان، کارمندان، صاحبان کسب‌وکار و همه علاقه‌مندان به درآمد ارزی و کسب‌وکار بین‌المللی طراحی شده است."
    },
    {
      question: "آیا نیاز به سرمایه اولیه دارم؟",
      answer: "خیر، این دوره بدون نیاز به سرمایه اولیه یا تخصص فنی قابل شروع است. تمام روش‌های آموزش داده شده با حداقل سرمایه قابل اجرا هستند."
    },
    {
      question: "چگونه از تست شخصیت کارآفرین استفاده کنم؟",
      answer: "تست شخصیت کارآفرین به شما کمک می‌کند تا نقاط قوت و علایق خود را شناسایی کنید و مناسب‌ترین مسیر کسب‌وکار را انتخاب کنید."
    },
    {
      question: "چه زمانی دوره مجدداً قابل خرید خواهد بود؟",
      answer: "طبق شمارش معکوس نمایش داده شده، ۱۱ روز دیگر ثبت‌نام مجدداً باز خواهد شد. می‌توانید از طریق کانال‌های اطلاع‌رسانی از بازگشایی مطلع شوید."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Hero Section - Modern & Colorful */}
        <section className="py-20 relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-white/20 text-white border-0 backdrop-blur-sm">
                <Crown className="w-4 h-4 mr-1" />
                دوره جامع آموزشی
              </Badge>
              
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {translations.boundlessStartTitle}
              </motion.h1>
              
              <motion.p 
                className="text-xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {translations.boundlessStartDesc}
              </motion.p>

              {/* Sales Status */}
              <motion.div 
                className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl p-6 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white mr-2" />
                  <h3 className="text-xl font-bold text-white">🛑 فروش دوره فعلاً متوقف شده است</h3>
                </div>
                <p className="text-white/90 mb-4">
                  ظرفیت ثبت‌نام فعلاً تکمیل شده. جهت اطلاع از باز شدن مجدد ثبت‌نام، لطفاً شمارش معکوس زیر را دنبال کن 👇
                </p>
                
                <Button 
                  disabled
                  size="lg"
                  className="bg-white/20 text-white cursor-not-allowed px-8 py-4 text-lg font-bold rounded-full backdrop-blur-sm"
                >
                  {translations.courseSoldOut}
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Countdown Timer with Modern Design */}
        <section className="py-12 bg-gradient-to-r from-orange-500 to-red-500">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">⏳ {translations.nextRegistrationDate}</h3>
              <p className="text-white/90 text-lg">11 روز دیگر باقی‌مانده...</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <CountdownTimer 
                endDate={countdownEndDate.toISOString()}
                className="mx-auto"
              />
            </div>
          </div>
        </section>

        {/* Course Description with Colorful Cards */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="درباره دوره شروع بدون مرز" 
              subtitle="برنامه جامع آموزشی برای ورود به بازارهای بین‌المللی"
            />
            
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-8">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    این دوره مخصوص افرادی است که می‌خواهند کسب‌وکار آنلاین خود را راه‌اندازی کنند یا از طریق مهارت‌های دیجیتال، درآمد دلاری داشته باشند. با ترکیبی از آموزش تخصصی، پشتیبانی گام‌به‌گام، تست شخصیت، تمرین‌های عملی و مشاوره اختصاصی، این برنامه یک انتخاب کامل برای جهش به سمت جهانی شدن است.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Course Content with Gradient Cards */}
        <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="📦 محتوای دوره" 
              subtitle="آنچه در این دوره خواهید آموخت"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseContent.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className={`h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${
                    index % 4 === 0 ? 'from-blue-500 to-cyan-500' :
                    index % 4 === 1 ? 'from-purple-500 to-pink-500' :
                    index % 4 === 2 ? 'from-green-500 to-teal-500' :
                    'from-orange-500 to-red-500'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{item}</h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Gifts with Animated Cards */}
        <section className="py-16 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title={`🎁 ${translations.courseGifts}`} 
              subtitle="هدایای ویژه همراه با دوره"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gifts.map((gift, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-all bg-white hover:bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Gift size={20} className="text-green-600" />
                        </div>
                        <span className="text-lg font-medium text-gray-900">{gift}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Features with Modern Design */}
        <section className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title={`🔥 ${translations.courseFeatures}`} 
              subtitle="چرا این دوره را انتخاب کنید؟"
            />
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-4 space-x-reverse bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    index % 3 === 0 ? 'bg-blue-100' :
                    index % 3 === 1 ? 'bg-purple-100' :
                    'bg-green-100'
                  }`}>
                    <CheckCircle size={20} className={
                      index % 3 === 0 ? 'text-blue-600' :
                      index % 3 === 1 ? 'text-purple-600' :
                      'text-green-600'
                    } />
                  </div>
                  <span className="text-lg font-medium text-gray-900">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-16 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="معرفی مدرس" 
              subtitle="آشنایی با استاد دوره"
            />
            
            <InstructorProfile />
          </div>
        </section>

        {/* Testimonials with Colorful Cards */}
        <section className="py-16 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="نظرات دانشجویان" 
              subtitle="تجربه واقعی شرکت‌کنندگان در دوره"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className={`border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${
                  index % 3 === 0 ? 'from-blue-500 to-purple-500' :
                  index % 3 === 1 ? 'from-purple-500 to-pink-500' :
                  'from-green-500 to-blue-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={20} className="text-yellow-300 fill-current" />
                      ))}
                    </div>
                    <p className="text-white/90 mb-4 italic">"{testimonial.content}"</p>
                    <div>
                      <h4 className="font-bold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-white/80">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="container max-w-4xl mx-auto px-4">
            <SectionTitle 
              title={translations.faq} 
              subtitle="پاسخ به سوالات متداول"
            />
            
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

        {/* Final CTA with Gradient Background */}
        <section className="py-20 bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <h2 className="text-4xl font-bold mb-4">
              منتظر بازگشایی ثبت‌نام باشید
            </h2>
            <p className="text-xl mb-8 opacity-90">
              ۱۱ روز دیگر فرصت ثبت‌نام مجدداً فراهم خواهد شد
            </p>
            
            <div className="flex justify-center items-center gap-4 mb-8">
              <Clock className="w-8 h-8" />
              <span className="text-2xl font-bold">به زودی...</span>
            </div>
            
            <Button 
              disabled
              size="lg"
              className="bg-white/20 text-white cursor-not-allowed rounded-full px-12 py-6 text-xl font-bold backdrop-blur-sm"
            >
              <MessageCircle className="mr-2" size={24} />
              {translations.courseSoldOut}
            </Button>
            
            <p className="text-sm mt-4 opacity-80">
              ✅ پشتیبانی ۲۴/۷ • ✅ دسترسی مادام‌العمر • ✅ گارانتی کیفیت
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
