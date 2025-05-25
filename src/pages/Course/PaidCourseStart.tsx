
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Download, MessageSquare, Award, CheckCircle, Lock, Play, Monitor, Globe, Key, Users, Bot, HeadphonesIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { useCourseActivation } from "@/hooks/useCourseActivation";

const PaidCourseStart = () => {
  const { translations } = useLanguage();
  const { courseTitle, slug } = useParams();
  const { toast } = useToast();
  const { activateAssistant } = useCourseActivation();
  
  const [activatedFeatures, setActivatedFeatures] = useState({
    telegram: false,
    aiAssistant: false,
    support: false,
    playerDesktop: false,
    playerWeb: false
  });

  const courseSlug = slug || courseTitle || '';

  const handleFeatureActivation = async (feature: string) => {
    switch (feature) {
      case 'telegram':
        setActivatedFeatures(prev => ({ ...prev, telegram: true }));
        toast({
          title: "موفق",
          description: "به گروه تلگرام اضافه شدید",
        });
        window.open('https://t.me/rafieiacademy', '_blank');
        break;
        
      case 'aiAssistant':
        const result = await activateAssistant();
        if (result.success) {
          setActivatedFeatures(prev => ({ ...prev, aiAssistant: true }));
        }
        break;
        
      case 'support':
        setActivatedFeatures(prev => ({ ...prev, support: true }));
        toast({
          title: "موفق",
          description: "پشتیبانی ویژه فعال شد",
        });
        break;

      case 'playerDesktop':
        setActivatedFeatures(prev => ({ ...prev, playerDesktop: true }));
        toast({
          title: "دانلود شروع شد",
          description: "نسخه دسکتاپ پلیر رفیعی در حال دانلود است",
        });
        break;

      case 'playerWeb':
        setActivatedFeatures(prev => ({ ...prev, playerWeb: true }));
        window.open('https://player.rafiei.co', '_blank');
        break;
    }
  };

  const activationCode = `COURSE-${courseSlug?.toUpperCase()}-${Math.random().toString(36).substr(2, 8)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      {/* Header Section */}
      <div className="relative py-20 bg-black text-white overflow-hidden mb-12">
        {/* Animated glow background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse-slow"></div>
          <div className="glow-circle glow-circle-2 animate-float"></div>
        </div>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[20px] z-0"></div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <CheckCircle size={64} className="mx-auto mb-6 text-green-400" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">🎉 تبریک! دوره ویژه فعال شد</h1>
            <p className="text-lg text-white/70">
              به دوره اختصاصی آکادمی رفیعی خوش آمدید. تمام امکانات پیشرفته برای شما فعال شده است.
            </p>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
          
          {/* Rafiei Player Access Section */}
          <Card className="border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Play className="w-8 h-8" />
                🎥 دسترسی به پلیر رفیعی
              </CardTitle>
              <p className="text-green-100">برای مشاهده جلسات این دوره، وارد پلیر شوید</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <Monitor className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-bold mb-2">نسخه دسکتاپ</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      دانلود اپلیکیشن مخصوص ویندوز و مک
                    </p>
                    <Button 
                      onClick={() => handleFeatureActivation('playerDesktop')}
                      variant={activatedFeatures.playerDesktop ? "secondary" : "default"}
                      className="w-full"
                    >
                      {activatedFeatures.playerDesktop ? 'دانلود شد ✓' : 'دانلود اپ'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-6">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="font-bold mb-2">نسخه وب</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      دسترسی آنلاین از طریق مرورگر
                    </p>
                    <Button 
                      onClick={() => handleFeatureActivation('playerWeb')}
                      variant="outline"
                      className="w-full"
                    >
                      ورود به پلیر وب
                    </Button>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-6">
                    <Key className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                    <h3 className="font-bold mb-2">کد فعال‌سازی</h3>
                    <div className="bg-gray-100 p-3 rounded-lg mb-4">
                      <code className="text-sm font-mono">{activationCode}</code>
                    </div>
                    <Button 
                      onClick={() => navigator.clipboard.writeText(activationCode)}
                      variant="outline"
                      className="w-full"
                    >
                      کپی کد
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          {/* Course Materials */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Download className="w-6 h-6" />
                📂 منابع تکمیلی دوره
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <Download className="mr-3 h-5 w-5 text-red-600" />
                  <div className="text-right">
                    <div className="font-semibold">فایل PDF جزوه دوره</div>
                    <div className="text-sm text-gray-600">محتوای کامل و جامع</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <Download className="mr-3 h-5 w-5 text-green-600" />
                  <div className="text-right">
                    <div className="font-semibold">فایل تمرین‌های عملی</div>
                    <div className="text-sm text-gray-600">پروژه‌های کاربردی</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <Download className="mr-3 h-5 w-5 text-blue-600" />
                  <div className="text-right">
                    <div className="font-semibold">نرم‌افزارهای مورد نیاز</div>
                    <div className="text-sm text-gray-600">ابزارهای ضروری</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <Download className="mr-3 h-5 w-5 text-purple-600" />
                  <div className="text-right">
                    <div className="font-semibold">منابع تکمیلی</div>
                    <div className="text-sm text-gray-600">مطالب پیشرفته</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Features */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Telegram */}
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className={`w-12 h-12 mx-auto mb-4 ${activatedFeatures.telegram ? 'text-green-600' : 'text-blue-600'}`} />
                <h3 className="font-bold text-lg mb-2">گروه ویژه تلگرام</h3>
                <p className="text-gray-600 text-sm mb-4">
                  انجمن اختصاصی دانشجویان دوره‌های پولی
                </p>
                <Button 
                  onClick={() => handleFeatureActivation('telegram')}
                  variant={activatedFeatures.telegram ? "secondary" : "default"}
                  className="w-full"
                  disabled={activatedFeatures.telegram}
                >
                  {activatedFeatures.telegram ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      عضو شدید
                    </>
                  ) : (
                    'عضویت در گروه ویژه'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="text-center">
              <CardContent className="p-6">
                <Bot className={`w-12 h-12 mx-auto mb-4 ${activatedFeatures.aiAssistant ? 'text-green-600' : 'text-purple-600'}`} />
                <h3 className="font-bold text-lg mb-2">🤖 دستیار هوشمند پیشرفته</h3>
                <p className="text-gray-600 text-sm mb-4">
                  پاسخ تخصصی به سوالات دوره
                </p>
                <Button 
                  onClick={() => handleFeatureActivation('aiAssistant')}
                  variant={activatedFeatures.aiAssistant ? "secondary" : "default"}
                  className="w-full"
                  disabled={activatedFeatures.aiAssistant}
                >
                  {activatedFeatures.aiAssistant ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      فعال شد
                    </>
                  ) : (
                    'راه‌اندازی AI'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Support */}
            <Card className="text-center">
              <CardContent className="p-6">
                <HeadphonesIcon className={`w-12 h-12 mx-auto mb-4 ${activatedFeatures.support ? 'text-green-600' : 'text-orange-600'}`} />
                <h3 className="font-bold text-lg mb-2">🧑‍💬 پشتیبانی ویژه</h3>
                <p className="text-gray-600 text-sm mb-4">
                  پشتیبانی اولویت‌دار 24/7
                </p>
                <Button 
                  onClick={() => handleFeatureActivation('support')}
                  variant={activatedFeatures.support ? "secondary" : "default"}
                  className="w-full"
                  disabled={activatedFeatures.support}
                >
                  {activatedFeatures.support ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      فعال شد
                    </>
                  ) : (
                    'فعال‌سازی پشتیبانی'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Assessments */}
          <Card className="border-yellow-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="w-6 h-6" />
                🏆 آزمون‌ها و ارزیابی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4">
                  <Award className="mr-3 h-5 w-5 text-yellow-600" />
                  <div className="text-right">
                    <div className="font-semibold">آزمون‌های میان‌دوره</div>
                    <div className="text-sm text-gray-600">ارزیابی پیشرفت</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4">
                  <Award className="mr-3 h-5 w-5 text-green-600" />
                  <div className="text-right">
                    <div className="font-semibold">آزمون نهایی</div>
                    <div className="text-sm text-gray-600">دریافت گواهینامه</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bottom CTA */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">آماده شروع یادگیری پیشرفته؟</h3>
              <p className="text-blue-100 mb-6 text-lg">
                با پلیر رفیعی بهترین تجربه یادگیری آنلاین را داشته باشید
              </p>
              <Button 
                onClick={() => handleFeatureActivation('playerWeb')}
                size="lg" 
                variant="secondary"
                className="px-8 py-4 text-lg font-bold"
              >
                <Play className="w-5 h-5 mr-2" />
                ورود به پلیر رفیعی
              </Button>
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
    </div>
  );
};

export default PaidCourseStart;
