
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, BookOpen, GraduationCap, FileCheck, MessageCircle } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import CourseRegistrationForm from "@/components/CourseRegistrationForm";
import { motion } from "framer-motion";
import InstructorProfile from "@/components/InstructorProfile";

interface FreeCourseProps {
  title: string;
  englishTitle?: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  courseSlug: string;
  iconType?: "book" | "graduation" | "file" | "message";
}

const FreeCourseLanding: React.FC<FreeCourseProps> = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  courseSlug,
  iconType = "book"
}) => {
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
          <div className="glow-circle glow-circle-1 animate-pulse"></div>
          <div className="glow-circle glow-circle-2 animate-float-fast"></div>
          <div className="glow-circle glow-circle-3 animate-pulse animation-delay-1000"></div>
          <div className="glow-circle glow-circle-4 animate-float-slow animation-delay-2000"></div>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[20px] z-0"></div>
        </div>
        
        <div className="container max-w-4xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-right">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-4"
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
                className="text-lg text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {description}
              </motion.p>
              
              <motion.div 
                className="grid grid-cols-1 gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">{benefitOne}</p>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">{benefitTwo}</p>
                </div>
              </motion.div>
            </div>
            
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {/* Countdown Timer */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">برای شروع این دوره رایگان، همین حالا ثبت‌نام کن!</h3>
                <CountdownTimer targetDate={targetDate} />
              </div>
              
              {/* Registration Form */}
              <CourseRegistrationForm 
                courseSlug={courseSlug}
                courseTitle={title}
                className="bg-white/90 backdrop-blur-sm shadow-lg border border-black/10"
              />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Instructor Section */}
      <section className="bg-white py-16">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">استاد دوره</h2>
          <InstructorProfile compact={true} />
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
          background: radial-gradient(circle, rgba(147,112,219,0.45) 0%, rgba(147,112,219,0) 70%);
          top: -150px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(65,105,225,0.4) 0%, rgba(65,105,225,0) 70%);
          bottom: -180px;
          left: 10%;
        }
        
        .glow-circle-3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(123,104,238,0.4) 0%, rgba(123,104,238,0) 70%);
          top: 30%;
          left: 25%;
        }
        
        .glow-circle-4 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(72,209,204,0.35) 0%, rgba(72,209,204,0) 70%);
          top: 40%;
          right: 20%;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default FreeCourseLanding;
