
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Download, MessageCircle, Award, CheckCircle, Send, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

const FreeCourseStart = () => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  
  const [telegramJoined, setTelegramJoined] = useState(false);
  const [supportActivated, setSupportActivated] = useState(false);
  const [assistantActivated, setAssistantActivated] = useState(false);

  const handleTelegramClick = () => {
    window.open("https://t.me/RafieiAcademy", "_blank");
    setTelegramJoined(true);
    toast({
      description: "پیوستن به کانال با موفقیت انجام شد.",
    });
  };
  
  const handleSupportClick = () => {
    window.open("/support", "_blank");
    setSupportActivated(true);
    toast({
      description: "پشتیبانی دوره با موفقیت فعال شد.",
    });
  };
  
  const handleAssistantClick = () => {
    window.open("https://ai.rafiei.co/", "_blank");
    setAssistantActivated(true);
    toast({
      description: "دستیار هوشمند با موفقیت فعال شد.",
    });
  };

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
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">دوره رایگان فعال شد</h1>
            <p className="text-lg text-muted-foreground">
              به دوره رایگان آکادمی رفیعی خوش آمدید. لطفا مراحل زیر را برای شروع دوره دنبال کنید.
            </p>
          </div>
        </div>
      </div>

      {/* Main CTA Blocks */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold mb-6">فعال‌سازی دسترسی‌های دوره</h2>
          
          {/* CTA Blocks */}
          <div className="grid grid-cols-1 gap-6">
            {/* Join Telegram Channel CTA */}
            <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${telegramJoined ? 'opacity-90' : 'opacity-100'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-20"></div>
              <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Send size={28} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">عضویت در کانال اختصاصی دوره</h3>
                    <p className="text-muted-foreground">برای دسترسی به اعلان‌ها، بروزرسانی‌ها و گفتگو با همکلاسی‌ها</p>
                  </div>
                </div>
                
                <div className="md:flex-shrink-0 w-full md:w-auto">
                  <Button 
                    onClick={handleTelegramClick}
                    size="lg"
                    className={`w-full md:w-auto rounded-full ${telegramJoined ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <span className="flex items-center gap-2">
                      {telegramJoined ? (
                        <>
                          <CheckCircle size={18} />
                          <span>پیوستن انجام شد</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>پیوستن به کانال تلگرام</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Activate Support CTA */}
            <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${supportActivated ? 'opacity-90' : 'opacity-100'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 opacity-20"></div>
              <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={28} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">فعال‌سازی پشتیبانی دوره</h3>
                    <p className="text-muted-foreground">دسترسی به تیم پشتیبانی برای رفع مشکلات و پاسخگویی به سوالات</p>
                  </div>
                </div>
                
                <div className="md:flex-shrink-0 w-full md:w-auto">
                  <Button 
                    onClick={handleSupportClick}
                    size="lg"
                    className={`w-full md:w-auto rounded-full ${supportActivated ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                  >
                    <span className="flex items-center gap-2">
                      {supportActivated ? (
                        <>
                          <CheckCircle size={18} />
                          <span>فعال‌سازی انجام شد</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle size={18} />
                          <span>فعال‌سازی پشتیبانی</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Activate AI Assistant CTA */}
            <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${assistantActivated ? 'opacity-90' : 'opacity-100'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-20"></div>
              <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink size={28} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">فعال‌سازی دستیار هوشمند</h3>
                    <p className="text-muted-foreground">دسترسی به دستیار هوشمند آکادمی رفیعی برای پاسخگویی به سوالات تخصصی</p>
                  </div>
                </div>
                
                <div className="md:flex-shrink-0 w-full md:w-auto">
                  <Button 
                    onClick={handleAssistantClick}
                    size="lg"
                    className={`w-full md:w-auto rounded-full ${assistantActivated ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    <span className="flex items-center gap-2">
                      {assistantActivated ? (
                        <>
                          <CheckCircle size={18} />
                          <span>فعال‌سازی انجام شد</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink size={18} />
                          <span>فعال‌سازی دستیار هوشمند</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course Materials */}
          <Card className="border-black/5 shadow-sm overflow-hidden mt-10">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                دانلود فایل‌های آموزشی
              </h2>
              
              <div className="space-y-4">
                <Button className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  فایل مقدمه دوره
                </Button>
                
                <Button className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  فایل کتابچه راهنما
                </Button>
                
                <Button className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  فایل تمرین‌های عملی
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Assessments */}
          <Card className="border-black/5 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                آزمون‌های دوره
              </h2>
              
              <div className="space-y-4">
                <Link to="/assessment-center" className="block">
                  <Button variant="outline" className="w-full">
                    فعال‌سازی آزمون‌های دوره
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
