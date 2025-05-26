
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, DollarSign, TrendingUp, Award, Star, Clock, Target } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import InstructorProfile from "@/components/InstructorProfile";
import IframeModal from "@/components/IframeModal";

const ServitLanding = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Set countdown target for 7 days from now and convert to string
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const endDateString = targetDate.toISOString();

  const handlePurchaseCourse = () => {
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 pt-24 pb-20 relative">
        {/* Animated Glow Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse"></div>
          <div className="glow-circle glow-circle-2 animate-float-fast"></div>
          <div className="glow-circle glow-circle-3 animate-pulse animation-delay-1000"></div>
          <div className="glow-circle glow-circle-4 animate-float-slow animation-delay-2000"></div>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[10px] z-0"></div>
        </div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-right">
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                دوره ثروت
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-600 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Wealth Building Course
              </motion.p>
              <motion.p 
                className="text-lg text-gray-600 mb-8 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                راز ایجاد ثروت پایدار و رسیدن به آزادی مالی را بیاموزید. 
                استراتژی‌های اثبات شده برای سرمایه‌گذاری و کسب درآمد غیرفعال.
              </motion.p>
              
              <motion.div 
                className="grid grid-cols-1 gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">استراتژی‌های سرمایه‌گذاری هوشمند و کم‌ریسک</p>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">ایجاد منابع درآمد غیرفعال و پایدار</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">مدیریت ریسک و برنامه‌ریزی مالی حرفه‌ای</p>
                </div>
              </motion.div>
            </div>
            
            <motion.div
              className="bg-white rounded-xl shadow-lg p-8 border border-green-100"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
                  <DollarSign size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">شروع کنید الان</h2>
                <p className="text-gray-600">مسیر شما به آزادی مالی</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">قیمت ویژه:</span>
                  <span className="font-bold text-lg">۳,۴۹۰,۰۰۰ تومان</span>
                </div>
                
                <div className="flex items-center gap-2 text-green-600">
                  <Clock size={16} />
                  <span className="text-sm">دسترسی مادام‌العمر</span>
                </div>
              </div>
              
              <Button 
                onClick={handlePurchaseCourse}
                size="lg" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full px-8 text-lg py-6 h-auto"
              >
                خرید دوره
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                ۳۰ روز ضمانت بازگشت وجه
              </p>
            </motion.div>
          </div>
          
          <div className="mt-16">
            <CountdownTimer endDate={endDateString} />
          </div>
        </div>
      </section>
      
      {/* Course Content Overview */}
      <section className="bg-white py-16">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">محتویات دوره</h2>
            <p className="text-lg text-gray-600">همه چیزی که برای ایجاد ثروت نیاز دارید</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <h3 className="font-bold mb-2">سرمایه‌گذاری هوشمند</h3>
                <p className="text-sm text-gray-600">
                  آموزش کامل انواع سرمایه‌گذاری و انتخاب بهترین گزینه‌ها
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={24} className="text-white" />
                </div>
                <h3 className="font-bold mb-2">درآمد غیرفعال</h3>
                <p className="text-sm text-gray-600">
                  ایجاد جریان‌های درآمدی که بدون کار مستمر کسب می‌شوند
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={24} className="text-white" />
                </div>
                <h3 className="font-bold mb-2">مدیریت ثروت</h3>
                <p className="text-sm text-gray-600">
                  حفظ و رشد ثروت با استراتژی‌های علمی و اثبات شده
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Instructor Section */}
      <section className="bg-gray-50 py-16">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">استاد دوره</h2>
          <InstructorProfile compact={false} />
        </div>
      </section>
      
      {/* Success Stories */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-16">
        <div className="container max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            داستان‌های موفقیت
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "در ۲ سال سرمایه‌م ۳ برابر شد. الان آزادی مالی کامل دارم."
              </p>
              <p className="font-medium">رضا احمدی</p>
            </div>
            
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "درآمد غیرفعال‌م الان بیشتر از حقوق‌مه. عالی بود!"
              </p>
              <p className="font-medium">مریم کریمی</p>
            </div>
            
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "بهترین سرمایه‌گذاری زندگی‌م بود. خیلی ممنونم استاد!"
              </p>
              <p className="font-medium">علی محمدی</p>
            </div>
          </div>
        </div>
      </section>

      {/* Purchase Modal */}
      <IframeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="خرید دوره ثروت"
        url="https://auth.rafiei.co/?add-to-cart=148"
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
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          33% {
            transform: translateY(-15px) translateX(25px);
            opacity: 0.7;
          }
          66% {
            transform: translateY(20px) translateX(-10px);
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 6s infinite ease-in-out;
        }
        
        .animate-float-fast {
          animation: float-fast 12s infinite ease-in-out;
        }
        
        .animate-float-slow {
          animation: float-slow 18s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(30px);
        }
        
        .glow-circle-1 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(34,197,94,0.45) 0%, rgba(34,197,94,0) 70%);
          top: -150px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0) 70%);
          bottom: -180px;
          left: 10%;
        }
        
        .glow-circle-3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(5,150,105,0.4) 0%, rgba(5,150,105,0) 70%);
          top: 30%;
          left: 25%;
        }
        
        .glow-circle-4 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(6,182,212,0) 70%);
          top: 40%;
          right: 20%;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default ServitLanding;
