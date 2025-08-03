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
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Set countdown target for 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const endDateString = targetDate.toISOString();

  const handlePurchaseClick = () => {
    window.location.href = '/enroll/?course=smart-pack';
  };

  const scrollToCheckout = () => {
    window.location.href = '/enroll/?course=smart-pack';
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

  // Course Topics - AI Skill Training  
  const courseTopics = [
    {
      title: "آشنایی با مهارت هوش مصنوعی",
      description: "معرفی AI، جایگاهش در زندگی روزمره، کاربردها، و ضرورت یادگیری",
      icon: Brain,
      modules: [
        "شناخت مفهوم هوش مصنوعی و انواع آن",
        "کاربردهای AI در صنایع مختلف",
        "تأثیر AI بر آینده مشاغل و کسب‌وکارها",
        "نیاز و ضرورت یادگیری مهارت‌های AI"
      ]
    },
    {
      title: "فرهنگ لغت هوش مصنوعی", 
      description: "مفاهیم پایه مانند AI، ML، LLM، Agent، API و Prompt به زبان ساده",
      icon: BookOpen,
      modules: [
        "تعریف و تفاوت AI، ML، و Deep Learning",
        "آشنایی با مفهوم LLM و نحوه عملکرد",
        "درک مفاهیم Agent، API و Prompt",
        "واژگان تخصصی و اصطلاحات رایج"
      ]
    },
    {
      title: "پرامپت‌نویسی پیشرفته (مدل SMART)",
      description: "تکنیک‌های SMART، Chain-of-Thought، A/B Testing، Role Play و Context Stacking + فایل PDF دفترچه فرمول پرامپت",
      icon: Target,
      modules: [
        "روش SMART در نوشتن پرامپت‌های مؤثر",
        "تکنیک Chain-of-Thought برای حل مسائل پیچیده",
        "A/B Testing پرامپت‌ها برای بهینه‌سازی",
        "Role Play و Context Stacking در پرامپت‌نویسی"
      ]
    },
    {
      title: "معرفی و تست ابزارهای هوش مصنوعی",
      description: "ChatGPT، Gemini، Sora، Leonardo، Google AI Studio، Suno، Lovable، Gamma AI، HeyGen، ElevenLabs و Google Drive با Gemini",
      icon: Cog,
      modules: [
        "ChatGPT و Gemini برای تولید محتوا و پاسخ‌گویی",
        "Sora و Leonardo برای ساخت تصویر و ویدیو",
        "Google AI Studio برای تولید صدا و پادکست",
        "Suno، Lovable، Gamma AI، HeyGen و ElevenLabs"
      ]
    },
    {
      title: "فقط یک روز با AI زندگی کن (تمرین عملی)",
      description: "اجرای کارهای روزانه با ابزارها، اتوماسیون ساده، تجربه عملی",
      icon: Play,
      modules: [
        "برنامه‌ریزی روز با کمک هوش مصنوعی",
        "اتوماسیون کارهای ساده روزانه",
        "استفاده از AI در ارتباطات و نوشتن",
        "تجربه عملی و ارزیابی نتایج"
      ]
    },
    {
      title: "فرصت‌های نو – مهارت‌های نو",
      description: "۹ مهارت کاربردی برای شغل، بیزینس و برند شخصی در عصر AI",
      icon: TrendingUp,
      modules: [
        "بنچمارک و تحلیل رقبا با AI",
        "تولید محتوا حرفه‌ای برای برند شخصی",
        "اتوماسیون فرآیندهای کاری",
        "طراحی و تحلیل داده‌های کسب‌وکار"
      ]
    },
    {
      title: "ساخت AI Agent (دستیار هوشمند شخصی)",
      description: "ساخت Agent با n8n و اتصال به تلگرام، Gmail، Google Sheet، Calendar، APIهای OpenAI و مدیریت دیتا",
      icon: Rocket,
      modules: [
        "آشنایی با n8n و ساخت Agent",
        "اتصال به تلگرام، Gmail و Google Workspace",
        "تست Agent با پرامپت‌های واقعی",
        "تمپلیت‌های آماده برای تبدیل صدا به متن"
      ]
    }
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
      title: "بیش از ۱۰۰ پرامپت آماده",
      description: "پرامپت‌های آماده برای بهبود زندگی شخصی و کسب‌وکار"
    },
    {
      icon: Cog,
      title: "آموزش‌های پیشرفته ساخت ایجنت",
      description: "GPT شخصی و اتوماسیون با n8n و Google API"
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
    { name: "Loom AI", use: "ضبط و ویرایش ویدیو", category: "محتوا" },
    { name: "Lovable", use: "طراحی سایت بدون کد", category: "طراحی" },
    { name: "Google AI Studio", use: "ساخت صدا، مدل و تست", category: "محتوا" },
    { name: "Suno", use: "تولید موسیقی با پرامپت", category: "محتوا" },
    { name: "Gamma AI", use: "ساخت پرزنتیشن با پرامپت", category: "محتوا" },
    { name: "ElevenLabs", use: "تبدیل متن به صدا", category: "محتوا" },
    { name: "HeyGen", use: "ساخت ویدیو آواتاری", category: "محتوا" }
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

  // FAQ - Updated with specific questions from the original page
  const faqs = [
    {
      id: "education",
      question: "آیا شرکت در این دوره نیاز به تحصیلات یا پیشینه علمی دارد؟",
      answer: "خیر، این پک با در نظر گرفتن ساختار اقتصادی و فرهنگی جامعه ایران طراحی شده و تمام موارد آموزشی ساده‌سازی شده است تا تمام اقشار جامعه در هر سطح از سواد بتوانند از آن استفاده کنند. از یک کاسب با تجربه بدون تحصیلات دانشگاهی تا فارغ‌التحصیل مدیریت، همه می‌توانند بهره‌مند شوند."
    },
    {
      id: "who-should-buy",
      question: "چه کسانی باید این دوره را تهیه کنند؟",
      answer: "اگر در گیجی و سردرگمی به سر می‌برید و نمی‌دانید مسیرتان کدام است، اگر نمی‌دانید چگونه با هوش مصنوعی درآمد ایجاد کنید، اگر ایده‌های زیادی دارید اما نمی‌دانید کدام درست است، اگر می‌خواهید با ماهیت واقعی پول و AI آشنا شوید، و اگر به دنبال ایجاد تغییرات شگفت‌انگیز در زندگی‌تان هستید."
    },
    {
      id: "money-secrets",
      question: "رازهای پول درآوردن با هوش مصنوعی رو می‌گین؟",
      answer: "بله؛ این پک به شما کمک می‌کند در هر جایگاه شغلی که هستید، نگرش جدیدی به پول و هوش مصنوعی پیدا کنید و یاد بگیرید چطور ثروت خودتان را با AI خلق و بیشتر کنید. معجزه‌ای در کار نیست، هرچی هست آموختنی و کاربردی است."
    },
    {
      id: "requirements",
      question: "چه شرایطی برای تهیه دوره مورد نیاز است؟",
      answer: "آموزش‌پذیری و علاقمندی به یادگیری AI، داشتن نیاز به افزایش درآمد، امکان عمل به آموخته‌ها، علاقمندی به یادگیری و پشتکار، اشتیاق به ایجاد تحول در کسب‌وکار، آگاهی از اینکه معجزه‌ای در کار نیست و مثبت‌اندیش بودن و اعتقاد به اینکه می‌توانید تغییرات خوبی ایجاد کنید."
    },
    {
      id: "become-rich",
      question: "آیا همه ما قراره یاد بگیریم با هوش مصنوعی ثروتمند بشیم؟",
      answer: "خیر! قرار نیست همه مثل بیل گیتس شوند. قرار است در هر شغل و جایگاهی که هستیم، با کمک هوش مصنوعی چند پله رشد کنیم. روش‌هایی یاد می‌گیریم که در شغل و حرفه خودمان با AI پیشرفت کنیم و درآمدمان را افزایش دهیم."
    },
    {
      id: "no-need",
      question: "فکر می‌کنیم نیازی به چنین آموزشی نداریم!",
      answer: "بسیاری از ما فقط فکر می‌کنیم که داریم از حداکثر ظرفیت خودمان استفاده می‌کنیم، چون نمی‌دانیم چه ظرفیت‌های پنهانی برای کسب درآمد با هوش مصنوعی داریم. این سرمایه‌گذاری ارزشمند را برای خودتان انجام دهید و نتایجش را در آینده ببینید."
    },
    {
      id: "ask-questions",
      question: "اگر سوالی داشتم چطور می‌توانم از مدرس بپرسم؟",
      answer: "کافیست سوال خود را در قسمت پرسش و پاسخ پایین ویدیوهای دوره مطرح نمایید؛ تا ۴۸ ساعت بعد پاسخ شما در همین قسمت توسط پشتیبانی و مدرس ارسال خواهد شد."
    },
    {
      id: "expensive",
      question: "آیا دوره گران نیست؟",
      answer: "با رقم ۱.۵ میلیون تومان شاید یک ساعت دیجیتال یا چند بازی پلی‌استیشن بخرید! اما وقتی بتوانید با همین مبلغ روی مهم‌ترین مهارت‌های هوش مصنوعی کار کنید، یک سرمایه‌گذاری ارزشمند کرده‌اید. اگر به آموزش‌ها عمل کنید، علاوه بر بازگشت سرمایه، نتایج فوق‌العاده‌ای کسب خواهید کرد."
    },
    {
      id: "money-back",
      question: "از کجا معلوم اگر راضی نبودم شما پول من را پس می‌دهید؟",
      answer: "آکادمی رفیعی در این سال‌ها فعالیت به قدری خوب عمل کرده که تقریباً هیچ معترضی ندارد! اعتبار این مجموعه اینقدر بالاست که به خاطر چندمیلیون تومان، خود را در معرض اتهام قرار نمی‌دهد. برند ثبت‌شده با ده‌ها کارمند و برگزارکننده بزرگترین سمینارهای کشور است."
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

      {/* We Don't Sell Dreams Section */}
      <motion.section 
        className="py-16 bg-muted/30" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/50">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-6 py-3 text-lg font-medium mb-6">
                    <Shield className="w-5 h-5 ml-2" />
                    شفافیت کامل
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                    ما توهم رویا نمی‌فروشیم...
                  </h2>
                </div>
                
                <div className="prose prose-lg max-w-4xl mx-auto text-center">
                  <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                    ما در پک هوشمند کسب‌وکار نمی‌خواهیم به شما رویافروشی یا توهم فروشی کنیم. دوست نداریم 
                    فقط با تکیه بر مطالب انگیزشی به شما القا کنیم که می‌توانید جز ثروتمندترین افراد جهان 
                    شوید! ما نمی‌خواهیم شما در دام افراد سودجو و متوهم بیفتید.
                  </p>
                  
                  <div className="bg-primary/5 rounded-lg p-6 mb-6">
                    <p className="text-foreground font-semibold text-xl leading-relaxed">
                      رسالت ما در این پک یک چیز است: <span className="text-primary">آموزش اصولی و صحیح هوش مصنوعی برای کسب‌وکار</span>. 
                      و به شما وعده می‌دهیم که اگر این آموزش‌ها را به درستی پیاده‌سازی و واقعاً به آن‌ها عمل کنید، 
                      اتفاقات خوبی در زندگی‌تان خواهد افتاد.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Video className="w-4 h-4 text-primary" />
                      <span>آموزش ویدیویی</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-success" />
                      <span>گواهی معتبر</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span>ضمانت بازگشت وجه</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-orange-500" />
                      <span>پرداخت ارزی</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Course Benefits Section */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="مزایای شرکت در پک هوشمند"
            subtitle="این پک مختص کسانی است که می‌خواهند تصمیمات مالی بهتری بگیرند و متفاوت زندگی کنند"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Why this course */}
            <motion.div variants={itemVariants}>
              <Card className="h-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">۱</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">این پک:</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">علمی و مبتنی بر آخرین تحقیقات AI و کسب‌وکار است؛ با دسترسی به منابع دست‌اول و معتبر.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">کاربردی و بومی است؛ نه تئوری صرف! همراه با تمرینات عملی و اثربخش برای ایجاد تغییرات ماندگار در زندگی.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">تعاملی و بدون شعار طراحی شده؛ مخصوص کسانی که واقعاً آماده تغییر و اقدام هستند.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Who should take this course */}
            <motion.div variants={itemVariants}>
              <Card className="h-full border-2 border-primary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-secondary">۲</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">این پک مناسب شماست اگر:</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">عمل‌گرا هستید و می‌خواهید درآمد بیشتری با هوش مصنوعی داشته باشید.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">آماده یادگیری نکات کلیدی و کاربردی برای بهبود شغلی و مالی خود هستید.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">از انگیزه‌های زودگذر خسته شده‌اید و به دنبال راهکارهای عملی و علمی هستید.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Why choose this course */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">۳</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">چرا این پک؟</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-success mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">تضمین رضایت ۱۰۰٪</h4>
                      <p className="text-muted-foreground text-sm">اگر تا پایان دوره ناراضی بودید، هزینه‌تان را بدون هیچ شرطی بازمی‌گردانیم.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">آموزش عملی AI و کاهش استرس مالی</h4>
                      <p className="text-muted-foreground text-sm">با روش‌های علمی، به جای ذخیره اطلاعات، تغییر واقعی در زندگی‌تان ایجاد می‌کنید.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Course Topics Section */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="سرفصل‌های آموزش مهارت هوش مصنوعی"
            subtitle="۷ موضوع جامع برای تسلط کامل بر مهارت‌های هوش مصنوعی از مبتدی تا پیشرفته"
            align="center"
            isCentered
          />

          <div className="space-y-8">
            {courseTopics.map((topic, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                        <topic.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {topic.title}
                        </h3>
                        <p className="text-muted-foreground mb-6 text-lg">
                          {topic.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {topic.modules.map((module, moduleIndex) => (
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

      {/* Video Testimonials Section */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="نظرات شرکت‌کنندگان دوره (ویدیو)"
            subtitle="نظرات واقعی و بدون تدوین دانشجویان درباره تجربه‌شان"
            align="center"
            isCentered
          />

          <motion.div variants={itemVariants}>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="w-10 h-10 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  ویدیوهای نظرات دانشجویان
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  شنیدن تجربه واقعی دانشجویان درباره تأثیر این پک در زندگی‌شان بهتر از هر توضیحی است. 
                  ویدیوهای بدون تدوین و صادقانه از تغییراتی که در زندگی‌شان رخ داده.
                </p>
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Play className="w-5 h-5 ml-2" />
                  مشاهده ویدیوهای نظرات
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  * ویدیوها بعد از خرید در پنل شما قابل مشاهده خواهند بود
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Registration Methods */}
      <motion.section 
        className="py-16 bg-muted/30" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <SectionTitle 
            title="روش‌های ثبت نام"
            subtitle="راه‌های مختلف برای تهیه پک هوشمند کسب‌وکار"
            align="center"
            isCentered
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div variants={itemVariants}>
              <Card className="h-full text-center border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">ثبت نام آنلاین</h3>
                  <p className="text-muted-foreground mb-6">
                    در همین صفحه روی دکمه خرید بزنید و رزرو خودتان در دوره را تکمیل کنید.
                  </p>
                  <Button onClick={() => window.location.href = '/enroll/?course=smart-pack'} className="w-full">
                    خرید آنلاین
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full text-center border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">پرداخت کارت به کارت</h3>
                  <div className="text-muted-foreground mb-4 space-y-2">
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      6104337877849719
                    </p>
                    <p className="text-sm">به نام آکادمی رفیعی</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    سپس رسید واریزی خود را به شماره تلگرام یا واتساپ ارسال نمایید.
                  </p>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 ml-2" />
                    ارسال رسید
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full text-center border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Globe className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">پرداخت ارزی</h3>
                  <p className="text-muted-foreground mb-6">
                    جهت پرداخت از خارج از کشور و با ارزهای مختلف
                  </p>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 ml-2" />
                    پرداخت بین‌المللی
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
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

      {/* Checkout Section - Minimal Clean Design */}
      <section id="checkout-section" className="py-20 bg-background border-t border-border">
        <div className="container max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              آماده تحول در زندگی‌تان هستید؟
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              همین امروز اولین قدم را برای ساخت کسب‌وکار درآمدزای خود با هوش مصنوعی بردارید
            </p>
            
            {/* Clean Price Card */}
            <div className="bg-muted/30 rounded-2xl p-8 mb-8 border border-border">
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="text-lg text-muted-foreground line-through">۲,۵۰۰,۰۰۰ تومان</span>
                <Badge variant="destructive" className="text-sm">۴۰٪ تخفیف</Badge>
              </div>
              
              <div className="text-5xl md:text-6xl font-bold text-foreground mb-8">
                ۱,۴۹۹,۰۰۰
                <span className="text-xl font-normal text-muted-foreground mr-2">تومان</span>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>دسترسی فوری</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>ضمانت ۳۰ روزه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <span>پشتیبانی مادام‌العمر</span>
                </div>
              </div>
              
              {/* CTA Button */}
              <Button 
                onClick={handlePurchaseClick}
                size="lg" 
                className="w-full md:w-auto bg-foreground text-background hover:bg-foreground/90 px-12 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5 ml-3" />
                شروع کسب‌وکار هوشمند
              </Button>
            </div>
            
            {/* Additional Info */}
            <p className="text-sm text-muted-foreground">
              بدون ریسک • بازگشت کامل وجه در صورت عدم رضایت • ۵ هزار دانشجوی موفق
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky Button */}
      <MobileStickyButton onClick={handlePurchaseClick}>
        شروع کسب‌وکار با AI + بونوس‌های ویژه
      </MobileStickyButton>
    </MainLayout>
  );
};

export default SmartPackLanding;