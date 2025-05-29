
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
    "ورکشاپ درآمد فوری دلاری",
    "اصل تک اولویت (برای تمرکز در مسیر هدف)",
    "وبینار بیزینس آمریکایی (۲ جلسه با هدایای ویژه)",
    "پروژه درآمد غیرفعال (۲ جلسه + هدایای کامل)",
    "پروژه تغییر (۳ جلسه + هدیه)",
    "پرامپت‌های هوش مصنوعی مخصوص کسب‌وکار",
    "ده‌ها ابزار و فایل کاربردی برای شروع بیزینس آنلاین"
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
      <div className="min-h-screen bg-background">
        {/* Hero Section - Clean and Minimal */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          {/* Subtle Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-900/30"></div>
          
          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <Badge className="mb-6 bg-primary/10 text-primary border border-primary/20 px-6 py-2 text-base font-medium">
                  <Crown className="w-4 h-4 mr-2" />
                  دوره تخصصی
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                دوره شروع بدون مرز
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium leading-relaxed max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                نقطه شروع کسب‌وکار جهانی تو با آکادمی رفیعی
              </motion.p>

              {/* Course Status Alert - Minimal Design */}
              <motion.div 
                className="bg-card border border-border rounded-xl p-8 mb-12 max-w-2xl mx-auto shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="flex items-center justify-center mb-6">
                  <Ban className="w-6 h-6 text-destructive mr-3" />
                  <h3 className="text-xl font-semibold text-foreground">دوره در حال حاضر بسته است</h3>
                </div>
                <p className="text-muted-foreground text-base mb-6 leading-relaxed">
                  ظرفیت ثبت‌نام فعلاً تکمیل شده است. برای اطلاع از باز شدن مجدد ثبت‌نام، شمارش معکوس زیر را دنبال کنید.
                </p>
                
                <Button 
                  disabled
                  size="lg"
                  className="bg-muted text-muted-foreground cursor-not-allowed px-8 py-3 text-base font-medium rounded-lg hover:bg-muted disabled:opacity-100"
                >
                  <Ban className="mr-2" size={18} />
                  {translations.courseSoldOut}
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Countdown Timer Section - Clean Design */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <motion.h3 
                className="text-2xl md:text-3xl font-bold text-foreground mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                زمان باقی‌مانده تا شروع ثبت‌نام
              </motion.h3>
              <p className="text-muted-foreground text-lg">فقط ۱۱ روز تا بازگشایی ثبت‌نام باقی مانده</p>
            </div>
            <motion.div 
              className="bg-card border border-border rounded-xl p-8 shadow-sm"
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

        {/* Course Description - Minimal Card Design */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="درباره دوره شروع بدون مرز" 
              subtitle="برنامه جامع آموزشی برای ورود به بازارهای بین‌المللی"
            />
            
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="border-0 shadow-sm bg-card">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                      <Globe className="w-6 h-6 text-primary" />
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

        {/* Course Content - Clean Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="محتوای دوره" 
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
                  <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-card hover:translate-y-[-2px]">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground leading-relaxed">{item}</h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Gifts - Clean List */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title={translations.courseGifts} 
              subtitle="هدایای ویژه همراه با دوره"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gifts.map((gift, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border border-border shadow-sm hover:shadow-md transition-all bg-card hover:translate-y-[-1px]">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Gift size={16} className="text-primary" />
                        </div>
                        <span className="text-base font-medium text-foreground leading-relaxed">{gift}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Features - Minimal Design */}
        <section className="py-20 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title={translations.courseFeatures} 
              subtitle="چرا این دوره را انتخاب کنید؟"
            />
            
            <div className="space-y-4 max-w-3xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-4 space-x-reverse bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-all border border-border"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-primary" />
                  </div>
                  <span className="text-lg font-medium text-foreground leading-relaxed">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="معرفی مدرس" 
              subtitle="آشنایی با استاد دوره"
            />
            
            <InstructorProfile />
          </div>
        </section>

        {/* Testimonials - Clean Cards */}
        <section className="py-20 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="نظرات دانشجویان" 
              subtitle="تجربه واقعی شرکت‌کنندگان در دوره"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-card hover:translate-y-[-2px] h-full">
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
            <SectionTitle 
              title={translations.faq} 
              subtitle="پاسخ به سوالات متداول"
            />
            
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

        {/* Final CTA - Minimal Design */}
        <section className="py-20 bg-muted text-foreground">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6"
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
              ۱۱ روز دیگر فرصت ثبت‌نام مجدداً فراهم خواهد شد
            </motion.p>
            
            <motion.div 
              className="flex justify-center items-center gap-4 mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Clock className="w-8 h-8 text-primary" />
              <span className="text-2xl font-semibold">به زودی...</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                disabled
                size="lg"
                className="bg-muted text-muted-foreground cursor-not-allowed rounded-lg px-12 py-4 text-lg font-medium border border-border hover:bg-muted disabled:opacity-100"
              >
                <Ban className="mr-3" size={20} />
                {translations.courseSoldOut}
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
