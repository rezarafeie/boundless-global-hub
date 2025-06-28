
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  Mic, 
  FileText, 
  Lightbulb,
  Cog,
  ExternalLink,
  Gift,
  TrendingUp,
  Users,
  Heart,
  DollarSign,
  Zap,
  CheckCircle,
  ChevronDown,
  Star,
  Award,
  Clock,
  Shield,
  Download,
  Play,
  Target,
  Rocket,
  Globe,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import IframeModal from "@/components/IframeModal";
import MobileStickyButton from "@/components/MobileStickyButton";
import { useLanguage } from "@/contexts/LanguageContext";

const SmartPackLanding = () => {
  const { translations } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handlePurchaseClick = () => {
    setIsModalOpen(true);
  };

  const scrollToCheckout = () => {
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) {
      checkoutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Animated counter hook
  const useCounter = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let startTime: number;
      let animationFrame: number;
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(end * progress));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);
    
    return count;
  };

  const packContents = [
    {
      icon: Mic,
      title: translations.podcastEpisodes || "۶ اپیزود پادکستی آموزشی",
      description: translations.podcastDesc || "آموزش صوتی جامع برای یادگیری در هر زمان و مکان"
    },
    {
      icon: FileText,
      title: translations.promptNotebook || "دفترچه پرامپت‌نویسی",
      description: translations.promptNotebookDesc || "راهنمای کامل نوشتن پرامپت‌های حرفه‌ای"
    },
    {
      icon: Lightbulb,
      title: translations.readyPrompts || "پرامپت‌های آماده",
      description: translations.readyPromptsDesc || "بیش از ۱۰۰ پرامپت آماده برای زندگی و کار"
    },
    {
      icon: Cog,
      title: translations.topAiTools || "ابزارهای برتر AI",
      description: translations.topAiToolsDesc || "معرفی و آموزش کار با بهترین ابزارهای هوش مصنوعی"
    },
    {
      icon: Brain,
      title: translations.smartAgentCreation || "ساخت ایجنت هوشمند",
      description: translations.smartAgentDesc || "آموزش گام‌به‌گام ساخت ربات‌های هوشمند"
    },
    {
      icon: ExternalLink,
      title: translations.practicalFiles || "فایل‌های عملی",
      description: translations.practicalFilesDesc || "اکسل، چک‌لیست و دفترچه تمرین‌های کاربردی"
    }
  ];

  const curriculum = [
    {
      title: translations.personalLifeWithAi || "زندگی شخصی بهتر با AI",
      description: translations.personalLifeDesc || "برنامه‌ریزی، سلامتی، بازگشت به خود، انگیزه",
      icon: Heart,
      items: ["برنامه‌ریزی هوشمند روزانه", "مدیریت سلامت با AI", "تقویت انگیزه و تمرکز"]
    },
    {
      title: translations.smartWorkLife || "زندگی کاری هوشمند",
      description: translations.smartWorkLifeDesc || "مدیریت مالی، بیزینس بدون سرمایه، ایده‌سازی",
      icon: DollarSign,
      items: ["استراتژی‌های مالی هوشمند", "راه‌اندازی کسب‌وکار با AI", "تولید ایده‌های نوآورانه"]
    },
    {
      title: translations.agentCreationAutomation || "ساخت ایجنت و خودکارسازی",
      description: translations.agentCreationDesc || "N8N، Lovable و ابزارهای اتوماسیون",
      icon: Cog,
      items: ["ساخت ربات‌های کاری", "اتوماسیون فرآیندها", "یکپارچه‌سازی سیستم‌ها"]
    },
    {
      title: translations.aiToolsLibrary || "کتابخانه ابزارهای برتر AI",
      description: translations.aiToolsLibraryDesc || "معرفی جامع بهترین ابزارها",
      icon: BookOpen,
      items: ["ابزارهای تولید محتوا", "پلتفرم‌های تحلیل داده", "سرویس‌های هوش مصنوعی"]
    },
    {
      title: translations.smartMarketing || "مارکتینگ هوشمند",
      description: translations.smartMarketingDesc || "شبکه اجتماعی، تولید ویدیو، موزیک، کپشن",
      icon: TrendingUp,
      items: ["تولید محتوای ویروسی", "ساخت ویدیو و موزیک", "بازاریابی اتوماتیک"]
    }
  ];

  const bonuses = [
    {
      icon: Sparkles,
      title: "پرامپت‌های ویژه اعضا",
      description: "دسترسی انحصاری به پرامپت‌های پیشرفته"
    },
    {
      icon: Brain,
      title: "تمرینات ذهنی تمرکز",
      description: "تکنیک‌های علمی برای افزایش تمرکز"
    },
    {
      icon: Clock,
      title: "برنامه ۷ روزه بازگشت به خود",
      description: "راهنمای عملی برای بازیابی انگیزه"
    },
    {
      icon: FileText,
      title: "فایل‌های Notion آماده",
      description: "قالب‌های حرفه‌ای برای سازماندهی"
    },
    {
      icon: Lightbulb,
      title: "۵۰ پرامپت انگیزشی",
      description: "راه‌حل‌هایی برای روزهای کم‌انگیزگی"
    }
  ];

  const expectedResults = [
    { icon: TrendingUp, text: translations.increasedProductivity || "بهره‌وری بیشتر در زندگی" },
    { icon: CheckCircle, text: translations.smartHabits || "ایجاد عادت‌های هوشمند" },
    { icon: DollarSign, text: translations.increasedIncome || "افزایش درآمد از طریق هوش مصنوعی" },
    { icon: Rocket, text: translations.personalBusiness || "راه‌اندازی بیزینس شخصی" },
    { icon: Heart, text: translations.improvedHealth || "بهبود سلامت و آرامش ذهن" },
    { icon: Globe, text: translations.dollarIncome || "دسترسی به درآمد دلاری" }
  ];

  const tools = [
    { name: "Canva AI", use: "طراحی گرافیک هوشمند" },
    { name: "SerpAPI", use: "تحلیل و جستجوی داده" },
    { name: "Lovable", use: "ساخت اپلیکیشن بدون کد" },
    { name: "Vapi", use: "ساخت ربات‌های صوتی" },
    { name: "N8N", use: "اتوماسیون کسب‌وکار" },
    { name: "FeedHive", use: "مدیریت شبکه‌های اجتماعی" },
    { name: "Json2Video", use: "تولید ویدیو اتوماتیک" },
    { name: "Suno", use: "ساخت موزیک با AI" },
    { name: "Google AI Studio", use: "توسعه اپلیکیشن‌های هوشمند" }
  ];

  // Student achievements data
  const achievements = [
    { number: 3200, label: translations.studentsCount || "دانشجو", suffix: "+" },
    { number: 98, label: translations.satisfactionRate || "رضایت", suffix: "%" },
    { number: 75, label: translations.successReports || "گزارش موفقیت واقعی", suffix: "+" }
  ];

  const testimonials = [
    {
      text: translations.testimonial1 || "با پرامپت‌های مالی همین پک، اولین ۱۰۰۰ دلاری‌مو درآوردم.",
      avatar: "👨‍💻"
    },
    {
      text: translations.testimonial2 || "۴ ساعت وقت آزاد در روز با خودکارسازی کارام",
      avatar: "👩‍💼"
    },
    {
      text: translations.testimonial3 || "تمرین‌های تمرکز ذهنی فوق‌العاده بود!",
      avatar: "🧑‍🎓"
    },
    {
      text: translations.testimonial4 || "درآمد پسیو من با این آموزش‌ها ۳ برابر شد",
      avatar: "👨‍🚀"
    }
  ];

  // Enhanced bonuses
  const enhancedBonuses = [
    {
      icon: Star,
      title: translations.goldenPrompts || "دفترچه ۱۰ پرامپت طلایی برای روزهای سخت",
      description: translations.goldenPromptsDesc || "پرامپت‌های انگیزشی ویژه"
    },
    {
      icon: FileText,
      title: translations.notionTemplate || "فایل Notion برنامه‌ریزی شخصی",
      description: translations.notionTemplateDesc || "قالب آماده برای سازماندهی"
    },
    {
      icon: Brain,
      title: translations.dailyGptAssistant || "دستیار GPT روزانه آماده استفاده",
      description: translations.dailyGptAssistantDesc || "ربات شخصی برای کارهای روزمره"
    },
    {
      icon: BookOpen,
      title: translations.promptBookPdf || "PDF پرامپت‌بوک برای محتوا و بیزینس",
      description: translations.promptBookPdfDesc || "راهنمای کامل تولید محتوا"
    }
  ];

  // Trust badges
  const trustBadges = [
    {
      icon: Shield,
      title: translations.moneyBackGuarantee || "گارانتی ۷ روزه بازگشت وجه",
      description: translations.moneyBackDesc || "بدون شرط و قید"
    },
    {
      icon: Users,
      title: translations.directSupport || "پشتیبانی مستقیم از آکادمی رفیعی",
      description: translations.directSupportDesc || "پاسخ سریع به سوالات"
    },
    {
      icon: Download,
      title: translations.permanentAccess || "دسترسی دائمی و دانلود نامحدود",
      description: translations.permanentAccessDesc || "مالکیت مادام‌العمر"
    },
    {
      icon: Gift,
      title: translations.freeUpdates || "آپدیت‌های رایگان مادام‌العمر",
      description: translations.freeUpdatesDesc || "محتوای جدید بدون هزینه اضافی"
    }
  ];

  const faqs = [
    {
      id: "programming",
      question: translations.faqProgrammingQ || "آیا برای استفاده از این پک باید برنامه‌نویسی بلد باشم؟",
      answer: translations.faqProgrammingA || "خیر، این پک برای همه سطوح طراحی شده. حتی اگر هیچ تجربه فنی نداشته باشید، می‌توانید از محتواها استفاده کنید."
    },
    {
      id: "access",
      question: translations.faqAccessQ || "چطور به محتواها دسترسی پیدا می‌کنم؟",
      answer: translations.faqAccessA || "بعد از خرید، لینک دسترسی به پنل اختصاصی شما ارسال می‌شود که شامل تمام فایل‌ها و آموزش‌هاست."
    },
    {
      id: "activation",
      question: translations.faqActivationQ || "بعد از خرید چه چیزهایی برام فعال میشه؟",
      answer: translations.faqActivationA || "دسترسی کامل به پادکست‌ها، فایل‌های PDF، پرامپت‌ها، ابزارها و بونوس‌های ویژه فعال می‌شود."
    },
    {
      id: "download",
      question: translations.faqDownloadQ || "می‌تونم فایل‌ها رو دانلود کنم؟",
      answer: translations.faqDownloadA || "بله، تمام فایل‌ها قابل دانلود هستند و می‌توانید آن‌ها را برای همیشه نگه دارید."
    },
    {
      id: "updates",
      question: translations.faqUpdatesQ || "آیا آپدیت‌های بعدی هم رایگانه؟",
      answer: translations.faqUpdatesA || "بله، تمام آپدیت‌ها و محتوای جدید برای اعضای فعلی کاملاً رایگان ارائه می‌شود."
    },
    {
      id: "beginner",
      question: translations.faqBeginnerQ || "آیا این پک برای کسانی که هیچ دانشی از هوش مصنوعی ندارند هم مفید است؟",
      answer: translations.faqBeginnerA || "بله! دقیقاً برای همین افراد طراحی شده، آموزش‌ها از صفر و کاربردی هستند."
    },
    {
      id: "guide",
      question: translations.faqGuideQ || "آیا بعد از خرید راهنمای استفاده هم دریافت می‌کنم؟",
      answer: translations.faqGuideA || "بله. بلافاصله بعد از خرید، راهنمای شروع سریع به همراه فایل‌ها در پنل شما فعال می‌شود."
    }
  ];

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const Counter = ({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) => {
    const count = useCounter(end);
    
    return (
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-bold text-white mb-2">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-blue-200 text-lg">{label}</div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse animation-delay-400"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-orange-400/15 to-red-400/15 rounded-full blur-3xl animate-pulse animation-delay-800"></div>
          </div>
          
          <div className="container max-w-6xl mx-auto px-4 relative z-10 text-white">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-8 py-3 text-lg font-medium shadow-2xl">
                  <Brain className="w-5 h-5 ml-2" />
                  پک هوشمند
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                {translations.smartPackTitle || "زندگی‌تو متحول کن"}
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  با کمک هوش مصنوعی
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl mb-12 font-medium leading-relaxed max-w-4xl mx-auto text-blue-100"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {translations.smartPackSubtitle || "پکیج جامع آموزش و ابزار برای بهتر زندگی کردن، با هوش مصنوعی"}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-4"
              >
                <Button 
                  onClick={scrollToCheckout}
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full px-12 py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Download className="ml-3" size={24} />
                  {translations.smartPackCta || "دریافت پک هوشمند"}
                </Button>
                
                <div className="flex items-center justify-center gap-6 text-sm text-blue-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>دسترسی فوری</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} />
                    <span>ضمانت ۳۰ روزه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download size={16} />
                    <span>قابل دانلود</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* محتویات پک هوشمند */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{translations.packContentsTitle || "محتویات پک هوشمند"}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {translations.packContentsSubtitle || "همه چیزی که برای زندگی هوشمندتر با AI نیاز دارید"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packContents.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full border-2 border-blue-100 hover:border-orange-300 transition-all duration-300 hover:shadow-lg">
                      <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IconComponent size={32} className="text-white" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-center">{item.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* دستاوردهای دانشجویان */}
        <section className="py-20" style={{ backgroundColor: '#002B55' }}>
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{translations.studentAchievementsTitle || "دستاوردهای واقعی دانشجویان پک هوشمند"}</h2>
              <p className="text-lg text-blue-200 max-w-2xl mx-auto">
                {translations.studentAchievementsSubtitle || "نتایج واقعی و قابل اعتماد از دانشجویان ما"}
              </p>
            </div>
            
            {/* Achievement Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                >
                  <Counter
                    end={achievement.number}
                    suffix={achievement.suffix}
                    label={achievement.label}
                  />
                </motion.div>
              ))}
            </div>

            {/* Testimonials Carousel */}
            <div className="max-w-4xl mx-auto">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                  <p className="text-xl text-white font-medium leading-relaxed mb-6">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                </motion.div>
                
                {/* Navigation Dots */}
                <div className="flex justify-center space-x-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial ? 'bg-orange-400' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* سرفصل‌ها */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{translations.curriculumTitle || "سرفصل‌های آموزشی"}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {translations.curriculumSubtitle || "برنامه جامع و گام‌به‌گام برای تسلط بر هوش مصنوعی"}
              </p>
            </div>
            
            <div className="space-y-6">
              {curriculum.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <IconComponent size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold text-foreground">{section.title}</CardTitle>
                            <p className="text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {section.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* هدایای ویژه امروز */}
        <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <div className="container max-w-6xl mx-auto px-4">
            {/* Warning Banner */}
            <div className="mb-8">
              <div className="bg-orange-500 text-white p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle size={20} />
                  <span className="font-bold">{translations.bonusesWarning || "🎉 دریافت این بونس‌ها فقط برای مدت محدود فعال است"}</span>
                </div>
              </div>
            </div>

            <div className="text-center mb-16">
              <Gift className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{translations.specialBonusesTitle || "هدایای ویژه فقط برای خریداران امروز"}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {translations.specialBonusesSubtitle || "هدایای ارزشمند که فقط با پک هوشمند دریافت می‌کنید"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {enhancedBonuses.map((bonus, index) => {
                const IconComponent = bonus.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full bg-white/80 backdrop-blur-sm border border-orange-200 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IconComponent size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold mb-2 text-foreground">{bonus.title}</h3>
                        <p className="text-sm text-muted-foreground">{bonus.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Original bonuses grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bonuses.map((bonus, index) => {
                const IconComponent = bonus.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: (index + enhancedBonuses.length) * 0.1 }}
                  >
                    <Card className="h-full bg-white/80 backdrop-blur-sm border border-orange-200 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IconComponent size={24} className="text-white" />
                        </div>
                        <h3 className="font-bold mb-2 text-foreground">{bonus.title}</h3>
                        <p className="text-sm text-muted-foreground">{bonus.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* نتایج مورد انتظار */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{translations.expectedResultsTitle || "نتایج مورد انتظار"}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {translations.expectedResultsSubtitle || "تغییراتی که بعد از استفاده از پک هوشمند خواهید دید"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {expectedResults.map((result, index) => {
                const IconComponent = result.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent size={24} className="text-white" />
                    </div>
                    <span className="font-medium text-foreground">{result.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ابزارهای معرفی‌شده */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <Cog className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{translations.toolsTitle || "ابزارهای معرفی‌شده"}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {translations.toolsSubtitle || "بهترین ابزارهای هوش مصنوعی که در پک آموزش داده می‌شوند"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-orange-200">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2 text-foreground">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">{tool.use}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* سکشن اعتماد */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{translations.trustTitle || "ضمانت و اعتماد"}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {translations.trustSubtitle || "خرید امن با ضمانت کامل"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {trustBadges.map((badge, index) => {
                const IconComponent = badge.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent size={32} className="text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{badge.title}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* سوالات متداول */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{translations.faqTitle || "سوالات متداول"}</h2>
              <p className="text-lg text-muted-foreground">
                {translations.faqSubtitle || "پاسخ سوالات رایج درباره پک هوشمند"}
              </p>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Collapsible key={faq.id} open={openFAQ === faq.id} onOpenChange={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}>
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-md transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-foreground">{faq.question}</h3>
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openFAQ === faq.id ? 'rotate-180' : ''}`} />
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
        </section>

        {/* خرید و دسترسی */}
        <section id="checkout-section" className="py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-8">{translations.checkoutTitle || "همین حالا شروع کن!"}</h2>
              
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 mb-8">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-4">
                    <span className="line-through text-3xl text-gray-300">{translations.originalPrice || "۴۹۹,۰۰۰"}</span>
                    <br />
                    <span className="text-orange-400">{translations.currentPrice || "۲۹۹,۰۰۰"}</span>
                    <span className="text-lg font-normal"> {translations.currency || "تومان"}</span>
                  </div>
                  <Badge className="bg-red-500 text-white mb-6">{translations.specialDiscount || "۴۰٪ تخفیف ویژه"}</Badge>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{translations.studentSatisfaction || "رضایت ۹۸٪ دانشجویان"}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>{translations.fullSupport || "پشتیبانی کامل"}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>{translations.consultationAvailable || "امکان مشاوره"}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePurchaseClick}
                    size="lg" 
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full px-12 py-4 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 w-full md:w-auto"
                  >
                    <Zap className="ml-3" size={24} />
                    {translations.getItNow || "همین حالا دریافت کن"}
                  </Button>
                </div>
              </Card>
              
              <p className="text-blue-200 text-sm">
                {translations.instantAccess || "دسترسی فوری بعد از خرید • ضمانت ۳۰ روزه بازگشت وجه"}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Sticky CTA Button */}
        <MobileStickyButton onClick={handlePurchaseClick}>
          {translations.mobileCtaText || "همین حالا پک هوشمند رو دریافت کن + هدیه‌ها"}
        </MobileStickyButton>

        {/* Purchase Modal */}
        <IframeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="خرید پک هوشمند"
          url="https://auth.rafiei.co/?add-to-cart=smart-pack"
        />
      </div>

      <style>
        {`
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-800 {
          animation-delay: 800ms;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default SmartPackLanding;
