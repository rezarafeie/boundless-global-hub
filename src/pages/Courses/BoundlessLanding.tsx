
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
  MessageCircle,
  Ban
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section - Ultra Modern Design */}
        <section className="relative py-20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full animate-pulse-glow"></div>
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full animate-float-glow"></div>
              <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-300/20 rounded-full animate-float"></div>
            </div>
          </div>
          
          <div className="container max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-6"
              >
                <Badge className="mb-4 bg-white/20 text-white border-0 backdrop-blur-sm px-6 py-2 text-lg">
                  <Crown className="w-5 h-5 mr-2" />
                  دوره پیشرفته و جامع
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                {translations.boundlessStartTitle}
              </motion.h1>
              
              <motion.p 
                className="text-2xl md:text-3xl text-white/95 mb-12 font-semibold"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {translations.boundlessStartDesc}
              </motion.p>

              {/* Course Status Alert */}
              <motion.div 
                className="bg-white/15 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-8 mb-12 max-w-3xl mx-auto shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="flex items-center justify-center mb-6">
                  <Ban className="w-8 h-8 text-red-300 mr-3" />
                  <h3 className="text-2xl font-bold text-white">دوره در حال حاضر بسته است</h3>
                </div>
                <p className="text-white/90 text-lg mb-6 leading-relaxed">
                  ظرفیت ثبت‌نام فعلاً تکمیل شده است. برای اطلاع از باز شدن مجدد ثبت‌نام، شمارش معکوس زیر را دنبال کنید.
                </p>
                
                <Button 
                  disabled
                  size="lg"
                  className="bg-red-500/80 text-white cursor-not-allowed px-10 py-4 text-xl font-bold rounded-xl backdrop-blur-sm hover:bg-red-500/80 disabled:opacity-100"
                >
                  <Ban className="mr-3" size={24} />
                  {translations.courseSoldOut}
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Countdown Timer Section - Enhanced Design */}
        <section className="py-16 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container max-w-5xl mx-auto px-4 relative z-10">
            <div className="text-center mb-8">
              <motion.h3 
                className="text-4xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                ⏰ {translations.nextRegistrationDate}
              </motion.h3>
              <p className="text-white/90 text-xl">فقط ۱۱ روز تا بازگشایی ثبت‌نام باقی مانده...</p>
            </div>
            <motion.div 
              className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <CountdownTimer 
                endDate={countdownEndDate.toISOString()}
                className="mx-auto"
              />
            </motion.div>
          </div>
        </section>

        {/* Course Description - Modern Card Design */}
        <section className="py-20 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="✨ درباره دوره شروع بدون مرز" 
              subtitle="برنامه جامع آموزشی برای ورود به بازارهای بین‌المللی"
            />
            
            <motion.div 
              className="max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
                <CardContent className="p-12">
                  <div className="flex items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-6">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">کسب‌وکار بدون مرز</h3>
                  </div>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    این دوره مخصوص افرادی است که می‌خواهند کسب‌وکار آنلاین خود را راه‌اندازی کنند یا از طریق مهارت‌های دیجیتال، درآمد دلاری داشته باشند. با ترکیبی از آموزش تخصصی، پشتیبانی گام‌به‌گام، تست شخصیت، تمرین‌های عملی و مشاوره اختصاصی، این برنامه یک انتخاب کامل برای جهش به سمت جهانی شدن است.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Course Content - Colorful Grid */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="📚 محتوای دوره" 
              subtitle="آنچه در این دوره خواهید آموخت"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courseContent.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <Card className={`h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br ${
                    index % 4 === 0 ? 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' :
                    index % 4 === 1 ? 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
                    index % 4 === 2 ? 'from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600' :
                    'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                  } group-hover:scale-105`}>
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-6 space-x-reverse">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                          <span className="text-white font-bold text-xl">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white leading-relaxed">{item}</h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Gifts - Animated List */}
        <section className="py-20 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50">
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
                  className="group"
                >
                  <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-all bg-white hover:bg-green-50 group-hover:scale-105 group-hover:border-green-300">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-all">
                          <Gift size={24} className="text-green-600" />
                        </div>
                        <span className="text-lg font-semibold text-gray-900 leading-relaxed">{gift}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Features - Clean Design */}
        <section className="py-20 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title={`⚡ ${translations.courseFeatures}`} 
              subtitle="چرا این دوره را انتخاب کنید؟"
            />
            
            <div className="space-y-6 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-6 space-x-reverse bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-md hover:shadow-lg transition-all group hover:from-blue-100 hover:to-indigo-100"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    index % 3 === 0 ? 'bg-blue-500 group-hover:bg-blue-600' :
                    index % 3 === 1 ? 'bg-purple-500 group-hover:bg-purple-600' :
                    'bg-green-500 group-hover:bg-green-600'
                  } transition-all`}>
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-900 leading-relaxed">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-slate-100">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="🎓 معرفی مدرس" 
              subtitle="آشنایی با استاد دوره"
            />
            
            <InstructorProfile />
          </div>
        </section>

        {/* Testimonials - Enhanced Cards */}
        <section className="py-20 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50">
          <div className="container max-w-6xl mx-auto px-4">
            <SectionTitle 
              title="💬 نظرات دانشجویان" 
              subtitle="تجربه واقعی شرکت‌کنندگان در دوره"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all bg-gradient-to-br hover:scale-105 ${
                    index % 3 === 0 ? 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' :
                    index % 3 === 1 ? 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
                    'from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                  }`}>
                    <CardContent className="p-8">
                      <div className="flex items-center mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={24} className="text-yellow-300 fill-current" />
                        ))}
                      </div>
                      <p className="text-white/95 mb-6 italic text-lg leading-relaxed">"{testimonial.content}"</p>
                      <div>
                        <h4 className="font-bold text-white text-xl">{testimonial.name}</h4>
                        <p className="text-white/80 text-lg">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container max-w-4xl mx-auto px-4">
            <SectionTitle 
              title={translations.faq} 
              subtitle="پاسخ به سوالات متداول"
            />
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b-2 border-gray-100">
                  <AccordionTrigger className="text-right text-xl font-bold py-6 hover:text-blue-600 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-lg leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA - Premium Design */}
        <section className="py-24 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full animate-pulse-glow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300/10 rounded-full animate-float-glow"></div>
          </div>
          
          <div className="container max-w-5xl mx-auto text-center px-4 relative z-10">
            <motion.h2 
              className="text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              منتظر بازگشایی ثبت‌نام باشید
            </motion.h2>
            <motion.p 
              className="text-2xl mb-12 opacity-90"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ۱۱ روز دیگر فرصت ثبت‌نام مجدداً فراهم خواهد شد
            </motion.p>
            
            <motion.div 
              className="flex justify-center items-center gap-6 mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Clock className="w-12 h-12 text-orange-400" />
              <span className="text-3xl font-bold">به زودی...</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                disabled
                size="lg"
                className="bg-white/20 text-white cursor-not-allowed rounded-2xl px-16 py-6 text-2xl font-bold backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 disabled:opacity-100"
              >
                <Ban className="mr-4" size={28} />
                {translations.courseSoldOut}
              </Button>
            </motion.div>
            
            <motion.p 
              className="text-lg mt-8 opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              ✅ پشتیبانی ۲۴/۷ • ✅ دسترسی مادام‌العمر • ✅ گارانتی کیفیت
            </motion.p>
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
