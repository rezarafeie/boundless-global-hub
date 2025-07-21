import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Clock, 
  Users, 
  Award, 
  Star, 
  CheckCircle, 
  MessageCircle, 
  BookOpen, 
  GraduationCap,
  Zap,
  Target,
  Globe,
  HeadphonesIcon,
  Download,
  Video,
  FileText,
  UserCheck,
  Gift,
  TrendingUp,
  Heart
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import IframeModal from "@/components/IframeModal";
import { useCourseSettings } from "@/hooks/useCourseSettings";

interface FreeCourseLandingProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: "book" | "graduation" | "message";
  iframeUrl: string;
  courseSlug?: string; // Optional course slug for merge functionality
}

const FreeCourseLanding: React.FC<FreeCourseLandingProps> = ({
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
  const { getEnrollUrl } = useCourseSettings(courseSlug || '');
  
  // Set countdown target for 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const endDateString = targetDate.toISOString();

  const getIcon = () => {
    switch (iconType) {
      case "book":
        return <BookOpen size={64} className="text-blue-500" />;
      case "graduation":
        return <GraduationCap size={64} className="text-green-500" />;
      case "message":
        return <MessageCircle size={64} className="text-purple-500" />;
      default:
        return <BookOpen size={64} className="text-blue-500" />;
    }
  };

  const handleStartCourse = () => {
    if (courseSlug) {
      const enrollUrl = getEnrollUrl(courseSlug, iframeUrl);
      
      if (enrollUrl.startsWith('/')) {
        // Internal URL - navigate directly
        window.location.href = enrollUrl;
      } else {
        // External URL - open modal or new tab
        if (enrollUrl === iframeUrl) {
          setIsModalOpen(true);
        } else {
          window.open(enrollUrl, '_blank');
        }
      }
    } else {
      // Default behavior - open modal
      setIsModalOpen(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const courseModules = [
    "مقدمه و هدف‌گذاری هوشمند",
    "تحلیل وضعیت فعلی و شناسایی فرصت‌ها",
    "برنامه‌ریزی استراتژیک و عملی",
    "اجرا و پیاده‌سازی موثر",
    "ارزیابی نتایج و بهبود مستمر"
  ];

  const detailedFeatures = [
    { icon: Video, title: "ویدئوهای آموزشی HD", desc: "محتوای تصویری با کیفیت بالا و صدای واضح" },
    { icon: FileText, title: "منابع تکمیلی رایگان", desc: "فایل‌های PDF، چک‌لیست‌ها و کتابچه‌های کاربردی" },
    { icon: Users, title: "انجمن ۱۰ هزار نفری", desc: "ارتباط با هزاران دانشجوی موفق و انگیزه‌بخش" },
    { icon: HeadphonesIcon, title: "پشتیبانی رایگان", desc: "پاسخ سوالات توسط تیم متخصص در کمتر از ۲۴ ساعت" },
    { icon: Award, title: "گواهی معتبر دیجیتال", desc: "دریافت مدرک قابل اشتراک در LinkedIn و CV" },
    { icon: Download, title: "دانلود محتوا", desc: "امکان دسترسی آفلاین و مطالعه در هر زمان و مکان" }
  ];

  const successStories = [
    {
      name: "محمد احمدی",
      result: "درآمد ماهانه ۳ میلیون تومان",
      text: "با این دوره رایگان یاد گرفتم چطور شروع کنم. حالا کسب‌وکار خودم رو دارم!"
    },
    {
      name: "فاطمه کریمی", 
      result: "ارتقا شغلی در ۶ ماه",
      text: "مهارت‌هایی که یاد گرفتم باعث شد توی کارم ترفیع بگیرم."
    },
    {
      name: "علی رضایی",
      result: "اعتماد به نفس ۱۰۰٪ بیشتر",
      text: "خیلی چیزها درباره خودم یاد گرفتم که نمی‌دونستم."
    }
  ];

  const whyStartNow = [
    { icon: Zap, title: "شروع فوری", desc: "بلافاصله بعد از ثبت‌نام دسترسی کامل پیدا می‌کنید" },
    { icon: TrendingUp, title: "نتایج سریع", desc: "از همان هفته اول تغییرات مثبت را احساس خواهید کرد" },
    { icon: Heart, title: "بدون استرس", desc: "آرام و با سرعت خودتان پیش بروید، هیچ فشاری نیست" },
    { icon: Gift, title: "کاملاً رایگان", desc: "هیچ هزینه مخفی یا التزامی ندارد، همه چیز رایگان است" }
  ];

  const supportInfo = [
    "📱 دسترسی ۲۴/۷ به محتوای دوره از طریق موبایل و کامپیوتر",
    "💬 پشتیبانی رایگان در گروه تلگرام اختصاصی دانشجویان", 
    "📊 ردیابی پیشرفت شخصی و تنظیم اهداف هوشمند",
    "🎯 راهنمایی گام به گام برای شروع و ادامه مسیر یادگیری"
  ];

  return (
    <MainLayout>
      {/* Hero Section - Enhanced */}
      <section className="bg-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="container max-w-4xl mx-auto relative z-10">
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="flex justify-center mb-8"
              variants={itemVariants}
            >
              <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-blue-100">
                {getIcon()}
              </div>
            </motion.div>
            
            <motion.div className="mb-4" variants={itemVariants}>
              <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-4 py-2">
                🎉 کاملاً رایگان - ویژه تابستان ۱۴۰۳
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-4"
              variants={itemVariants}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              className="text-xl text-blue-600 mb-2 font-medium"
              variants={itemVariants}
            >
              {englishTitle}
            </motion.p>
            
            <motion.p 
              className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              {description}
            </motion.p>

            {/* Motivation callout */}
            <motion.div 
              className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-2xl mb-8"
              variants={itemVariants}
            >
              <p className="text-lg font-semibold text-gray-800 mb-2">
                🚀 بیش از ۵۰,۰۰۰ نفر تا الان شرکت کردند!
              </p>
              <p className="text-gray-600">
                هر روز که معطل می‌کنید، فرصت‌های طلایی از دستتان می‌رود
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Button 
                onClick={handleStartCourse}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-full px-12 py-6 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="mr-3" size={24} />
                شروع رایگان همین الان
              </Button>
              <p className="text-sm text-gray-500 mt-3">✨ ثبت‌نام رایگان - بدون نیاز به کارت اعتباری</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Countdown Timer */}
      <section className="py-8 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <CountdownTimer endDate={endDateString} />
        </div>
      </section>

      {/* Why Start Immediately */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              چرا همین الان شروع کنید؟
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              هر لحظه‌ای که صبر کنید، از فرصت‌های ارزشمند محروم می‌شوید
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyStartNow.map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <item.icon className="text-blue-600" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* What You'll Learn - Enhanced */}
      <motion.section 
        className="py-16 bg-gradient-to-br from-blue-50 to-purple-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              چه چیزی یاد خواهید گرفت؟
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              این دوره رایگان شامل محتوای ارزشمند و کاربردی است که زندگی‌تان را متحول خواهد کرد
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        🎯 مزیت کلیدی اول
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefitOne}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="text-blue-600" size={24} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        ⚡ مزیت کلیدی دوم
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefitTwo}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Course Modules - Enhanced */}
          <motion.div variants={itemVariants} className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📚 محتوای دوره (۵ فصل کاربردی)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {courseModules.map((module, index) => (
                <Card key={index} className="text-center border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{module}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Success Stories - Enhanced */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto text-center">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-12"
            variants={itemVariants}
          >
            🏆 داستان‌های موفقیت دانشجویان ما
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-0 shadow-lg h-full bg-gradient-to-br from-yellow-50 to-orange-50">
                  <CardContent className="p-8">
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={20} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
                      {story.result}
                    </div>
                    <p className="text-gray-600 mb-6 italic leading-relaxed">
                      "{story.text}"
                    </p>
                    <div className="font-semibold text-gray-900">
                      {story.name}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Support & Features */}
      <motion.section 
        className="py-16 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              💎 پشتیبانی و امکانات ویژه
            </h2>
            <p className="text-lg text-gray-600">
              همه چیزی که برای موفقیت نیاز دارید، رایگان در اختیار شماست
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {detailedFeatures.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <feature.icon className="text-blue-600" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Support Instructions */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">
                  🤝 راهنمای کامل پشتیبانی و هدایا
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {supportInfo.map((info, index) => (
                    <div key={index} className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                      <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-sm font-medium">{info}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Who This Course is For */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-8"
            variants={itemVariants}
          >
            این دوره برای چه کسانی است؟
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "افراد با انگیزه", desc: "کسانی که می‌خواهند زندگی‌شان را تغییر دهند" },
              { icon: UserCheck, title: "مبتدیان", desc: "هیچ تجربه قبلی لازم نیست" },
              { icon: Globe, title: "همه سنین", desc: "مناسب برای تمام گروه‌های سنی" }
            ].map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <item.icon className="text-gray-600" size={24} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Instructor Credentials */}
      <motion.section 
        className="py-16 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-8"
            variants={itemVariants}
          >
            درباره مدرس
          </motion.h2>
          
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users size={32} className="text-gray-600" />
                  </div>
                  <div className="text-center md:text-right flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">رضا رفیعی</h3>
                    <p className="text-gray-600 mb-4">
                      مدرس و مشاور با بیش از ۱۰ سال تجربه در حوزه توسعه فردی و کسب‌وکار
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <Badge variant="outline">مدرس معتبر</Badge>
                      <Badge variant="outline">نویسنده</Badge>
                      <Badge variant="outline">مشاور کسب‌وکار</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto text-center">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-12"
            variants={itemVariants}
          >
            نظرات دانشجویان
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "علی احمدی",
                text: "این دوره واقعاً زندگی من را تغییر داد. محتوای فوق‌العاده‌ای داشت.",
                rating: 5
              },
              {
                name: "مریم کریمی",
                text: "روش تدریس بسیار عملی و کاربردی بود. همه را توصیه می‌کنم.",
                rating: 5
              },
              {
                name: "محمد نوری",
                text: "بهترین سرمایه‌گذاری که روی خودم کردم. ممنون از تیم رفیعی.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-8">
                    <div className="flex justify-center mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} size={20} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Enhanced FAQ Section */}
      <motion.section 
        className="py-16 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              سوالات متداول
            </h2>
            <p className="text-lg text-gray-600">
              پاسخ سوالات رایج در مورد این دوره
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {[
              {
                question: "آیا این دوره واقعاً رایگان است؟",
                answer: "بله، این دوره کاملاً رایگان است و هیچ هزینه‌ای دریافت نمی‌شود. فقط کافی است ثبت‌نام کنید."
              },
              {
                question: "چقدر زمان برای تکمیل نیاز است؟",
                answer: "بسته به سرعت یادگیری شما، معمولاً بین ۲ تا ۴ ساعت زمان نیاز است. می‌توانید در زمان دلخواه خود مطالعه کنید."
              },
              {
                question: "آیا پشتیبانی دارد؟",
                answer: "بله، از طریق انجمن دانشجویان و سیستم پشتیبانی می‌توانید سوالات خود را مطرح کنید و پاسخ دریافت کنید."
              },
              {
                question: "آیا گواهی تکمیل دریافت می‌کنم؟",
                answer: "بله، پس از تکمیل موفقیت‌آمیز دوره، گواهی معتبر تکمیل دریافت خواهید کرد."
              },
              {
                question: "آیا امکان دانلود محتوا وجود دارد؟",
                answer: "بله، می‌توانید محتوای دوره را برای مطالعه آفلاین دانلود کنید."
              }
            ].map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA - Enhanced */}
      <motion.section 
        className="py-16 bg-gradient-to-r from-black via-gray-900 to-black text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl font-bold mb-6"
            variants={itemVariants}
          >
            🎯 آماده تحول بزرگ زندگی‌تان هستید؟
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 mb-8"
            variants={itemVariants}
          >
            هزاران نفر قبل از شما این تصمیم را گرفتند و زندگی‌شان تغییر کرد
          </motion.p>
          <motion.div variants={itemVariants} className="space-y-6">
            <Button 
              onClick={handleStartCourse}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 rounded-full px-12 py-6 text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Play className="mr-3" size={24} />
              شروع رایگان - همین الان!
            </Button>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-sm text-gray-300 mb-2">
                ✅ ثبت‌نام رایگان - بدون نیاز به کارت اعتباری
              </p>
              <p className="text-sm text-gray-300 mb-2">
                ⚡ دسترسی فوری - بلافاصله شروع کنید
              </p>
              <p className="text-sm text-gray-300">
                🎁 همراه با هدایای ارزشمند
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Course Modal */}
      <IframeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        url={iframeUrl}
      />
    </MainLayout>
  );
};

export default FreeCourseLanding;
