import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Users, 
  Clock, 
  Trophy,
  CheckCircle,
  Globe,
  BookOpen,
  Video,
  Download,
  Award,
  Target,
  Lightbulb
} from "lucide-react";
import IframeModal from "@/components/IframeModal";
import EnhancedCountdownTimer from "@/components/EnhancedCountdownTimer";
import LiveEnrollmentCounter from "@/components/LiveEnrollmentCounter";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";

const BoundlessTastePage = () => {
  const [showIframeModal, setShowIframeModal] = useState(false);
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Enhanced Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-pink-950/40"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-400/25 to-orange-400/25 rounded-full blur-3xl animate-pulse animation-delay-400"></div>
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
                  دوره رایگان
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                طعم شروع بدون مرز
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium leading-relaxed max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                اولین قدم برای ورود به دنیای کسب‌وکارهای بین‌المللی
              </motion.p>

              {/* Live Enrollment Counter */}
              <motion.div 
                className="mb-8 flex justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <LiveEnrollmentCounter 
                  initialCount={51378}
                  courseName="boundless-taste"
                />
              </motion.div>

              {/* Course Status Alert */}
              <motion.div 
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-xl p-6 mb-12 max-w-xl mx-auto shadow-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center ml-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">دوره رایگان</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  این دوره به صورت کاملاً رایگان در اختیار شما قرار گرفته است. برای بهره‌مندی از محتوای دوره، کافیست ثبت‌نام کنید.
                </p>
                
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-gradient-to-r hover:from-green-600 hover:to-teal-600 shadow-md"
                >
                  <CheckCircle className="ml-2" size={14} />
                  ثبت‌نام رایگان
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Enhanced Countdown Timer Section */}
        <section className="py-16 bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-pink-950/30">
          <div className="container max-w-4xl mx-auto px-4">
            <motion.div 
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-700 rounded-3xl p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <EnhancedCountdownTimer 
                endDate={new Date(2025, 5, 15, 23, 59, 59).toISOString()}
                label="تا پایان ثبت‌نام"
                className="mx-auto"
              />
            </motion.div>
          </div>
        </section>

        {/* Course Description */}
        <section className="py-20 bg-gradient-to-br from-teal-50/60 to-green-50/60 dark:from-teal-950/20 dark:to-green-950/20">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="درباره دوره طعم شروع بدون مرز" 
              subtitle="اولین قدم برای ورود به دنیای کسب‌وکارهای بین‌المللی"
              icon={<Globe className="w-8 h-8 text-teal-600" />}
            />
            
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
                    این دوره مخصوص افرادی است که می‌خواهند کسب‌وکار آنلاین خود را راه‌اندازی کنند یا از طریق مهارت‌های دیجیتال، درآمد دلاری داشته باشند. با ترکیبی از آموزش تخصصی، پشتیبانی گام‌به‌گام، تست شخصیت، تمرین‌های عملی و مشاوره اختصاصی، این برنامه یک انتخاب کامل برای جهش به سمت جهانی شدن است.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-20 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/15 dark:via-purple-950/15 dark:to-pink-950/15">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="محتوای دوره" 
              subtitle="آنچه در این دوره خواهید آموخت"
              icon={<BookOpen className="w-8 h-8 text-blue-600" />}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Content Items */}
            </div>
          </div>
        </section>

        {/* Course Gifts */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="هدایای ویژه" 
              subtitle="هدایای ویژه همراه با دوره"
              icon={<Gift className="w-8 h-8 text-purple-600" />}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gift Items */}
            </div>
          </div>
        </section>

        {/* Course Features */}
        <section className="py-20 bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-green-950/10 dark:to-teal-950/10">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="ویژگی‌های دوره" 
              subtitle="چرا این دوره را انتخاب کنید؟"
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
            />
            
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Feature Items */}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="معرفی مدرس" 
              subtitle="آشنایی با استاد دوره"
              icon={<User className="w-8 h-8 text-blue-600" />}
            />
            
            {/* Instructor Profile */}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10">
          <div className="container max-w-5xl mx-auto px-4">
            <SectionTitle 
              title="نظرات دانشجویان" 
              subtitle="تجربه واقعی شرکت‌کنندگان در دوره"
              icon={<Star className="w-8 h-8 text-yellow-600" />}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Testimonial Items */}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-background">
          <div className="container max-w-3xl mx-auto px-4">
            <SectionTitle 
              title="سوالات متداول" 
              subtitle="پاسخ به سوالات متداول"
              icon={<MessageCircle className="w-8 h-8 text-blue-600" />}
            />
            
            {/* FAQ Accordion */}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 text-foreground">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              همین حالا ثبت‌نام کنید
            </motion.h2>
            <motion.p 
              className="text-xl mb-12 text-muted-foreground"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              فرصت را از دست ندهید و همین حالا به جمع دانشجویان ما بپیوندید
            </motion.p>
            
            <motion.div 
              className="flex justify-center items-center gap-4 mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold">ظرفیت محدود</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                size="sm"
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg px-6 py-2 text-sm font-medium border-0 hover:bg-gradient-to-r hover:from-green-600 hover:to-teal-600 shadow-lg"
              >
                <CheckCircle className="ml-2" size={16} />
                ثبت‌نام رایگان
              </Button>
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

      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title="ثبت‌نام در شروع بدون مرز"
        url="https://auth.rafiei.co/?add-to-cart=5311"
      />
    </MainLayout>
  );
};

export default BoundlessTastePage;
