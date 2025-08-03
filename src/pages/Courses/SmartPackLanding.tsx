import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  Mic, 
  FileText, 
  Lightbulb,
  Cog,
  Gift,
  TrendingUp,
  Users,
  Heart,
  DollarSign,
  Zap,
  CheckCircle,
  Star,
  Award,
  Clock,
  Shield,
  Download,
  Play,
  Target,
  Rocket,
  Globe,
  ChevronRight,
  ChevronDown,
  Video,
  HeadphonesIcon,
  MessageCircle,
  ArrowRight,
  Briefcase,
  PiggyBank,
  Smartphone,
  Monitor,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import IframeModal from "@/components/IframeModal";
import MobileStickyButton from "@/components/MobileStickyButton";
import CountdownTimer from "@/components/CountdownTimer";
import SectionTitle from "@/components/SectionTitle";

const SmartPackLanding = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Set countdown target for 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const endDateString = targetDate.toISOString();

  const handlePurchaseClick = () => {
    setIsModalOpen(true);
  };

  const scrollToCheckout = () => {
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) {
      checkoutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Course stats
  const stats = [
    { number: "5,000+", label: "دانشجوی موفق", icon: Users },
    { number: "97%", label: "رضایت کامل", icon: Star },
    { number: "24/7", label: "پشتیبانی", icon: HeadphonesIcon },
    { number: "۶ ماه", label: "به‌روزرسانی رایگان", icon: Gift }
  ];

  // Course curriculum with business and AI income focus
  const curriculum = [
    {
      title: "مبانی کسب‌وکار با هوش مصنوعی",
      description: "شناسایی فرصت‌های درآمدزایی و راه‌اندازی کسب‌وکار هوشمند",
      icon: Briefcase,
      modules: [
        "تحلیل بازار و شناسایی فرصت‌های طلایی",
        "مدل‌های کسب‌وکار مبتنی بر AI",
        "برنامه‌ریزی مالی و پیش‌بینی درآمد",
        "استراتژی‌های رقابتی در دنیای دیجیتال"
      ]
    },
    {
      title: "درآمدزایی با ابزارهای هوش مصنوعی",
      description: "تکنیک‌های عملی برای تولید درآمد پایدار با AI",
      icon: PiggyBank,
      modules: [
        "فروش محتوا و خدمات دیجیتال",
        "اتوماسیون فرآیندهای درآمدزا",
        "ساخت محصولات هوشمند قابل فروش",
        "بازاریابی و فروش اتوماتیک"
      ]
    },
    {
      title: "ابزارهای حرفه‌ای AI برای کسب‌وکار",
      description: "تسلط بر ابزارهای پیشرفته و کاربردی",
      icon: Cog,
      modules: [
        "ChatGPT، Claude و Gemini برای کسب‌وکار",
        "ابزارهای تولید محتوا و تصویر",
        "پلتفرم‌های اتوماسیون و یکپارچه‌سازی",
        "تحلیل داده و گزارش‌گیری هوشمند"
      ]
    },
    {
      title: "مارکتینگ و فروش هوشمند",
      description: "استراتژی‌های نوین برای جذب مشتری و افزایش فروش",
      icon: TrendingUp,
      modules: [
        "تولید محتوای جذاب با AI",
        "تبلیغات هدفمند و بهینه‌سازی تبدیل",
        "CRM هوشمند و مدیریت ارتباط با مشتری",
        "تحلیل رفتار مصرف‌کننده"
      ]
    },
    {
      title: "مدیریت مالی و سرمایه‌گذاری هوشمند",
      description: "راهکارهای علمی برای رشد و نگهداری سرمایه",
      icon: DollarSign,
      modules: [
        "تحلیل ریسک و فرصت‌های سرمایه‌گذاری",
        "پرتفولیو منطقی و متنوع‌سازی",
        "استراتژی‌های درآمد غیرفعال",
        "مدیریت جریان نقدی کسب‌وکار"
      ]
    },
    {
      title: "اتوماسیون و مقیاس‌پذیری",
      description: "ساخت سیستم‌هایی که بدون حضور شما کار کنند",
      icon: Rocket,
      modules: [
        "طراحی workflow های اتوماتیک",
        "یکپارچه‌سازی سیستم‌ها و API ها",
        "مانیتورینگ و بهینه‌سازی عملکرد",
        "مقیاس‌پذیری و گسترش کسب‌وکار"
      ]
    }
  ];

  // Enhanced testimonials with real results
  const testimonials = [
    {
      name: "احمد محمدی",
      role: "مشاور مالی",
      image: "/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png",
      text: "با استفاده از تکنیک‌های این دوره، درآمد ماهانه‌ام از ۵ میلیون به ۱۵ میلیون تومان رسید",
      result: "۳۰۰% افزایش درآمد"
    },
    {
      name: "فاطمه کریمی", 
      role: "بنیانگذار استارتاپ",
      image: "/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png",
      text: "اتوماسیون‌هایی که یاد گرفتم، ۸۰٪ وقتم را آزاد کرد و درآمدم را دو برابر کرد",
      result: "۸۰% کاهش وقت کاری"
    },
    {
      name: "علی رضایی",
      role: "مدیر بازاریابی دیجیتال", 
      image: "/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png",
      text: "فقط در ۳ ماه توانستم یک کسب‌وکار کاملاً اتوماتیک راه‌اندازی کنم",
      result: "کسب‌وکار اتوماتیک"
    }
  ];

  // Course features
  const courseFeatures = [
    {
      icon: Video,
      title: "۱۲+ ساعت ویدیو آموزشی",
      description: "محتوای عمیق و کاربردی با کیفیت ۴K"
    },
    {
      icon: FileText,
      title: "کتابچه‌های جامع و چک‌لیست‌ها",
      description: "راهنماهای گام‌به‌گام قابل چاپ و دانلود"
    },
    {
      icon: Brain,
      title: "۱۰۰+ پرامپت حرفه‌ای",
      description: "پرامپت‌های آماده برای کسب‌وکار و درآمدزایی"
    },
    {
      icon: Cog,
      title: "ابزارهای اتوماسیون",
      description: "دسترسی به ابزارها و فایل‌های اتوماسیون"
    },
    {
      icon: Users,
      title: "انجمن اختصاصی دانشجویان",
      description: "شبکه‌سازی و تبادل تجربه با سایر فراگیران"
    },
    {
      icon: HeadphonesIcon,
      title: "پشتیبانی مادام‌العمر",
      description: "پاسخ‌گویی سریع توسط تیم متخصص"
    }
  ];

  // Pack contents 
  const packContents = [
    {
      icon: Video,
      title: "دوره ویدیویی جامع",
      description: "۱۲+ ساعت آموزش تخصصی کسب‌وکار با AI"
    },
    {
      icon: FileText,
      title: "کتابچه راهنمای عملی",
      description: "راهنمای قدم‌به‌قدم پیاده‌سازی استراتژی‌ها"
    },
    {
      icon: Brain,
      title: "مجموعه پرامپت‌های طلایی",
      description: "۱۰۰+ پرامپت آماده برای درآمدزایی"
    },
    {
      icon: Cog,
      title: "ابزارهای اتوماسیون",
      description: "فایل‌ها و تمپلیت‌های آماده اتوماسیون"
    },
    {
      icon: Monitor,
      title: "دسترسی به پلتفرم آنلاین",
      description: "پنل اختصاصی با امکانات ویژه"
    },
    {
      icon: Gift,
      title: "بونوس‌های ارزشمند",
      description: "هدایای ویژه و محتوای اضافی"
    }
  ];

  // Enhanced bonuses
  const bonuses = [
    {
      icon: Sparkles,
      title: "وبینار زنده ماهانه",
      description: "جلسات Q&A و بررسی کیس‌های جدید"
    },
    {
      icon: BookOpen,
      title: "کتاب الکترونیکی \"رازهای درآمد با AI\"",
      description: "راهنمای ۱۰۰ صفحه‌ای تکنیک‌های پیشرفته"
    },
    {
      icon: Target,
      title: "تمپلیت کسب‌وکار آماده",
      description: "۱۰ مدل کسب‌وکار تست‌شده و سودآور"
    },
    {
      icon: Smartphone,
      title: "اپلیکیشن موبایل اختصاصی",
      description: "دسترسی آسان از موبایل و تبلت"
    }
  ];

  // AI Tools featured
  const aiTools = [
    { name: "ChatGPT Pro", use: "تولید محتوا و پاسخ‌گویی هوشمند", category: "محتوا" },
    { name: "Midjourney", use: "طراحی تصاویر حرفه‌ای", category: "طراحی" },
    { name: "Copy.ai", use: "تولید متن تبلیغاتی", category: "بازاریابی" },
    { name: "Zapier", use: "اتوماسیون گردش کار", category: "اتوماسیون" },
    { name: "Notion AI", use: "مدیریت پروژه هوشمند", category: "مدیریت" },
    { name: "Canva AI", use: "طراحی گرافیک سریع", category: "طراحی" },
    { name: "Claude", use: "تحلیل و بررسی اسناد", category: "تحلیل" },
    { name: "Make.com", use: "اتوماسیون پیشرفته", category: "اتوماسیون" },
    { name: "Loom AI", use: "ضبط و ویرایش ویدیو", category: "محتوا" }
  ];

  // Expected results
  const expectedResults = [
    { icon: DollarSign, text: "افزایش درآمد ۲۰۰% تا ۵۰۰%" },
    { icon: Clock, text: "صرفه‌جویی ۵۰% در زمان کاری" },
    { icon: Rocket, text: "راه‌اندازی کسب‌وکار اتوماتیک" },
    { icon: TrendingUp, text: "ایجاد منابع درآمد متنوع" },
    { icon: Brain, text: "تسلط بر ۲۰+ ابزار AI" },
    { icon: Globe, text: "دسترسی به بازارهای بین‌المللی" }
  ];

  // FAQ
  const faqs = [
    {
      id: "suitable",
      question: "آیا این دوره برای مبتدیان مناسب است؟",
      answer: "بله، دوره از صفر طراحی شده و نیازی به پیش‌زمینه ندارید. همه مفاهیم به زبان ساده توضیح داده می‌شود."
    },
    {
      id: "time",
      question: "چقدر زمان نیاز است تا نتیجه بگیرم؟",
      answer: "اکثر دانشجویان از هفته اول شروع به کسب درآمد می‌کنند. در عرض ۳ ماه می‌توانید یک کسب‌وکار مستقل راه‌اندازی کنید."
    },
    {
      id: "support",
      question: "چه نوع پشتیبانی دریافت می‌کنم؟",
      answer: "پشتیبانی کامل از طریق تلگرام، ایمیل و جلسات آنلاین گروهی. همچنین دسترسی به انجمن اختصاصی دانشجویان."
    },
    {
      id: "tools",
      question: "آیا باید ابزارهای گران‌قیمت بخرم؟",
      answer: "خیر، اکثر ابزارهای معرفی‌شده رایگان هستند یا نسخه رایگان قدرتمندی دارند. برای ابزارهای پولی جایگزین‌های رایگان معرفی می‌شود."
    },
    {
      id: "update",
      question: "آیا محتوا به‌روزرسانی می‌شود؟",
      answer: "بله، دوره به‌طور مستمر به‌روزرسانی می‌شود و دسترسی مادام‌العمر دارید. تمام آپدیت‌ها رایگان است."
    }
  ];

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-background/95 to-primary/5 pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        
        <div className="container relative z-10 max-w-6xl mx-auto px-6">
          <motion.div 
            className="text-center" 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
          >
            {/* Trust Badge */}
            <motion.div className="flex justify-center mb-6" variants={itemVariants}>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-3 text-base font-medium">
                <Star className="w-4 h-4 ml-2 fill-current" />
                بیش از ۵ هزار دانشجوی موفق
              </Badge>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight" 
              variants={itemVariants}
            >
              پک هوشمند
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                کسب‌وکار با AI
              </span>
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-primary font-semibold mb-4" 
              variants={itemVariants}
            >
              Smart Business with AI Pack
            </motion.p>

            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed" 
              variants={itemVariants}
            >
              راهنمای جامع ساخت کسب‌وکار درآمدزا با هوش مصنوعی - از صفر تا تولید درآمد ماهانه چندین میلیون تومان
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="mb-8">
              <Button 
                onClick={scrollToCheckout}
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-6 h-6 ml-3" />
                شروع کسب‌وکار هوشمند
                <ChevronRight className="w-6 h-6 mr-3" />
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                ✨ دسترسی فوری + ضمانت ۳۰ روزه بازگشت وجه
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12" 
              variants={itemVariants}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-foreground">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="bg-destructive/5 py-8 border-y border-destructive/20">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-destructive mb-2">
              ⏰ پیشنهاد ویژه محدود
            </h3>
            <p className="text-muted-foreground">
              تخفیف ۴۰٪ و دریافت بونوس‌های ارزشمند تا:
            </p>
          </div>
          <CountdownTimer endDate={endDateString} />
        </div>
      </section>

      {/* Course Curriculum */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="سرفصل‌های دوره"
            subtitle="برنامه جامع و عملی برای راه‌اندازی کسب‌وکار سودآور با هوش مصنوعی"
            align="center"
            isCentered
          />

          <div className="space-y-8">
            {curriculum.map((section, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                        <section.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {section.title}
                        </h3>
                        <p className="text-muted-foreground mb-6 text-lg">
                          {section.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {section.modules.map((module, moduleIndex) => (
                            <div key={moduleIndex} className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                              <span className="text-foreground">{module}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-16 bg-muted/30" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="شاهدان موفقیت"
            subtitle="نتایج واقعی دانشجویانی که زندگی‌شان با این دوره تغییر کرده"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full bg-background border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover ml-4"
                      />
                      <div>
                        <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <Badge className="mt-2 bg-success/10 text-success border-success/20 text-xs">
                          {testimonial.result}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pack Contents */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="محتوای پک هوشمند"
            subtitle="همه چیزی که برای راه‌اندازی کسب‌وکار موفق نیاز دارید"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packContents.map((content, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <content.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      {content.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {content.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Course Features */}
      <motion.section 
        className="py-16 bg-muted/30" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="امکانات و ویژگی‌های دوره"
            subtitle="تمام ابزارها و امکانات لازم برای موفقیت در یک مکان"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courseFeatures.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* AI Tools */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="ابزارهای هوش مصنوعی دوره"
            subtitle="آشنایی عمیق با قدرتمندترین ابزارهای AI برای کسب‌وکار"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiTools.map((tool, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-foreground">{tool.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {tool.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.use}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Expected Results */}
      <motion.section 
        className="py-16 bg-muted/30" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="نتایج مورد انتظار"
            subtitle="تغییراتی که پس از تکمیل دوره در زندگی‌تان خواهید دید"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {expectedResults.map((result, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-4 p-6 bg-background rounded-lg border-2 border-primary/20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <result.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-medium text-foreground">{result.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Bonuses */}
      <motion.section 
        className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="بونوس‌های ویژه"
            subtitle="هدایای ارزشمند که به‌صورت رایگان دریافت می‌کنید"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bonuses.map((bonus, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full bg-background/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <bonus.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{bonus.title}</h3>
                    <p className="text-sm text-muted-foreground">{bonus.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto px-6">
          <SectionTitle 
            title="سوالات متداول"
            subtitle="پاسخ سوالات رایج درباره پک هوشمند کسب‌وکار"
            align="center"
            isCentered
          />
          
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Collapsible key={faq.id} open={openFAQ === faq.id} onOpenChange={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}>
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-right flex-1">{faq.question}</h3>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 mr-4 ${openFAQ === faq.id ? 'rotate-180' : ''}`} />
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-2 border-t-0">
                    <CardContent className="pt-0 px-6 pb-6">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Checkout Section */}
      <section id="checkout-section" className="py-16 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              آماده تحول در زندگی‌تان هستید؟
            </h2>
            
            <Card className="bg-background/10 backdrop-blur-lg border border-primary-foreground/20 p-8 mb-8">
              <div className="text-center">
                <div className="text-6xl font-bold mb-4">
                  <span className="line-through text-3xl opacity-60">۲,۵۰۰,۰۰۰</span>
                  <br />
                  <span className="text-yellow-300">۱,۴۹۹,۰۰۰</span>
                  <span className="text-lg font-normal"> تومان</span>
                </div>
                <Badge className="bg-destructive text-destructive-foreground mb-6 text-lg px-4 py-2">
                  ۴۰٪ تخفیف ویژه
                </Badge>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span>رضایت ۹۷٪ دانشجویان</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4 text-green-300" />
                    <span>ضمانت ۳۰ روزه</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-blue-300" />
                    <span>پشتیبانی مادام‌العمر</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePurchaseClick}
                  size="lg" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-12 py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 w-full md:w-auto"
                >
                  <Zap className="ml-3" size={24} />
                  شروع کسب‌وکار هوشمند
                </Button>
              </div>
            </Card>
            
            <p className="text-primary-foreground/80 text-sm">
              دسترسی فوری بعد از خرید • ضمانت ۳۰ روزه بازگشت وجه • پشتیبانی مادام‌العمر
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky Button */}
      <MobileStickyButton onClick={handlePurchaseClick}>
        شروع کسب‌وکار با AI + بونوس‌های ویژه
      </MobileStickyButton>

      {/* Purchase Modal */}
      <IframeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="خرید پک هوشمند کسب‌وکار"
        url="https://auth.rafiei.co/?add-to-cart=smart-pack"
      />
    </MainLayout>
  );
};

export default SmartPackLanding;