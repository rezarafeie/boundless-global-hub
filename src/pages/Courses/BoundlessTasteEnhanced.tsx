import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users, Award, Star, CheckCircle, MessageCircle, BookOpen, GraduationCap, Zap, Target, Globe, HeadphonesIcon, Download, Video, FileText, UserCheck, Gift, TrendingUp, Heart, ChevronRight, Shield, Rocket } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import IframeModal from "@/components/IframeModal";
import { useCourseSettings } from "@/hooks/useCourseSettings";
import MobileStickyButton from "@/components/MobileStickyButton";
import QuickEnrollPopover from "@/components/Course/QuickEnrollPopover";
import { useBlackFridayContext } from '@/contexts/BlackFridayContext';
import CourseDiscountBanner from '@/components/BlackFriday/CourseDiscountBanner';
import { supabase } from '@/integrations/supabase/client';
import AparatPlayer from "@/components/AparatPlayer";

interface BoundlessTasteEnhancedProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: "book" | "graduation" | "message";
  iframeUrl: string;
  courseSlug?: string;
}

const BoundlessTasteEnhanced: React.FC<BoundlessTasteEnhancedProps> = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType,
  iframeUrl,
  courseSlug
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const { isActive: isBlackFridayActive, getCourseDiscount } = useBlackFridayContext();
  const blackFridayDiscount = courseId ? getCourseDiscount(courseId) : 0;
  const {
    getEnrollUrl,
    loading: courseSettingsLoading
  } = useCourseSettings(courseSlug || '');

  // Fetch course ID and price on mount
  React.useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseSlug) return;
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, price')
          .eq('slug', courseSlug)
          .single();
        
        if (data && !error) {
          setCourseId(data.id);
          setCoursePrice(data.price);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      }
    };
    
    fetchCourseData();
  }, [courseSlug]);

  // Set countdown target for 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const endDateString = targetDate.toISOString();

  const handleStartCourse = () => {
    if (courseSlug) {
      const enrollUrl = getEnrollUrl(courseSlug, iframeUrl);
      
      if (enrollUrl === null) {
        return;
      }
      if (enrollUrl.startsWith('/')) {
        window.location.href = enrollUrl;
      } else {
        if (enrollUrl === iframeUrl) {
          setIsModalOpen(true);
        } else {
          window.open(enrollUrl, '_blank');
        }
      }
    } else {
      setIsModalOpen(true);
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

  const stats = [
    { number: "100,000+", label: "دانشجوی موفق", icon: Users },
    { number: "95%", label: "رضایت کامل", icon: Heart },
    { number: "24/7", label: "پشتیبانی آنلاین", icon: HeadphonesIcon },
    { number: "100%", label: "رایگان برای همیشه", icon: Gift }
  ];

  const testimonials = [
    {
      name: "دکتر محمد رضایی",
      role: "مدیرعامل شرکت نوآوری تک",
      image: "/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png",
      text: "این دوره نقطه عطف زندگی حرفه‌ای من بود. در عرض ۶ ماه درآمدم سه برابر شد.",
      result: "300% افزایش درآمد"
    },
    {
      name: "مهندس سارا احمدی",
      role: "بنیانگذار استارتاپ فین‌تک",
      image: "/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png",
      text: "مهارت‌هایی که از رفیعی یاد گرفتم، راه را برای موفقیت کسب‌وکارم هموار کرد.",
      result: "استارتاپ میلیاردی"
    },
    {
      name: "علی کریمی",
      role: "مشاور مالی و سرمایه‌گذار",
      image: "/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png",
      text: "بعد از گذراندن این دوره، توانستم پرتفولیوی سرمایه‌گذاری مطمئنی بسازم.",
      result: "پرتفولیو ۲ میلیاردی"
    }
  ];

  const courseFeatures = [
    {
      icon: Video,
      title: "بیش از ۲ ساعت آموزش ویدئویی",
      description: "محتوای ویدئویی با کیفیت و ساختار حرفه‌ای"
    },
    {
      icon: FileText,
      title: "کتابچه عملی راهنمای جامع",
      description: "راهنمای گام به گام پیاده‌سازی کسب‌وکار بین‌المللی"
    },
    {
      icon: Users,
      title: "پشتیبانی قدم به قدم",
      description: "بررسی تمرینات و تکالیف و پاسخ‌گویی به سوالات"
    },
    {
      icon: HeadphonesIcon,
      title: "مشاوره رایگان",
      description: "مشاوره رایگان با مشاوران آکادمی رفیعی"
    },
    {
      icon: Award,
      title: "سنجش هوشمند بدون مرز",
      description: "بررسی و انتخاب دقیق‌تر مسیر کسب‌وکار بین‌المللی"
    },
    {
      icon: Download,
      title: "دسترسی کامل مادام‌العمر",
      description: "امکان دسترسی دائمی به تمام محتواها و بروزرسانی‌ها"
    }
  ];

  const modules = [
    "ذهنیت بدون مرز برای شروع مسیر بین‌المللی",
    "ایکامرس با مدل دراپ شیپینگ",
    "فروش خدمات با مدل دراپ سرویسینگ",
    "فروش فایل با مدل دیجیتال گودز",
    "فروش خدمات هوش مصنوعی",
    "زیرساخت‌های کسب‌وکار بین‌المللی"
  ];

  return (
    <MainLayout>
      {/* Black Friday Discount Banner */}
      {isBlackFridayActive && blackFridayDiscount > 0 && courseId && courseSlug && (
        <div className="container mx-auto px-4 pt-8">
          <CourseDiscountBanner 
            discount={blackFridayDiscount} 
            courseName={title}
            originalPrice={coursePrice}
            courseSlug={courseSlug}
          />
        </div>
      )}

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
                بیش از ۱۰۰ هزار دانشجوی موفق
              </Badge>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight" 
              variants={itemVariants}
            >
              {title}
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-primary font-semibold mb-4" 
              variants={itemVariants}
            >
              {englishTitle}
            </motion.p>

            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed" 
              variants={itemVariants}
            >
              {description}
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="mb-8">
              <QuickEnrollPopover courseSlug={courseSlug || ''}>
                <Button 
                  onClick={handleStartCourse}
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-6 h-6 ml-3" />
                  شروع دوره رایگان
                  <ChevronRight className="w-6 h-6 mr-3" />
                </Button>
              </QuickEnrollPopover>
              <p className="text-sm text-muted-foreground mt-3">
                ✨ ثبت‌نام رایگان بدون نیاز به کارت بانکی
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
              ⏰ پیشنهاد ویژه تا پایان تابستان
            </h3>
            <p className="text-muted-foreground">
              دسترسی رایگان به بونوس‌های اختصاصی تا:
            </p>
          </div>
          <CountdownTimer endDate={endDateString} />
        </div>
      </section>

      {/* Course Modules */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6">
              📚 محتوای دوره (۶ فصل تخصصی)
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              یادگیری کامل مدل‌های کسب‌وکار بدون مرز و زیرساخت‌های لازم برای بین‌المللی شدن
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-black">
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-foreground mb-3 text-sm leading-tight">
                      {module}
                    </h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional detailed breakdown for the infrastructure module */}
          <motion.div className="mt-16" variants={itemVariants}>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                  🏗️ زیرساخت‌های کسب‌وکار بین‌المللی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">نقدکردن درآمد</h4>
                    <p className="text-sm text-muted-foreground">روش‌های مختلف تبدیل درآمد ارزی به ریال</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">افتتاح حساب</h4>
                    <p className="text-sm text-muted-foreground">راهنمای افتتاح حساب‌های بین‌المللی</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">ثبت شرکت</h4>
                    <p className="text-sm text-muted-foreground">مراحل تأسیس شرکت در کشورهای مختلف</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">ارتباطات</h4>
                    <p className="text-sm text-muted-foreground">شبکه‌سازی و برقراری ارتباط مؤثر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6">
              🏆 شاهدان موفقیت
            </h2>
            <p className="text-lg text-muted-foreground">
              داستان‌های واقعی از دانشجویانی که زندگی‌شان تغییر کرده
            </p>
          </motion.div>

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

      {/* Course Features */}
      <motion.section 
        className="py-16 bg-background" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto px-6">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6">
              💎 امکانات ویژه دوره
            </h2>
            <p className="text-lg text-muted-foreground">
              تمام ابزارها و امکانات لازم برای شروع موفق کسب‌وکار بین‌المللی
            </p>
          </motion.div>

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

      {/* Final CTA */}
      <motion.section 
        className="py-16 bg-primary/5" 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-6">
              🚀 آماده‌اید تحول شگرف را شروع کنید؟
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              بیش از ۱۰۰ هزار نفر قبل از شما این انتخاب را کردند و زندگی‌شان تغییر کرد. نوبت شماست!
            </p>
            
            <div className="hidden md:block">
              <QuickEnrollPopover courseSlug={courseSlug || ''}>
                <Button 
                  onClick={handleStartCourse}
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Rocket className="w-6 h-6 ml-3" />
                  شروع تحول همین الان
                  <ChevronRight className="w-6 h-6 mr-3" />
                </Button>
              </QuickEnrollPopover>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                ۱۰۰٪ رایگان
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                بدون تعهد
              </div>
              <div className="flex items-center gap-2">
                <HeadphonesIcon className="w-4 h-4" />
                پشتیبانی ۲۴/۷
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Mobile Sticky Button */}
      <QuickEnrollPopover courseSlug={courseSlug || ''}>
        <MobileStickyButton onClick={handleStartCourse}>
          شروع دوره رایگان
        </MobileStickyButton>
      </QuickEnrollPopover>

      <IframeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="مزه بدون مرز"
        url={iframeUrl}
      />
    </MainLayout>
  );
};

export default BoundlessTasteEnhanced;