import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
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
  Ban,
  User,
  TestTube
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

  // Set countdown to ۱۹ خردادماه، ساعت ۱۲ ظهر (June 9th, 12:00 PM - 2025)
  const countdownEndDate = new Date(2025, 5, 9, 12, 0, 0); // Month is 0-indexed

  const courseContent = [
    { title: "نگرش بدون مرز", icon: Globe },
    { title: "دراپ‌شیپینگ", icon: DollarSign },
    { title: "دراپ‌سرویسینگ", icon: Target },
    { title: "فروش فایل و آکادمی آنلاین", icon: BookOpen },
    { title: "بازارهای مالی و زیرساخت‌های بین‌المللی", icon: Brain },
    { title: "جلسه پرسش و پاسخ + مشاوره خصوصی", icon: MessageCircle },
    { title: "تست شخصیت کارآفرین برای تعیین مسیر مناسب", icon: TestTube }
  ];

  const gifts = [
    { title: "ورکشاپ درآمد فوری دلاری", icon: Zap },
    { title: "اصل تک اولویت (برای تمرکز در مسیر هدف)", icon: Target },
    { title: "وبینار بیزینس آمریکایی (۲ جلسه با هدایای ویژه)", icon: Globe },
    { title: "پروژه درآمد غیرفعال (۲ جلسه + هدایای کامل)", icon: DollarSign },
    { title: "پروژه تغییر (۳ جلسه + هدیه)", icon: Heart },
    { title: "پرامپت‌های هوش مصنوعی مخصوص کسب‌وکار", icon: Brain },
    { title: "ده‌ها ابزار و فایل کاربردی برای شروع بیزینس آنلاین", icon: Gift }
  ];

  const features = [
    { title: "تدریس توسط رضا رفیعی با زبان ساده و تجربه عملی", icon: User },
    { title: "همراه با تست شخصیت و تمرین‌های واقعی", icon: TestTube },
    { title: "پشتیبانی اختصاصی + گروه ارتباطی دانشجویان", icon: Users },
    { title: "بدون نیاز به سرمایه اولیه یا تخصص فنی", icon: CheckCircle },
    { title: "دسترسی دائمی به محتوای دوره", icon: Clock }
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
      answer: "طبق شمارش معکوس نمایش داده شده، ۱۹ خردادماه ساعت ۱۲ ظهر ثبت‌نام مجدداً باز خواهد شد. می‌توانید از طریق کانال‌های اطلاع‌رسانی از بازگشایی مطلع شوید."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Enhanced Hero Section - More Colorful and Modern */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          {/* Enhanced Vibrant Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-orange-50 dark:from-blue-950/40 dark:via-purple-950/40 dark:via-pink-950/40 dark:to-orange-950/40"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-400/25 to-orange-400/25 rounded-full blur-3xl animate-pulse animation-delay-400"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse animation-delay-800"></div>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-teal-400/15 to-green-400/15 rounded-full blur-2xl animate-pulse animation-delay-1200"></div>
          </div>
          
          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <Badge className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0 px-8 py-3 text-lg font-medium shadow-2xl transform hover:scale-105 transition-all">
                  <Crown className="w-5 h-5 ml-2" />
                  دوره تخصصی
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                شروع، نقطه آغاز کسب‌وکار جهانی تو
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium leading-relaxed max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                با یک تصمیم ساده، وارد مسیر موفقیت بین‌المللی شو
              </motion.p>

              {/* Course Status Alert - More Subtle */}
              <motion.div 
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-orange-200 dark:border-orange-700 rounded-xl p-6 mb-12 max-w-xl mx-auto shadow-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center ml-3">
                    <Ban className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">دوره در حال حاضر بسته است</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  ظرفیت ثبت‌نام فعلاً تکمیل شده است. برای اطلاع از باز شدن مجدد ثبت‌نام، شمارش معکوس زیر را دنبال کنید.
                </p>
                
                {/* Smaller, More Subtle Button */}
                <Button 
                  disabled
                  size="sm"
                  className="bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed px-4 py-2 text-sm font-medium rounded-lg hover:bg-gradient-to-r hover:from-gray-400 hover:to-gray-500 disabled:opacity-100 shadow-md"
                >
                  <Ban className="ml-2" size={14} />
                  ظرفیت تکمیل
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Enhanced Countdown Timer Section */}
        <section className="py-16 bg-gradient-to-r from-purple-100 via-blue-100 via-pink-100 to-orange-100 dark:from-purple-950/30 dark:via-blue-950/30 dark:via-pink-950/30 dark:to-orange-950/30">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-purple-600 ml-3" />
                <motion.h3 
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  زمان باقی‌مانده تا شروع ثبت‌نام
                </motion.h3>
              </div>
              <p className="text-muted-foreground text-lg font-medium">۱۹ خردادماه، ساعت ۱۲ ظهر</p>
            </div>
            <motion.div 
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-700 rounded-3xl p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
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

        {/* Course Description - Enhanced Colors */}
        <section className="py-20 bg-gradient-to-br from-teal-50/60 to-green-50/60 dark:from-teal-950/20 dark:to-green-950/20">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <Globe className="w-8 h-8 text-teal-600 ml-3" />
              <SectionTitle 
                title="درباره دوره شروع بدون مرز" 
                subtitle="برنامه جامع آموزشی برای ورود به بازارهای بین‌المللی"
              />
            </div>
            
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-teal-50/30 to-blue-50/50 dark:from-gray-900 dark:via-teal-950/20 dark:to-blue-950/20 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center ml-4">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">کسب‌وکار بدون مرز</h3>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    این دوره مخصوص افرادی است که می‌خواهند کسب‌وکار آنلاین خود را راه‌اندازی کنند یا از طریق مهارت‌های دیجیتال، درآمد دلاری داشته باشند. با ترکیبی از آموزش تخصصی، پشتیبانی گام‌به‌گام، تست شخصیت، تمرین‌های عملی و مشاوره اختصاصی، این برنامه یک انتخاب کامل برای جهش به سمت جهانی شدن است.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Course Content */}
        <section className="py-20 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/15 dark:via-purple-950/15 dark:to-pink-950/15">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <BookOpen className="w-8 h-8 text-blue-600 ml-3" />
              <SectionTitle 
                title="محتوای دوره" 
                subtitle="آنچه در این دوره خواهید آموخت"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseContent.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 hover:translate-y-[-4px] group">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <IconComponent size={20} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground leading-relaxed">{item.title}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course Gifts - Enhanced */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <Gift className="w-8 h-8 text-purple-600 ml-3" />
              <SectionTitle 
                title={translations.courseGifts} 
                subtitle="هدایای ویژه همراه با دوره"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gifts.map((gift, index) => {
                const IconComponent = gift.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20 hover:translate-y-[-2px] group">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <IconComponent size={16} className="text-white" />
                          </div>
                          <span className="text-base font-medium text-foreground leading-relaxed">{gift.title}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course Features - Enhanced */}
        <section className="py-20 bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-green-950/10 dark:to-teal-950/10">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <CheckCircle className="w-8 h-8 text-green-600 ml-3" />
              <SectionTitle 
                title={translations.courseFeatures} 
                subtitle="چرا این دوره را انتخاب کنید؟"
              />
            </div>
            
            <div className="space-y-4 max-w-3xl mx-auto">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-4 space-x-reverse bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-green-200 dark:border-green-800 group hover:translate-y-[-2px]"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <IconComponent size={20} className="text-white" />
                    </div>
                    <span className="text-lg font-medium text-foreground leading-relaxed">{feature.title}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <User className="w-8 h-8 text-blue-600 ml-3" />
              <SectionTitle 
                title="معرفی مدرس" 
                subtitle="آشنایی با استاد دوره"
              />
            </div>
            
            <Link to="/instructor/reza-rafiei" className="block">
              <div className="hover:scale-105 transition-transform duration-300">
                <InstructorProfile />
              </div>
            </Link>
          </div>
        </section>

        {/* Testimonials - Enhanced */}
        <section className="py-20 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <Star className="w-8 h-8 text-yellow-600 ml-3" />
              <SectionTitle 
                title="نظرات دانشجویان" 
                subtitle="تجربه واقعی شرکت‌کنندگان در دوره"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white dark:bg-gray-900 hover:translate-y-[-4px] h-full group">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-500 fill-current" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic text-base leading-relaxed">"{testimonial.content}"</p>
                      <div>
                        <h4 className="font-bold text-foreground text-base">{testimonial.name}</h4>
                        <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-background">
          <div className="container max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <MessageCircle className="w-8 h-8 text-blue-600 ml-3" />
              <SectionTitle 
                title={translations.faq} 
                subtitle="پاسخ به سوالات متداول"
              />
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                  <AccordionTrigger className="text-right text-lg font-semibold py-4 hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA - Enhanced */}
        <section className="py-20 bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 text-foreground">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              منتظر بازگشایی ثبت‌نام باشید
            </motion.h2>
            <motion.p 
              className="text-xl mb-12 text-muted-foreground"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ۱۹ خردادماه، ساعت ۱۲ ظهر فرصت ثبت‌نام مجدداً فراهم خواهد شد
            </motion.p>
            
            <motion.div 
              className="flex justify-center items-center gap-4 mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold">به زودی...</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                disabled
                size="sm"
                className="bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed rounded-lg px-6 py-2 text-sm font-medium border-0 hover:bg-gradient-to-r hover:from-gray-400 hover:to-gray-500 disabled:opacity-100 shadow-lg"
              >
                <Ban className="ml-2" size={16} />
                ظرفیت تکمیل
              </Button>
            </motion.div>
            
            <motion.p 
              className="text-base mt-6 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              پشتیبانی ۲۴/۷ • دسترسی مادام‌العمر • گارانتی کیفیت
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
