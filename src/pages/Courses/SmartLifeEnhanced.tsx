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
  ChevronUp
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MainLayout from "@/components/Layout/MainLayout";

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

  // Course stats
  const stats = [
    { icon: Users, number: "3000+", label: "دانشجو" },
    { icon: Star, number: "4.9", label: "رضایت" },
    { icon: Clock, number: "2", label: "جلسه" },
    { icon: Award, number: "100%", label: "رایگان" }
  ];

  // What you'll get items
  const courseIncludes = [
    "دسترسی کامل به جلسه ۱ دوره پرمیوم (AI Mindset & Foundation)",
    "جلسه بونوس انحصاری: «چطور در ۲۴ ساعت با AI تغییر واقعی ایجاد کنیم»",
    "کاربردهای عملی با ابزارهای ChatGPT، Gemini، Canva، Suno و...",
    "تمپلیت‌های Smart Prompt و چالش ۲۴ ساعته",
    "پیش‌نمایش ساختار کامل دوره پرمیوم"
  ];

  // Who this is for
  const targetAudience = [
    "کنجکاو درباره AI هستی اما نمی‌دونی از کجا شروع کنی",
    "می‌خوای بهره‌وری یا خلاقیت‌ت رو افزایش بدی",
    "دانشجو، کارمند، فریلنسر یا صاحب کسب‌وکار هستی",
    "درباره ابزارهای AI شنیدی اما هنوز استفاده نکردی"
  ];

  // Why join reasons
  const whyJoinReasons = [
    { icon: Brain, title: "درک واضح از کاربرد AI در زندگی واقعی" },
    { icon: Zap, title: "تست عملی ابزارها بدون استرس فنی" },
    { icon: Target, title: "پیش‌نمایش دوره پرمیوم با اعتماد ۳۰۰۰+ دانشجو" },
    { icon: Award, title: "مدرس واقعی. صدای واقعی. تأثیر واقعی." }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "آیا نیاز به تجربه قبلی AI دارم؟",
      answer: "❌ خیر، این دوره برای مبتدیان طراحی شده است"
    },
    {
      question: "واقعاً رایگان است؟",
      answer: "✅ بله، کاملاً رایگان و بدون نیاز به کارت اعتباری"
    },
    {
      question: "آیا فوراً دسترسی خواهم داشت؟",
      answer: "✅ بله، بلافاصله پس از ثبت‌نام"
    },
    {
      question: "آیا بعداً می‌توانم در دوره کامل شرکت کنم؟",
      answer: "✅ البته! نحوه شرکت را به شما نشان خواهیم داد"
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <motion.section 
          className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
          <div className="container max-w-7xl mx-auto px-6 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div variants={itemVariants} className="space-y-8">
                <div className="space-y-4">
                  <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                    دوره رایگان AI
                  </Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                    <span className="text-primary">۲ جلسه رایگان</span>
                    <br />
                    برای شروع زندگی هوشمند با AI
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    با ۲ قدم ساده، یاد بگیر چطور هوش مصنوعی می‌تونه زندگی شخصی و کاری‌تو متحول کنه
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="px-3 py-1">
                    بدون نیاز به دانش قبلی
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    دسترسی آنی
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    ۲ مدرس متخصص
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={handleStartCourse}
                    className="px-8 py-4 text-lg font-semibold"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    ثبت‌نام رایگان در دوره
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                  {stats.map((stat, index) => (
                    <motion.div 
                      key={index}
                      variants={itemVariants}
                      className="text-center"
                    >
                      <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{stat.number}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-3xl opacity-20" />
                  <div className="relative bg-background/80 backdrop-blur-sm rounded-3xl p-8 border border-primary/20">
                    <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                      <Brain className="w-24 h-24 text-primary" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* What You'll Get Section */}
        <motion.section 
          className="py-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-6xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                چی دریافت می‌کنی؟
              </h2>
              <p className="text-xl text-muted-foreground">
                محتوای کاملاً رایگان و بدون تعهد
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {courseIncludes.map((item, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="flex items-start gap-4"
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-lg text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Sessions Breakdown */}
        <motion.section 
          className="py-16 bg-muted/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-6xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                برنامه جلسات
              </h2>
              <p className="text-xl text-muted-foreground">
                ۲ جلسه عملی و کاربردی
              </p>
            </motion.div>

            <div className="space-y-6">
              {/* Session 1 */}
              <motion.div variants={itemVariants}>
                <Collapsible open={isSession1Open} onOpenChange={setIsSession1Open}>
                  <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                              <span className="text-primary-foreground font-bold">۱</span>
                            </div>
                            <div className="text-right">
                              <h3 className="text-xl font-bold text-foreground">
                                چرا مهارت AI دیگر اختیاری نیست
                              </h3>
                              <p className="text-muted-foreground">از دوره کامل</p>
                            </div>
                          </div>
                          {isSession1Open ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 px-6 pb-6">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>AI واقعاً چیست</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>چطور روی شغل و زندگی روزمره تأثیر می‌گذارد</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>نمونه‌هایی از کاربردهای واقعی</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>مهارت‌های آینده در عصر AI</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>بررسی کلی محتوای دوره کامل</span>
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
                  <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center">
                              <span className="text-primary-foreground font-bold">۲</span>
                            </div>
                            <div className="text-right">
                              <h3 className="text-xl font-bold text-foreground">
                                چطور در ۲۴ ساعت با AI تغییر واقعی ایجاد کنیم
                              </h3>
                              <p className="text-muted-foreground">انحصاری دوره رایگان</p>
                            </div>
                          </div>
                          {isSession2Open ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 px-6 pb-6">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            <span>تمرین عملی با ChatGPT یا Gemini</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            <span>مثال‌های واقعی: نوشتن رزومه، ایجاد رژیم، صرفه‌جویی در زمان</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            <span>دموی زنده AI prompting</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            <span>معرفی کوتاه ابزارهای Canva AI، Suno، Lovable</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            <span>پایان با دعوت قوی برای پیوستن به دوره کامل</span>
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

        {/* Who This Is For */}
        <motion.section 
          className="py-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-6xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                این دوره برای کیه؟
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {targetAudience.map((item, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="flex items-start gap-4"
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-lg text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Why Join */}
        <motion.section 
          className="py-16 bg-muted/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-6xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                چرا در این دوره رایگان شرکت کنی؟
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {whyJoinReasons.map((reason, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <reason.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {reason.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section 
          className="py-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <div className="container max-w-4xl mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                سؤالات متداول
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="border border-muted">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground">
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
          <div className="container max-w-4xl mx-auto px-6 text-center">
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
                  آماده‌ای زندگی هوشمندت رو شروع کنی؟
                </h2>
                <p className="text-xl text-muted-foreground">
                  همین حالا ثبت‌نام کن و دوره رایگان رو شروع کن
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <Badge variant="secondary" className="px-4 py-2">
                  محتوای رایگان
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  توسط آکادمی رفیعی
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  با صدای مدرس
                </Badge>
              </div>

              <Button 
                size="lg" 
                onClick={handleStartCourse}
                className="px-12 py-4 text-xl font-semibold"
              >
                <PlayCircle className="w-6 h-6 mr-2" />
                همین حالا ثبت‌نام کن
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Mobile Sticky Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t lg:hidden z-50">
          <Button 
            onClick={handleStartCourse}
            className="w-full py-4 text-lg font-semibold"
            size="lg"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            ثبت‌نام رایگان
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