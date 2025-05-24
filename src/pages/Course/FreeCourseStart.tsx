import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Download, MessageSquare, Award, CheckCircle, Users, Bot, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import ActivationBlock from "@/components/ActivationBlock";
import { useActivationState } from "@/hooks/useActivationState";

const FreeCourseStart = () => {
  const { translations } = useLanguage();
  const { activations, updateActivation } = useActivationState("free-course");

  return (
    <MainLayout>
      <div className="relative py-20 bg-white overflow-hidden">
        {/* Animated glow background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse-slow"></div>
          <div className="glow-circle glow-circle-2 animate-float"></div>
        </div>
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[20px] z-0"></div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <CheckCircle size={64} className="mx-auto mb-6 text-green-500" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">دوره رایگان فعال شد</h1>
            <p className="text-lg text-muted-foreground">
              به دوره رایگان آکادمی رفیعی خوش آمدید. برای دریافت تجربه کاملی از دوره، موارد زیر را فعال کنید.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 gap-8">
            {/* Access Instructions */}
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  مراحل دسترسی به دوره
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <p>فایل‌های آموزشی را دانلود کنید</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <p>به کانال اختصاصی دوره بپیوندید</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <p>سیستم پشتیبانی را فعال کنید</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <p>دستیار هوشمند را فعال کنید</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Training Files */}
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  دانلود فایل‌های آموزشی
                </h2>
                
                <div className="space-y-4">
                  <Link to="#" className="block">
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-blue-500" />
                        <span>فایل مقدمه دوره</span>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="#" className="block">
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-blue-500" />
                        <span>فایل کتابچه راهنما</span>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="#" className="block">
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-blue-500" />
                        <span>فایل تمرین‌های عملی</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Interactive Activation Blocks */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">فعال‌سازی امکانات دوره</h2>
              
              {/* Telegram Channel */}
              <ActivationBlock
                icon={<Users size={24} className="text-white" />}
                title="عضویت در کانال اختصاصی"
                description="به کانال تلگرام اختصاصی دوره بپیوندید و از آخرین اخبار و منابع مطلع شوید"
                buttonText="پیوستن به کانال"
                href="https://t.me/rafieiacademy"
                external={true}
                variant="primary"
                isActivated={activations.telegram}
                onActivate={(activated) => updateActivation('telegram', activated)}
              />
              
              {/* Support Access */}
              <ActivationBlock
                icon={<Headphones size={24} className="text-white" />}
                title="فعال‌سازی پشتیبانی دوره"
                description="دسترسی به تیم پشتیبانی اختصاصی برای پاسخگویی به سوالات شما"
                buttonText="فعال‌سازی پشتیبانی"
                href="/support"
                variant="secondary"
                isActivated={activations.support}
                onActivate={(activated) => updateActivation('support', activated)}
              />
              
              {/* AI Assistant */}
              <ActivationBlock
                icon={<Bot size={24} className="text-white" />}
                title="راه‌اندازی دستیار هوشمند"
                description="استفاده از دستیار هوش مصنوعی اختصاصی آکادمی رفیعی برای راهنمایی شخصی"
                buttonText="راه‌اندازی دستیار"
                href="https://ai.rafiei.co"
                external={true}
                variant="success"
                isActivated={activations.aiAssistant}
                onActivate={(activated) => updateActivation('aiAssistant', activated)}
              />
            </div>
            
            {/* Assessments */}
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  آزمون‌های دوره
                </h2>
                
                <div className="space-y-4">
                  <Link to="/assessment-center" className="block">
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-blue-500" />
                        <span>فعال‌سازی آزمون‌های دوره</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style>
        {`
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
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(30px);
        }
        
        .glow-circle-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(72,187,120,0.25) 0%, rgba(72,187,120,0) 70%);
          top: -100px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(56,178,172,0.2) 0%, rgba(56,178,172,0) 70%);
          bottom: -150px;
          left: 10%;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default FreeCourseStart;
