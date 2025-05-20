
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, BookOpen, GraduationCap, FileCheck, MessageCircle } from "lucide-react";
import AuthModal from "@/components/Auth/AuthModal";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";

interface FreeCourseProps {
  title: string;
  englishTitle?: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType?: "book" | "graduation" | "file" | "message";
}

const FreeCourseLanding: React.FC<FreeCourseProps> = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType = "book"
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Set countdown target for 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);

  const getIcon = () => {
    switch (iconType) {
      case "graduation":
        return <GraduationCap size={64} className="text-black/50" />;
      case "file":
        return <FileCheck size={64} className="text-black/50" />;
      case "message":
        return <MessageCircle size={64} className="text-black/50" />;
      default:
        return <BookOpen size={64} className="text-black/50" />;
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-20 relative">
        {/* Animated Glow Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse-slow"></div>
          <div className="glow-circle glow-circle-2 animate-float"></div>
          <div className="glow-circle glow-circle-3 animate-pulse-slow animation-delay-1000"></div>
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[40px] z-0"></div>
        </div>
        
        <div className="container max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {title}
            </motion.h1>
            {englishTitle && (
              <motion.p 
                className="text-lg text-gray-600 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {englishTitle}
              </motion.p>
            )}
            <motion.p 
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {description}
            </motion.p>
          </div>
          
          <motion.div 
            className="flex justify-center mb-12"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center">
              {getIcon()}
            </div>
          </motion.div>
          
          <CountdownTimer targetDate={targetDate} />
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="border-black/5 shadow-sm bg-black/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">{benefitOne}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 shadow-sm bg-black/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">{benefitTwo}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Button 
              size="lg" 
              className="bg-black hover:bg-black/90 text-white rounded-full px-8 text-lg"
              onClick={() => setShowAuthModal(true)}
            >
              شروع رایگان
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="bg-black text-white py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            این دوره شامل چه مواردی است؟
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <FileCheck size={24} className="text-white" />
              </div>
              <h3 className="font-medium mb-2">ویدیوهای آموزشی</h3>
              <p className="text-sm text-white/70">
                ویدیوهای کاربردی با توضیحات گام به گام
              </p>
            </div>
            
            <div className="bg-white/10 p-6 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-white" />
              </div>
              <h3 className="font-medium mb-2">منابع تکمیلی</h3>
              <p className="text-sm text-white/70">
                فایل‌ها و منابع آموزشی کمکی برای یادگیری بهتر
              </p>
            </div>
            
            <div className="bg-white/10 p-6 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={24} className="text-white" />
              </div>
              <h3 className="font-medium mb-2">پشتیبانی</h3>
              <p className="text-sm text-white/70">
                پاسخگویی به سوالات شما در کامنت‌ها
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="bg-white py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">آماده یادگیری هستید؟</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            همین حالا دوره رایگان را شروع کنید و مهارت‌های خود را توسعه دهید.
          </p>
          <Button 
            size="lg" 
            className="bg-black hover:bg-black/90 text-white rounded-full px-8"
            onClick={() => setShowAuthModal(true)}
          >
            شروع رایگان
          </Button>
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        courseTitle={title}
        isPaid={false}
      />
      
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(0) translateX(20px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(20px) translateX(10px);
            opacity: 0.7;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        
        .animate-float {
          animation: float 15s infinite ease-in-out;
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
          background: radial-gradient(circle, rgba(147,112,219,0.4) 0%, rgba(147,112,219,0) 70%);
          top: -100px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(65,105,225,0.3) 0%, rgba(65,105,225,0) 70%);
          bottom: -150px;
          left: 10%;
        }
        
        .glow-circle-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(123,104,238,0.35) 0%, rgba(123,104,238,0) 70%);
          top: 30%;
          left: 25%;
        }
      `}</style>
    </MainLayout>
  );
};

export default FreeCourseLanding;
