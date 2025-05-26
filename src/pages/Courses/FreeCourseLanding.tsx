
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import IframeModal from "@/components/IframeModal";
import CountdownTimer from "@/components/CountdownTimer";
import { MessageCircle, Book, GraduationCap, FileText, Check, Star, Users, Clock, Gift } from "lucide-react";
import { motion } from "framer-motion";

interface FreeCourseLandingProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: "message" | "book" | "graduation" | "file";
  iframeUrl: string;
}

const FreeCourseLanding = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType,
  iframeUrl,
}: FreeCourseLandingProps) => {
  const { translations } = useLanguage();
  const [showIframeModal, setShowIframeModal] = useState(false);

  const IconComponent = {
    message: MessageCircle,
    book: Book,
    graduation: GraduationCap,
    file: FileText
  }[iconType];

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedIframeUrl = iframeUrl.replace('rafeie.com', 'auth.rafiei.co');

  // Set countdown target for 3 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  const endDateString = targetDate.toISOString();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const childVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 pt-24 pb-20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="glow-circle glow-circle-1 animate-pulse"></div>
          <div className="glow-circle glow-circle-2 animate-float-fast"></div>
          <div className="glow-circle glow-circle-3 animate-pulse animation-delay-1000"></div>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[10px] z-0"></div>
        </div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full mb-6 shadow-lg">
              <IconComponent size={40} className="text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xl text-gray-600 mb-2">{englishTitle}</p>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
              {description}
            </p>
            
            <Button 
              onClick={() => setShowIframeModal(true)}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-full px-12 py-6 text-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              {translations.startFreeCourse}
            </Button>
          </motion.div>

          {/* Countdown Timer */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CountdownTimer endDate={endDateString} />
          </motion.div>
        </div>
      </section>

      {/* Course Benefits */}
      <motion.section 
        className="py-16 bg-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={childVariants}>
            <h2 className="text-3xl font-bold mb-4">چرا این دوره را انتخاب کنید؟</h2>
            <p className="text-lg text-gray-600">مزایای فوق‌العاده‌ای که در انتظار شماست</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div variants={childVariants}>
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={24} className="text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">رایگان و کامل</h3>
                  <p className="text-sm text-gray-600">{benefitOne}</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={childVariants}>
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift size={24} className="text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">ارزش افزوده</h3>
                  <p className="text-sm text-gray-600">{benefitTwo}</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={childVariants}>
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={24} className="text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">دسترسی مادام‌العمر</h3>
                  <p className="text-sm text-gray-600">یکبار ثبت‌نام کنید، تا ابد استفاده کنید</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Course Details */}
      <motion.section 
        className="py-16 bg-gray-50"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={childVariants}>
            <h2 className="text-3xl font-bold mb-4">در این دوره چه خواهید آموخت؟</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={childVariants}>
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">محتوای دوره شامل:</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Check size={20} className="text-primary mt-0.5" />
                      <p>آموزش گام به گام از مبتدی تا پیشرفته</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check size={20} className="text-primary mt-0.5" />
                      <p>مثال‌های عملی و پروژه‌های کاربردی</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check size={20} className="text-primary mt-0.5" />
                      <p>فایل‌های تمرینی و منابع تکمیلی</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check size={20} className="text-primary mt-0.5" />
                      <p>پشتیبانی و پاسخ به سوالات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={childVariants}>
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">این دوره برای چه کسانی است؟</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Users size={20} className="text-primary mt-0.5" />
                      <p>افرادی که می‌خواهند مهارت جدیدی یاد بگیرند</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users size={20} className="text-primary mt-0.5" />
                      <p>کسانی که به دنبال یادگیری عملی هستند</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users size={20} className="text-primary mt-0.5" />
                      <p>افرادی که وقت محدودی برای آموزش دارند</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users size={20} className="text-primary mt-0.5" />
                      <p>علاقه‌مندان به یادگیری آنلاین</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-16 bg-gradient-to-r from-primary to-secondary text-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container max-w-6xl mx-auto text-center">
          <motion.h2 className="text-3xl font-bold mb-12" variants={childVariants}>
            نظرات دانشجویان
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div variants={childVariants}>
              <Card className="bg-white/10 backdrop-blur-sm border-0 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm mb-4">
                    "عالی بود! خیلی چیزهای جدید یاد گرفتم."
                  </p>
                  <p className="font-medium">احمد رضایی</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={childVariants}>
              <Card className="bg-white/10 backdrop-blur-sm border-0 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm mb-4">
                    "محتوای فوق‌العاده و آموزش عملی!"
                  </p>
                  <p className="font-medium">فاطمه احمدی</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={childVariants}>
              <Card className="bg-white/10 backdrop-blur-sm border-0 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm mb-4">
                    "پیشنهاد می‌کنم حتماً ببینید."
                  </p>
                  <p className="font-medium">علی محمدی</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        className="py-16 bg-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container max-w-4xl mx-auto">
          <motion.div className="text-center mb-12" variants={childVariants}>
            <h2 className="text-3xl font-bold mb-4">سوالات متداول</h2>
          </motion.div>
          
          <motion.div className="space-y-6" variants={childVariants}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">آیا این دوره واقعاً رایگان است؟</h3>
                <p className="text-gray-600">بله، کاملاً رایگان و بدون هیچ هزینه‌ای.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">چقدر زمان نیاز دارم؟</h3>
                <p className="text-gray-600">می‌توانید در زمان خودتان و با سرعت دلخواه پیش بروید.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">آیا گواهی دریافت می‌کنم؟</h3>
                <p className="text-gray-600">پس از تکمیل دوره، گواهی شرکت دریافت خواهید کرد.</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section 
        className="py-16 bg-gradient-to-r from-gray-900 to-gray-700 text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">آماده شروع هستید؟</h2>
          <p className="text-lg mb-8">همین الان ثبت‌نام کنید و شروع به یادگیری کنید</p>
          
          <Button 
            onClick={() => setShowIframeModal(true)}
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-12 py-6 text-xl font-semibold transform hover:scale-105 transition-all duration-300"
          >
            {translations.startFreeCourse}
          </Button>
        </div>
      </motion.section>

      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title={title}
        url={updatedIframeUrl}
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
        
        .animate-pulse {
          animation: pulse 6s infinite ease-in-out;
        }
        
        .animate-float-fast {
          animation: float-fast 12s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
        }
        
        .glow-circle-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(147,112,219,0.3) 0%, rgba(147,112,219,0) 70%);
          top: -100px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(65,105,225,0.25) 0%, rgba(65,105,225,0) 70%);
          bottom: -150px;
          left: 15%;
        }
        
        .glow-circle-3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(123,104,238,0.3) 0%, rgba(123,104,238,0) 70%);
          top: 40%;
          left: 50%;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default FreeCourseLanding;
