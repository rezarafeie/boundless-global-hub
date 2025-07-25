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
  const {
    getEnrollUrl,
    loading: courseSettingsLoading
  } = useCourseSettings(courseSlug || '');

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
      title: "محتوای ویدئویی اختصاصی",
      description: "بیش از ۱۰ ساعت آموزش ویدئویی با کیفیت ۴K"
    },
    {
      icon: FileText,
      title: "کتابچه عملی ۱۰۰ صفحه‌ای",
      description: "راهنمای جامع گام به گام برای پیاده‌سازی"
    },
    {
      icon: Users,
      title: "انجمن اختصاصی",
      description: "عضویت در کامیونیتی ۱۰۰ هزار نفری موفقین"
    },
    {
      icon: Award,
      title: "گواهی معتبر بین‌المللی",
      description: "مدرک قابل ارائه در LinkedIn و رزومه"
    },
    {
      icon: HeadphonesIcon,
      title: "پشتیبانی مادام‌العمر",
      description: "دسترسی دائمی به تیم پشتیبانی متخصص"
    },
    {
      icon: Download,
      title: "دسترسی آفلاین",
      description: "امکان دانلود و مطالعه بدون اینترنت"
    }
  ];

  const modules = [
    "فلسفه موفقیت در کسب‌وکار بین‌المللی",
    "شناسایی و ارزیابی فرصت‌های طلایی",
    "طراحی مدل کسب‌وکار نوآورانه",
    "استراتژی‌های بازاریابی دیجیتال پیشرفته",
    "مدیریت ریسک و سرمایه‌گذاری هوشمند"
  ];

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
              <Button 
                onClick={handleStartCourse}
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-6 h-6 ml-3" />
                شروع دوره رایگان
                <ChevronRight className="w-6 h-6 mr-3" />
              </Button>
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
              📚 محتوای دوره (۵ فصل تخصصی)
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              هر فصل طراحی شده تا مرحله‌ای از تحول شخصی و حرفه‌ای شما را تکمیل کند
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
              💎 امکانات اختصاصی دوره
            </h2>
            <p className="text-lg text-muted-foreground">
              همه چیزی که برای موفقیت نیاز دارید در یک مکان
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
              <Button 
                onClick={handleStartCourse}
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Rocket className="w-6 h-6 ml-3" />
                شروع تحول همین الان
                <ChevronRight className="w-6 h-6 mr-3" />
              </Button>
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
      <MobileStickyButton onClick={handleStartCourse}>
        شروع دوره رایگان
      </MobileStickyButton>

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