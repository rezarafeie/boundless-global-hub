import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import IframeModal from "@/components/IframeModal";
import { useCourseSettings } from "@/hooks/useCourseSettings";
import { 
  PlayCircle, 
  CheckCircle, 
  Users, 
  Clock, 
  Star,
  Brain,
  Zap,
  Target,
  Award,
  BookOpen,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Monitor,
  Download,
  Gift,
  Sparkles,
  TrendingUp,
  Globe,
  Rocket,
  DollarSign,
  FileText,
  Video,
  Headphones,
  MessageSquare,
  UserCheck,
  ShieldCheck,
  Calendar,
  Infinity,
  ArrowRight,
  Quote
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MainLayout from "@/components/Layout/MainLayout";
import SectionTitle from "@/components/SectionTitle";

interface SmartLifeEnhancedProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: string;
  iframeUrl: string;
  courseSlug: string;
}

const SmartLifeEnhanced: React.FC<SmartLifeEnhancedProps> = ({
  title,
  englishTitle,
  description,
  iframeUrl,
  courseSlug
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSession1Open, setIsSession1Open] = useState(false);
  const [isSession2Open, setIsSession2Open] = useState(false);
  const { getEnrollUrl } = useCourseSettings(courseSlug);

  const handleStartCourse = () => {
    const enrollmentUrl = getEnrollUrl(courseSlug, iframeUrl);
    if (enrollmentUrl) {
      if (enrollmentUrl.includes('http')) {
        window.open(enrollmentUrl, '_blank');
      } else {
        window.location.href = enrollmentUrl;
      }
    } else if (iframeUrl) {
      setIsModalOpen(true);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Course statistics
  const stats = [
    { icon: Users, number: "3,000+", label: "دانشجوی موفق", color: "text-blue-600" },
    { icon: Star, number: "4.9", label: "رضایتمندی", color: "text-yellow-500" },
    { icon: Clock, number: "2", label: "جلسه قدرتمند", color: "text-green-600" },
    { icon: Award, number: "100%", label: "کاملاً رایگان", color: "text-purple-600" }
  ];

  // What you'll get items
  const courseIncludes = [
    {
      icon: Video,
      title: "دسترسی کامل به جلسه ۱ دوره پرمیوم",
      description: "AI Mindset & Foundation - پایه‌های ذهنیت هوش مصنوعی"
    },
    {
      icon: Gift,
      title: "جلسه بونوس انحصاری",
      description: "چطور در ۲۴ ساعت با AI تغییر واقعی ایجاد کنیم"
    },
    {
      icon: Brain,
      title: "کاربردهای عملی ابزارهای AI",
      description: "ChatGPT، Gemini، Canva، Suno، Lovable و بیش از ۱۰ ابزار دیگر"
    },
    {
      icon: FileText,
      title: "تمپلیت‌های Smart Prompt",
      description: "پرامپت‌های آماده و تست‌شده برای استفاده فوری"
    },
    {
      icon: Target,
      title: "چالش ۲۴ ساعته عملی",
      description: "تمرین واقعی برای پیاده‌سازی آموخته‌ها"
    },
    {
      icon: Monitor,
      title: "پیش‌نمایش دوره کامل پرمیوم",
      description: "آشنایی با ساختار و محتوای دوره اصلی"
    }
  ];

  // Course features
  const courseFeatures = [
    {
      icon: Smartphone,
      title: "دسترسی از تمام دستگاه‌ها",
      description: "موبایل، تبلت، کامپیوتر - هر جا که باشید"
    },
    {
      icon: Download,
      title: "دانلود محتوا",
      description: "امکان دانلود جلسات برای مشاهده آفلاین"
    },
    {
      icon: UserCheck,
      title: "پشتیبانی تخصصی",
      description: "پاسخ به سؤالات توسط تیم متخصص"
    },
    {
      icon: Calendar,
      title: "دسترسی فوری",
      description: "بلافاصله پس از ثبت‌نام شروع کنید"
    }
  ];

  // Who this is for
  const targetAudience = [
    {
      icon: Lightbulb,
      title: "کنجکاوان فناوری",
      description: "کسانی که درباره AI می‌شنوند اما نمی‌دانند از کجا شروع کنند"
    },
    {
      icon: TrendingUp,
      title: "افزایش‌دهندگان بهره‌وری",
      description: "افرادی که می‌خواهند کارایی و خلاقیت‌شان را افزایش دهند"
    },
    {
      icon: Globe,
      title: "حرفه‌ای‌ها و کارآفرینان",
      description: "دانشجویان، کارمندان، فریلنسرها و صاحبان کسب‌وکار"
    },
    {
      icon: Rocket,
      title: "آماده‌باشان آینده",
      description: "کسانی که می‌خواهند برای عصر هوش مصنوعی آماده شوند"
    }
  ];

  // Learning outcomes
  const learningOutcomes = [
    "درک عمیق از نقش AI در زندگی روزمره و آینده",
    "مهارت کار با ابزارهای محبوب هوش مصنوعی",
    "قابلیت نوشتن پرامپت‌های مؤثر و حرفه‌ای",
    "ایده‌هایی برای بهبود کار و زندگی شخصی",
    "آمادگی برای ورود به دوره پیشرفته‌تر",
    "شبکه‌سازی با سایر علاقه‌مندان به AI"
  ];

  // Testimonials
  const testimonials = [
    {
      name: "سارا احمدی",
      role: "طراح گرافیک",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b882?auto=format&fit=crop&w=150&q=80",
      text: "این دوره چشم‌هایم رو به دنیای جدیدی باز کرد. حالا با AI کارهایم رو خیلی سریع‌تر انجام می‌دم.",
      result: "۵۰% افزایش سرعت کار"
    },
    {
      name: "محمد رضایی",
      role: "دانشجوی مدیریت",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      text: "قبل از این دوره اصلاً نمی‌دونستم AI چیه. الان دارم برای پایان‌نامه‌م ازش استفاده می‌کنم.",
      result: "ثبت‌نام در دوره کامل"
    },
    {
      name: "فاطمه کریمی",
      role: "مدیر فروش",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
      text: "با تکنیک‌هایی که یاد گرفتم، ایمیل‌های فروشم رو بهبود دادم و فروشم ۳۰% افزایش پیدا کرد.",
      result: "۳۰% افزایش فروش"
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "آیا نیاز به تجربه قبلی AI دارم؟",
      answer: "❌ خیر، این دوره کاملاً برای مبتدیان طراحی شده است. تمام مفاهیم از صفر آموزش داده می‌شود."
    },
    {
      question: "واقعاً کاملاً رایگان است؟",
      answer: "✅ بله، هیچ هزینه‌ای ندارد و نیازی به کارت اعتباری نیست. حتی هزینه‌های پنهان هم وجود ندارد."
    },
    {
      question: "چقدر زمان نیاز دارم؟",
      answer: "⏰ هر جلسه حدود ۶۰-۹۰ دقیقه است. می‌توانید در زمان دلخواه خود مشاهده کنید."
    },
    {
      question: "آیا فوراً دسترسی خواهم داشت؟",
      answer: "✅ بله، بلافاصله پس از ثبت‌نام می‌توانید شروع کنید."
    },
    {
      question: "پس از دوره چه اتفاقی می‌افتد؟",
      answer: "🎯 اطلاعات کاملی درباره دوره پرمیوم دریافت می‌کنید و می‌توانید تصمیم بگیرید."
    },
    {
      question: "آیا پشتیبانی دارد؟",
      answer: "✅ بله، تیم پشتیبانی ما آماده پاسخ‌گویی به سؤالات شماست."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Enhanced Hero Section */}
        <motion.section 
          className="relative bg-gradient-to-br from-background via-background/95 to-primary/5 pt-20 pb-16 overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
          
          {/* Glow Effects */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl opacity-40"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-2xl opacity-40"></div>

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
                  بیش از ۳۰۰۰ دانشجوی موفق
                </Badge>
              </motion.div>

              {/* Main Title */}
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight" 
                variants={itemVariants}
              >
                ۲ جلسه رایگان برای شروع زندگی هوشمند با AI
              </motion.h1>

              <motion.p 
                className="text-xl md:text-2xl text-primary font-semibold mb-8" 
                variants={itemVariants}
              >
                Smart Life | Start with AI
              </motion.p>

              <motion.p 
                className="text-lg md:text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed" 
                variants={itemVariants}
              >
                دوره‌ای جامع و عملی که به شما امکان آشنایی با مفاهیم پایه‌ای هوش مصنوعی و کاربرد آن در زندگی روزمره را فراهم می‌کند. 
                این برنامه آموزشی به‌عنوان پیش‌نمایشی از دوره کامل طراحی شده که تاکنون بیش از ۳۰۰۰ نفر در آن شرکت کرده‌اند.
              </motion.p>

              {/* Benefits */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-8">
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  بدون نیاز به دانش قبلی
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  دسترسی فوری
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  ۲ مدرس متخصص
                </Badge>
              </motion.div>

              {/* CTA Button */}
              <motion.div variants={itemVariants} className="mb-12">
                <Button 
                  size="lg" 
                  onClick={handleStartCourse}
                  className="px-12 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  شروع دوره رایگان
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold text-foreground">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* What You'll Get Section */}
        <motion.section 
          className="py-20 bg-muted/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-7xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <SectionTitle 
                title="چی دریافت می‌کنی؟"
                subtitle="محتوای کاملاً رایگان و ارزشمند"
                align="center"
                isCentered
              />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {courseIncludes.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full border-2 border-muted hover:border-primary/40 transition-all duration-300 hover:shadow-lg group">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Sessions Breakdown */}
        <motion.section 
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-6xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <SectionTitle 
                title="برنامه جلسات"
                subtitle="۲ جلسه عملی و کاربردی که زندگی‌تان را تغییر می‌دهد"
                align="center"
                isCentered
              />
            </motion.div>

            <div className="space-y-8">
              {/* Session 1 */}
              <motion.div variants={itemVariants}>
                <Collapsible open={isSession1Open} onOpenChange={setIsSession1Open}>
                  <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                              <span className="text-primary-foreground font-bold text-xl">۱</span>
                            </div>
                            <div className="text-right space-y-2">
                              <h3 className="text-2xl font-bold text-foreground">
                                چرا مهارت AI دیگر اختیاری نیست؟
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-primary border-primary">از دوره کامل</Badge>
                                <Badge variant="outline">۶۰ دقیقه</Badge>
                              </div>
                            </div>
                          </div>
                          {isSession1Open ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 px-8 pb-8">
                        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 space-y-4">
                          <h4 className="text-lg font-semibold text-foreground mb-4">در این جلسه یاد می‌گیرید:</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>AI واقعاً چیست و چطور کار می‌کند</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>تأثیر AI روی شغل‌ها و زندگی روزمره</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>نمونه‌های واقعی کاربرد AI در زندگی</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>مهارت‌های ضروری برای عصر AI</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>بررسی کلی دوره کامل و مزایایش</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>پاسخ به سؤالات رایج درباره AI</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>

              {/* Session 2 */}
              <motion.div variants={itemVariants}>
                <Collapsible open={isSession2Open} onOpenChange={setIsSession2Open}>
                  <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center">
                              <span className="text-primary-foreground font-bold text-xl">۲</span>
                            </div>
                            <div className="text-right space-y-2">
                              <h3 className="text-2xl font-bold text-foreground">
                                چطور در ۲۴ ساعت با AI تغییر واقعی ایجاد کنیم؟
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-secondary border-secondary">انحصاری رایگان</Badge>
                                <Badge variant="outline">۹۰ دقیقه</Badge>
                                <Badge className="bg-orange-100 text-orange-700">عملی</Badge>
                              </div>
                            </div>
                          </div>
                          {isSession2Open ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 px-8 pb-8">
                        <div className="bg-gradient-to-r from-secondary/5 to-primary/5 rounded-xl p-6 space-y-4">
                          <h4 className="text-lg font-semibold text-foreground mb-4">این جلسه شامل:</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                              <span>تمرین زنده با ChatGPT و Gemini</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                              <span>نوشتن رزومه حرفه‌ای با AI</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                              <span>ایجاد برنامه غذایی شخصی‌سازی‌شده</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                              <span>صرفه‌جویی در زمان با اتوماسیون</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                              <span>کار با Canva AI، Suno، Lovable</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                              <span>چالش ۲۴ ساعته تغییر زندگی</span>
                            </div>
                          </div>
                          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <h5 className="font-semibold text-orange-800 mb-2">🎯 هدف این جلسه:</h5>
                            <p className="text-orange-700">
                              در پایان این جلسه، شما ابزارهای لازم برای شروع تغییر زندگی‌تان با AI را خواهید داشت 
                              و با اعتماد به نفس کامل، تصمیم می‌گیرید که آیا می‌خواهید در دوره کامل شرکت کنید یا نه.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Target Audience */}
        <motion.section 
          className="py-20 bg-muted/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-7xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <SectionTitle 
                title="این دوره برای کیه؟"
                subtitle="اگر در یکی از این گروه‌ها هستید، این دوره دقیقاً برای شماست"
                align="center"
                isCentered
              />
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {targetAudience.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full border-2 border-muted hover:border-primary/40 transition-all duration-300 hover:shadow-lg group">
                    <CardContent className="p-8 flex items-start gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Learning Outcomes */}
        <motion.section 
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-6xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <SectionTitle 
                title="بعد از این دوره چی بلد میشی؟"
                subtitle="مهارت‌ها و دانشی که کسب خواهید کرد"
                align="center"
                isCentered
              />
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
              {learningOutcomes.map((outcome, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold text-sm">{index + 1}</span>
                  </div>
                  <span className="text-lg text-foreground">{outcome}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Course Features */}
        <motion.section 
          className="py-20 bg-muted/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-7xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <SectionTitle 
                title="ویژگی‌های دوره"
                subtitle="همه چیز برای تجربه یادگیری بهتر"
                align="center"
                isCentered
              />
            </motion.div>

            <div className="grid lg:grid-cols-4 gap-8">
              {courseFeatures.map((feature, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full text-center border-2 border-muted hover:border-primary/40 transition-all duration-300 hover:shadow-lg group">
                    <CardContent className="p-8 space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section 
          className="py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-7xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <SectionTitle 
                title="نظرات دانشجوها"
                subtitle="تجربه واقعی کسانی که این مسیر را طی کرده‌اند"
                align="center"
                isCentered
              />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full border-2 border-muted hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-8 space-y-6">
                      <Quote className="w-8 h-8 text-primary/30" />
                      <p className="text-muted-foreground italic leading-relaxed">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center gap-4">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-muted">
                        <Badge className="bg-green-100 text-green-700">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {testimonial.result}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section 
          className="py-20 bg-muted/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-4xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <SectionTitle 
                title="سؤالات متداول"
                subtitle="پاسخ سؤالاتی که ممکن است برایتان پیش آمده باشد"
                align="center"
                isCentered
              />
            </motion.div>

            <div className="space-y-6">
              {faqItems.map((faq, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="border border-muted hover:border-primary/40 transition-colors">
                    <CardContent className="p-8">
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section 
          className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-5xl mx-auto px-6 text-center">
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-6xl font-black text-foreground leading-tight">
                  آماده‌ای زندگی هوشمندت رو 
                  <span className="text-primary"> شروع کنی؟</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  فقط ۲ جلسه فاصله داری تا با دنیای AI آشنا بشی و اولین قدم‌هات رو برای آینده‌ای بهتر برداری. 
                  کاملاً رایگان، بدون تعهد، بدون نیاز به کارت اعتباری.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <Badge variant="secondary" className="px-6 py-3 text-base">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  ۱۰۰% رایگان
                </Badge>
                <Badge variant="secondary" className="px-6 py-3 text-base">
                  <Infinity className="w-4 h-4 mr-2" />
                  دسترسی دائمی
                </Badge>
                <Badge variant="secondary" className="px-6 py-3 text-base">
                  <UserCheck className="w-4 h-4 mr-2" />
                  آکادمی رفیعی
                </Badge>
                <Badge variant="secondary" className="px-6 py-3 text-base">
                  <Headphones className="w-4 h-4 mr-2" />
                  با صدای مدرس
                </Badge>
              </div>

              <div className="space-y-4">
                <Button 
                  size="lg" 
                  onClick={handleStartCourse}
                  className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transform hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  <PlayCircle className="w-6 h-6 mr-3" />
                  همین حالا شروع کن - کاملاً رایگان
                </Button>
                <p className="text-sm text-muted-foreground">
                  ✅ بدون نیاز به کارت اعتباری • ✅ دسترسی فوری • ✅ بدون تعهد
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Mobile Sticky Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t lg:hidden z-50">
          <Button 
            onClick={handleStartCourse}
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-primary to-secondary"
            size="lg"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            شروع رایگان
          </Button>
        </div>

        {/* Modal */}
        <IframeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          url={iframeUrl}
          title={title}
        />
      </div>
    </MainLayout>
  );
};

export default SmartLifeEnhanced;