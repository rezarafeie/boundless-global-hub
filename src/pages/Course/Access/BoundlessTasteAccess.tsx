
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Gift, Bot, MessageCircle, FileText, Check, Users, Link, Save } from "lucide-react";
import { motion } from "framer-motion";
import MobileStickyButton from "@/components/MobileStickyButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

const BoundlessTasteAccess = () => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const [activatedSteps, setActivatedSteps] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const handleStepActivation = (stepId: string) => {
    if (!activatedSteps.includes(stepId)) {
      setActivatedSteps([...activatedSteps, stepId]);
    }
  };

  const isStepActivated = (stepId: string) => activatedSteps.includes(stepId);

  const handleMainAction = () => {
    window.open("https://academy.rafiei.co/maze/boundless/one/", "_blank");
  };

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
      description: "دسترسی به پشتیبانی اختصاصی مزه بدون مرز",
      icon: <MessageCircle size={32} className="text-emerald-600" />,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      buttons: [
        { label: "💬 فعال‌سازی پشتیبانی", url: "https://t.me/m/c43Pi3aXODFk" }
      ],
      activation: true
    },
    {
      id: "channel",
      title: "📦 کانال تلگرام دوره",
      description: "عضویت در کانال برای دریافت فایل‌ها و محتوای ویژه",
      icon: <Users size={32} className="text-cyan-600" />,
      bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
      borderColor: "border-cyan-200 dark:border-cyan-800",
      buttons: [
        { label: "📦 ورود به کانال", url: "https://t.me/mazeboundless" }
      ]
    },
    {
      id: "videos",
      title: "🎥 جلسات دوره",
      description: "مشاهده تمام جلسات آموزشی مزه بدون مرز",
      icon: <Play size={32} className="text-blue-600" />,
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      buttons: [
        { label: "🍽️ جلسه اول", url: "https://academy.rafiei.co/maze/boundless/one/" },
        { label: "🍽️ جلسه دوم", url: "https://academy.rafiei.co/maze/boundless/two/" },
        { label: "🍽️ جلسه سوم", url: "https://academy.rafiei.co/maze/boundless/three/" }
      ]
    },
    {
      id: "gifts",
      title: "🎁 جوایز و مواد اضافی",
      description: "دسترسی به محتوای ویژه و جوایز اختصاصی دوره",
      icon: <Gift size={32} className="text-amber-600" />,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      buttons: [
        { label: "🎁 مشاهده جوایز", url: "https://academy.rafiei.co/maze/boundless/gift/" }
      ]
    },
    {
      id: "assistant",
      title: "🤖 دستیار هوش مصنوعی",
      description: "فعال‌سازی دستیار اختصاصی رفیعی برای پشتیبانی",
      icon: <Bot size={32} className="text-purple-600" />,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      buttons: [
        { label: "🤖 فعال‌سازی دستیار", url: "https://t.me/rafiei_bot" }
      ],
      activation: true
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-900 ${isMobile ? 'pb-20' : ''}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black py-16">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-slate-400/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-slate-300/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-slate-500/10 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              🍽️ مزه بدون مرز
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-6">
              سفری جذاب در دنیای طعم‌ها و تجربه‌های غذایی
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
      <div className="py-8 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2">🎉 آماده برای تجربه طعم‌های جدید؟</h3>
          <p className="text-slate-200 max-w-2xl mx-auto">
            با دنبال کردن مراحل بالا، به تمام امکانات و محتوای دوره دسترسی خواهید داشت
          </p>
        </div>
      </div>

      {/* Mobile Sticky Button */}
      <MobileStickyButton onClick={handleMainAction}>
        🍽️ شروع دوره
      </MobileStickyButton>
    </div>
  );
};

export default BoundlessTasteAccess;
