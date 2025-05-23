
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Download, MessageSquare, Award, CheckCircle, Lock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const PaidCourseStart = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <div className="relative py-20 bg-black text-white overflow-hidden">
        {/* Animated glow background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse-slow"></div>
          <div className="glow-circle glow-circle-2 animate-float"></div>
        </div>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[20px] z-0"></div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <CheckCircle size={64} className="mx-auto mb-6 text-green-400" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">دوره فعال شد</h1>
            <p className="text-lg text-white/70">
              به دوره اختصاصی آکادمی رفیعی خوش آمدید. همه امکانات دوره برای شما فعال شده است.
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
                  <Play className="w-5 h-5" />
                  دسترسی به محتوای دوره
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-black/5 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">پلیر اختصاصی رفیعی</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      با استفاده از پلیر اختصاصی می‌توانید به تمام ویدیوهای دوره دسترسی داشته باشید.
                    </p>
                    <Button className="w-full">
                      فعال‌سازی پلیر
                    </Button>
                  </div>
                  
                  <div className="aspect-video bg-gray-200 max-w-2xl mx-auto rounded-lg flex items-center justify-center border border-black/10">
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">{translations.videoPlayerPlaceholder}</p>
                      <p className="text-sm text-gray-500">{translations.rafeiPlayer}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Course Materials */}
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  منابع تکمیلی دوره
                </h2>
                
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    فایل PDF جزوه دوره
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    فایل تمرین‌های عملی
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    نرم‌افزارهای مورد نیاز
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    منابع تکمیلی و مطالعاتی
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Assessments */}
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  آزمون‌ها و ارزیابی‌ها
                </h2>
                
                <div className="space-y-4">
                  <Link to="/assessment-center" className="block">
                    <Button variant="outline" className="w-full">
                      دسترسی به آزمون‌های دوره
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Support and AI */}
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  پشتیبانی و دستیار هوشمند
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/support" className="block">
                    <Button variant="outline" className="w-full">
                      دسترسی به پشتیبانی ویژه
                    </Button>
                  </Link>
                  
                  <Link to="/ai-assistant" className="block">
                    <Button className="w-full">
                      دستیار هوشمند
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Instructor Profile */}
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  محتوای ویژه دوره
                </h2>
                
                <div className="grid grid-cols-1 gap-4">
                  <Link to="/instructor/reza-rafiei" className="block">
                    <Button variant="outline" className="w-full">
                      مشاهده پروفایل استاد دوره
                    </Button>
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

export default PaidCourseStart;
