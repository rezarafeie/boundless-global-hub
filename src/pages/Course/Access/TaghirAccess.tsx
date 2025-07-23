
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Gift, Bot, MessageCircle, FileText, Check, Users, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthTracking } from "@/hooks/useAuthTracking";

const TaghirAccess = () => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { logCoursePageVisit, logSupportActivation, logTelegramJoin } = useAuthTracking();
  const [activatedSteps, setActivatedSteps] = useState<string[]>([]);

  // Log course page visit on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Use a static course ID for Taghir project or get it from URL params
      logCoursePageVisit(parseInt(user.id.toString()), "287b51a8-a93b-4334-91ef-a5d3bf97fc3d", "پروژه تغییر");
    }
  }, [isAuthenticated, user, logCoursePageVisit]);

  const handleStepActivation = async (stepId: string) => {
    if (!activatedSteps.includes(stepId)) {
      setActivatedSteps([...activatedSteps, stepId]);
      
      // Log specific activities based on step type
      if (isAuthenticated && user?.id) {
        const userId = parseInt(user.id.toString());
        const courseId = "287b51a8-a93b-4334-91ef-a5d3bf97fc3d";
        
        if (stepId === "support") {
          await logSupportActivation(userId, courseId);
        } else if (stepId === "channel") {
          await logTelegramJoin(userId, courseId, "تلگرام پروژه تغییر");
        }
      }
    }
  };

  const isStepActivated = (stepId: string) => activatedSteps.includes(stepId);

  const handleSavePageLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast({
        title: "✅ لینک کپی شد",
        description: "لینک صفحه در کلیپ‌بورد شما ذخیره شد",
        duration: 3000,
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "✅ لینک کپی شد",
        description: "لینک صفحه کپی شد",
        duration: 3000,
      });
    });
  };

  const steps = [
    {
      id: "support",
      title: "💬 فعال‌سازی پشتیبانی",
      description: "دسترسی به پشتیبانی اختصاصی پروژه تغییر",
      icon: <MessageCircle size={32} className="text-emerald-600" />,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      buttons: [
        { label: "💬 فعال‌سازی پشتیبانی", url: "https://t.me/m/Ljua1cGLZjk0" }
      ],
      activation: true
    },
    {
      id: "channel",
      title: "📦 کانال تلگرام دوره",
      description: "عضویت در کانال برای دریافت محتوای اختصاصی",
      icon: <Users size={32} className="text-indigo-600" />,
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      buttons: [
        { label: "📦 ورود به کانال", url: "https://t.me/taghirproject" }
      ]
    },
    {
      id: "videos",
      title: "🎥 جلسات دوره",
      description: "مشاهده تمام جلسات آموزشی پروژه تغییر",
      icon: <Play size={32} className="text-purple-600" />,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      buttons: [
        { label: "📘 جلسه اول", url: "https://academy.rafiei.co/taghir/tpone/" },
        { label: "📘 جلسه دوم", url: "https://academy.rafiei.co/taghir/tptwo/" },
        { label: "📘 جلسه سوم", url: "https://academy.rafiei.co/taghir/tpthree/" }
      ]
    },
    {
      id: "gifts",
      title: "🎁 جوایز و مواد اضافی",
      description: "دسترسی به محتوای ویژه و جوایز اختصاصی",
      icon: <Gift size={32} className="text-amber-600" />,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      buttons: [
        { label: "🎁 مشاهده جوایز", url: "https://academy.rafiei.co/taghir/reweb/gift/" }
      ]
    },
    {
      id: "assistant",
      title: "🤖 دستیار هوش مصنوعی",
      description: "فعال‌سازی دستیار اختصاصی برای پشتیبانی",
      icon: <Bot size={32} className="text-teal-600" />,
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      borderColor: "border-teal-200 dark:border-teal-800",
      buttons: [
        { label: "🤖 فعال‌سازی دستیار", url: "https://t.me/rafiei_bot" }
      ],
      activation: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-900 dark:to-purple-900 py-16">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-indigo-300/10 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              📘 پروژه تغییر
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-6">
              برنامه جامع تغییر زندگی و رشد شخصی
            </p>
            
            {/* Save Page Link Button */}
            <Button
              onClick={handleSavePageLink}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Save size={16} className="mr-2" />
              ذخیره لینک صفحه
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              مراحل دسترسی به دوره
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              برای بهترین تجربه یادگیری، مراحل زیر را به ترتیب دنبال کنید
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${step.bgColor} ${step.borderColor} border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-700 rounded-xl shadow-md">
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                            {step.title}
                            {step.activation && isStepActivated(step.id) && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                <Check size={14} className="mr-1" />
                                فعال شد
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        {index + 1}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {step.buttons.map((button, buttonIndex) => (
                      <Button
                        key={buttonIndex}
                        size="lg"
                        className="w-full justify-center gap-3 text-base py-3 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                        asChild
                        onClick={() => step.activation && handleStepActivation(step.id)}
                      >
                        <a 
                          href={button.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {button.label}
                        </a>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Message */}
      <div className="py-8 bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-900 dark:to-purple-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2">🌟 آماده برای شروع تغییر زندگی؟</h3>
          <p className="text-indigo-100 max-w-2xl mx-auto">
            با دنبال کردن مراحل بالا، در مسیر رشد شخصی و دستیابی به اهدافتان قرار می‌گیرید
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaghirAccess;
