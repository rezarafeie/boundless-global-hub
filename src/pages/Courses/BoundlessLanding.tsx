import React, { useState, useEffect, useMemo } from "react";
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
  User,
  TestTube,
  Play
} from "lucide-react";
import IframeModal from "@/components/IframeModal";
import EnhancedCountdownTimer from "@/components/EnhancedCountdownTimer";
import LiveEnrollmentCounter from "@/components/LiveEnrollmentCounter";
import UserCountdownTimer from "@/components/UserCountdownTimer";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import InstructorProfile from "@/components/InstructorProfile";
import AparatPlayer from "@/components/AparatPlayer";
import { useCourseSettings } from "@/hooks/useCourseSettings";

const BoundlessLanding = () => {
  const [showIframeModal, setShowIframeModal] = useState(false);
  const [currentHeadline, setCurrentHeadline] = useState({ title: "", subtitle: "" });
  const [isLoaded, setIsLoaded] = useState(false);
  const { translations } = useLanguage();
  const { courseSettings, loading: courseSettingsLoading } = useCourseSettings('boundless');
  
  // Memoize the enrollment URL
  const enrollmentUrl = useMemo(() => {
    if (courseSettingsLoading) {
      return 'https://auth.rafiei.co/?add-to-cart=5311'; // Default while loading
    }
    
    if (courseSettings?.use_landing_page_merge) {
      return '/enroll?course=boundless';
    }
    
    return 'https://auth.rafiei.co/?add-to-cart=5311';
  }, [courseSettings, courseSettingsLoading]);

  // Set countdown to ۱۷ ژوئن، ساعت ۱۲ ظهر (June 17th, 12:00 PM - 2025)
  const countdownEndDate = new Date(2025, 5, 17, 12, 0, 0);

  const motivationalHeadlines = [
    {
      title: "شروع کن، حتی اگر مطمئن نیستی!",
      subtitle: "در آکادمی رفیعی، هیچ چیزی غیرممکن نیست."
    },
    {
      title: "آینده‌ات را خودت بساز!",
      subtitle: "با یک تصمیم درست، زندگی‌ات را متحول کن."
    },
    {
      title: "فرصت طلایی در انتظار توست!",
      subtitle: "کسب‌وکار جهانی فقط یک کلیک فاصله دارد."
    },
    {
      title: "از صفر تا قله موفقیت!",
      subtitle: "مسیر درآمد ارزی با ما شروع می‌شود."
    },
    {
      title: "حالا وقت عمل است!",
      subtitle: "دیگر منتظر نمان، کسب‌وکار بین‌المللی‌ات را شروع کن."
    },
    {
      title: "رویاهایت را واقعی کن!",
      subtitle: "با علم و تجربه، هر هدفی قابل دستیابی است."
    },
    {
      title: "استعدادت را کشف کن!",
      subtitle: "پتانسیال پنهان‌ات منتظر آزاد شدن است."
    },
    {
      title: "تغییر از همین امروز شروع شود!",
      subtitle: "یک قدم کوچک، تفاوتی بزرگ خواهد ساخت."
    },
    {
      title: "مرزها را بشکن!",
      subtitle: "جهان بدون مرز در انتظار کارآفرینان جوان است."
    },
    {
      title: "موفقیت در دستان توست!",
      subtitle: "فقط باید جرات شروع کردن را داشته باشی."
    }
  ];

  useEffect(() => {
    // Wait for page to load, then set random headline
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * motivationalHeadlines.length);
      setCurrentHeadline(motivationalHeadlines[randomIndex]);
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const courseContent = [
    { title: "نگرش بدون مرز", icon: Globe },
    { title: "دراپ‌شیپینگ", icon: DollarSign },
    { title: "دراپ‌سرویسینگ", icon: Target },
    { title: "فروش فایل و آکادمی آنلاین", icon: BookOpen },
    { title: "بازارهای مالی و زیرساخت‌های بین‌المللی", icon: Brain },
    { title: "Lovable - ابزار توسعه هوش مصنوعی", icon: Brain },
    { title: "Google AI Studio - استودیو هوش مصنوعی گوگل", icon: Brain },
    { title: "Canva AI - طراحی هوشمند و خلاقانه", icon: Brain },
    { title: "Suno AI - تولید موسیقی و صدا", icon: Brain },
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

  const realTestimonials = [
    {
      name: "محمدرضا احمدی",
      role: "کارآفرین دیجیتال، تهران",
      content: "دوره شروع بدون مرز واقعاً نقطه عطف زندگی من بود. از یک کارمند معمولی به صاحب کسب‌وکار آنلاین با درآمد ماهانه ۱۰ میلیون تومان تبدیل شدم. آموزش‌های استاد رفیعی خیلی کاربردی و قابل اجرا بودند.",
      rating: 5,
      achievement: "درآمد ماهانه: ۱۰ میلیون تومان"
    },
    {
      name: "فاطمه کریمی", 
      role: "مادر خانه‌دار و کارآفرین، اصفهان",
      content: "من که هیچ تجربه‌ای در کسب‌وکار نداشتم، با این دوره تونستم فروشگاه آنلاین خودم را راه‌اندازی کنم. الان بعد از ۶ ماه، علاوه بر کار خونه، درآمد مستقلی دارم و خیلی راضی‌ام.",
      rating: 5,
      achievement: "راه‌اندازی فروشگاه آنلاین موفق"
    },
    {
      name: "امیرحسین نوری",
      role: "دانشجوی رشته کامپیوتر، شیراز", 
      content: "بخش دراپ‌شیپینگ و بازاریابی دیجیتال فوق‌العاده بود. من که دانشجو بودم و نیاز به درآمد داشتم، با تکنیک‌هایی که یاد گرفتم تونستم ماهانه ۵ میلیون تومان درآمدزایی کنم. ممنونم استاد رفیعی!",
      rating: 5,
      achievement: "درآمد دانشجویی: ۵ میلیون تومان"
    },
    {
      name: "مریم صادقی",
      role: "معلم بازنشسته، مشهد",
      content: "در ۵۸ سالگی فکر نمی‌کردم بتونم کسب‌وکار آنلاین راه‌اندازی کنم. ولی با راهنمایی‌های قدم به قدم این دوره، الان صاحب یک کانال فروش محصولات محلی هستم و درآمد خوبی دارم.",
      rating: 5,
      achievement: "شروع موفق در ۵۸ سالگی"
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
      answer: "طبق شمارش معکوس نمایش داده شده، ۱۷ ژوئن ساعت ۱۲ ظهر ثبت‌نام مجدداً باز خواهد شد. می‌توانید از طریق کانال‌های اطلاع‌رسانی از بازگشایی مطلع شوید."
    }
  ];

  const handleEnrollClick = () => {
    if (enrollmentUrl.startsWith('/')) {
      // Internal URL - navigate directly
      window.location.href = enrollmentUrl;
    } else {
      // External URL - open in new tab
      window.open(enrollmentUrl, '_blank');
    }
  };

  const handleStudentLoginClick = () => {
    window.open('https://academy.rafiei.co/access/?course=boundless', '_blank');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Enhanced Hero Section with Rotating Headlines */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          {/* Enhanced Vibrant Background with Stronger Glow */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-orange-50 dark:from-blue-950/40 dark:via-purple-950/40 dark:via-pink-950/40 dark:to-orange-950/40"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/40 to-purple-500/40 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-400/35 to-orange-400/35 rounded-full blur-3xl animate-pulse animation-delay-400"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse animation-delay-800"></div>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-teal-400/25 to-green-400/25 rounded-full blur-2xl animate-pulse animation-delay-1200"></div>
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
              
              {/* Rotating Headlines */}
              {isLoaded && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                >
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                    {currentHeadline.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium leading-relaxed max-w-4xl mx-auto">
                    {currentHeadline.subtitle}
                  </p>
                </motion.div>
              )}

              <motion.p 
                className="text-lg md:text-xl text-muted-foreground mb-12 font-medium leading-relaxed max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                دوره شروع بدون مرز: بنیان علمی و استراتژیک برای ورود حرفه‌ای به اقتصاد دیجیتال جهانی
              </motion.p>

              {/* User Countdown Timer */}
              <motion.div 
                className="mb-8 max-w-sm mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <UserCountdownTimer />
              </motion.div>

              {/* Live Enrollment Counter - Updated to 3385 */}
              <motion.div 
                className="mb-12 max-w-sm mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <LiveEnrollmentCounter 
                  initialCount={3385} 
                  courseName="شروع بدون مرز"
                />
              </motion.div>

              {/* Course Registration Status - Re-enabled */}
              <motion.div 
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-xl p-6 mb-12 max-w-xl mx-auto shadow-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center ml-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">ثبت‌نام فعال</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  فرصت استثنایی برای عضویت در دوره تخصصی شروع بدون مرز مجدداً فراهم شده است. با بهره‌گیری از این موقعیت طلایی، مسیر حرفه‌ای خود را در عرصه کسب‌وکار بین‌المللی آغاز نمایید.
                </p>
                
                <Button 
                  onClick={handleEnrollClick}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 text-lg font-medium rounded-lg border-0 hover:from-green-600 hover:to-emerald-600 transition-all mb-3 w-full"
                >
                  <CheckCircle className="ml-2" size={20} />
                  ثبت‌نام در دوره
                </Button>

                {/* Small Student Login Button */}
                <div className="mt-3">
                  <Button 
                    onClick={handleStudentLoginClick}
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1 h-7 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
                  >
                    دانشجوی دوره هستید؟ وارد شوید
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Course Introduction Video Section */}
        <section className="py-16 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center ml-3">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">معرفی دوره شروع بدون مرز</h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                در این ویدیو معرفی جامع، با اهداف استراتژیک، محتوای تخصصی و متدولوژی آموزشی دوره شروع بدون مرز به طور کامل آشنا شوید
              </p>
            </motion.div>

            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">ویدیو معرفی دوره</h3>
                    <p className="text-indigo-100">آشنایی کامل با دوره شروع بدون مرز</p>
                  </div>
                  <div className="aspect-video w-full">
                    <AparatPlayer videoHash="c47mjrd" />
                  </div>
                </CardContent>
              </Card>
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
                  این دوره تخصصی و جامع ویژه کارآفرینان، فریلنسرها و تمامی متخصصانی طراحی شده است که قصد دارند با بهره‌گیری از تکنولوژی‌های نوین و استراتژی‌های علمی، کسب‌وکار دیجیتال خود را در عرصه بین‌المللی راه‌اندازی نمایند. این برنامه آموزشی با ارائه محتوای تخصصی مبتنی بر تجربیات موفق، پشتیبانی حرفه‌ای، ارزیابی شخصیتی دقیق، تمرینات کاربردی و مشاورات تخصصی، بهترین مسیر را برای دستیابی به موفقیت در اقتصاد دیجیتال جهانی فراهم می‌آورد. این دوره علاوه بر آموزش ابزارهای پیشرفته هوش مصنوعی نظیر Lovable، Google AI Studio، Canva AI و Suno AI، راهکارهای عملی و استراتژیک برای کسب درآمد پایدار و قابل توجه ارائه می‌دهد.
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

        {/* Enhanced Student Testimonials with Video */}
        <section className="py-20 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <Star className="w-8 h-8 text-yellow-600 ml-3" />
              <SectionTitle 
                title="نظرات و تجربیات دانشجویان" 
                subtitle="داستان‌های موفقیت واقعی فارغ‌التحصیلان دوره"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Video Testimonials */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="order-2 lg:order-1"
              >
                <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
                  <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6">
                    <CardTitle className="flex items-center text-xl">
                      <Play className="w-6 h-6 ml-3" />
                      ویدیو نظرات دانشجویان
                    </CardTitle>
                    <p className="text-yellow-100 mt-2">
                      تجربیات واقعی دانشجویان در قالب ویدیو
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <AparatPlayer videoHash="ezi0j4r" />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Written Testimonials */}
              <div className="order-1 lg:order-2 space-y-6">
                {realTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white dark:bg-gray-900 hover:translate-y-[-2px] group">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} size={16} className="text-yellow-500 fill-current" />
                          ))}
                          <Badge variant="outline" className="mr-3 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                            {testimonial.achievement}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-4 italic text-base leading-relaxed">"{testimonial.content}"</p>
                        <div className="border-t pt-4">
                          <h4 className="font-bold text-foreground text-base">{testimonial.name}</h4>
                          <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
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

        {/* Final CTA - Updated for Registration Active */}
        <section className="py-20 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-950/20 dark:to-teal-950/20 text-foreground">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              همین الان ثبت‌نام کنید
            </motion.h2>
            <motion.p 
              className="text-xl mb-12 text-muted-foreground"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              این فرصت استثنایی و محدود برای ورود به عرصه کسب‌وکار بین‌المللی و کسب تخصص در تکنولوژی‌های پیشرفته را از دست ندهید
            </motion.p>
            
            <motion.div 
              className="flex justify-center items-center gap-4 mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold">ثبت‌نام فعال است</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-3"
            >
              <Button 
                onClick={handleEnrollClick}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg px-8 py-3 text-lg font-medium border-0"
              >
                <CheckCircle className="ml-2" size={20} />
                ثبت‌نام در دوره شروع بدون مرز
              </Button>

              {/* Small Student Login Button */}
              <div className="mt-4">
                <Button 
                  onClick={handleStudentLoginClick}
                  variant="outline"
                  size="sm"
                  className="text-sm px-4 py-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
                >
                  دانشجوی دوره هستید؟ وارد شوید
                </Button>
              </div>
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

      {/* Sticky Registration Button */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto">
        <Button 
          onClick={handleEnrollClick}
          size="lg"
          className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 text-base font-medium rounded-lg border-0 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
        >
          <CheckCircle className="ml-2" size={18} />
          ثبت‌نام در دوره
        </Button>
      </div>

      {/* Purchase Modal */}
      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title="ثبت‌نام در دوره شروع بدون مرز"
        url="https://auth.rafiei.co/?add-to-cart=144"
      />

      <style>
        {`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.15);
          }
        }
        
        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
          }
          25% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-5px) translateX(30px);
            opacity: 0.6;
          }
          75% {
            transform: translateY(25px) translateX(15px);
            opacity: 0.8;
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          33% {
            transform: translateY(-15px) translateX(25px);
            opacity: 0.7;
          }
          66% {
            transform: translateY(20px) translateX(-10px);
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 6s infinite ease-in-out;
        }
        
        .animate-float-fast {
          animation: float-fast 12s infinite ease-in-out;
        }
        
        .animate-float-slow {
          animation: float-slow 18s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-800 {
          animation-delay: 800ms;
        }
        
        .animation-delay-1200 {
          animation-delay: 1200ms;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(30px);
        }
        
        .glow-circle-1 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(147,112,219,0.45) 0%, rgba(147,112,219,0) 70%);
          top: -150px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(65,105,225,0.4) 0%, rgba(65,105,225,0) 70%);
          bottom: -180px;
          left: 10%;
        }
        
        .glow-circle-3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(123,104,238,0.4) 0%, rgba(123,104,238,0) 70%);
          top: 30%;
          left: 25%;
        }
        
        .glow-circle-4 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(72,209,204,0.35) 0%, rgba(72,209,204,0) 70%);
          top: 40%;
          right: 20%;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default BoundlessLanding;
