
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Gift, Bot, MessageCircle, FileText, Check } from "lucide-react";
import { motion } from "framer-motion";

const AmericanBusinessAccess = () => {
  const { translations } = useLanguage();
  const [activatedSteps, setActivatedSteps] = useState<string[]>([]);

  const handleStepActivation = (stepId: string) => {
    if (!activatedSteps.includes(stepId)) {
      setActivatedSteps([...activatedSteps, stepId]);
    }
  };

  const isStepActivated = (stepId: string) => activatedSteps.includes(stepId);

  const steps = [
    {
      id: "videos",
      title: "🎥 جلسات دوره",
      description: "مشاهده تمام جلسات آموزشی",
      icon: <Play size={40} className="text-red-500" />,
      color: "red",
      buttons: [
        { label: "🇺🇸 جلسه اول", url: "https://academy.rafiei.co/class/americanbusiness/abone/" },
        { label: "🇺🇸 جلسه دوم", url: "https://academy.rafiei.co/class/americanbusiness/abtwo/" }
      ]
    },
    {
      id: "gifts",
      title: "🎁 مواد جایزه",
      description: "دسترسی به محتوای اضافی و جوایز ویژه",
      icon: <Gift size={40} className="text-yellow-500" />,
      color: "yellow",
      buttons: [
        { label: "🎁 مشاهده جوایز", url: "https://academy.rafiei.co/class/americanbusiness/gift/" }
      ]
    },
    {
      id: "assistant",
      title: "🤖 دستیار هوش مصنوعی",
      description: "فعال‌سازی دستیار اختصاصی رفیعی",
      icon: <Bot size={40} className="text-purple-500" />,
      color: "purple",
      buttons: [
        { label: "🤖 فعال‌سازی دستیار", url: "https://t.me/rafiei_bot" }
      ],
      activation: true
    },
    {
      id: "channel",
      title: "📦 کانال تلگرام دوره",
      description: "دسترسی به فایل‌ها و محتوای اختصاصی",
      icon: <FileText size={40} className="text-blue-500" />,
      color: "blue",
      buttons: [
        { label: "📦 ورود به کانال", url: "https://t.me/+yrd-nFh6De0zNTJk" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-blue-50 dark:from-red-950/20 dark:via-yellow-950/20 dark:to-blue-950/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            🇺🇸 به دوره بیزینس آمریکایی خوش آمدید!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto"
          >
            راهنمای جامع ورود به بازار آمریکا در اختیار شماست
          </motion.p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-2 border-${step.color}-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-${step.color}-50/50 dark:bg-${step.color}-950/20`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl bg-${step.color}-100 dark:bg-${step.color}-900/50`}>
                        {step.icon}
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-3">
                          {step.title}
                          {step.activation && isStepActivated(step.id) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check size={16} className="mr-1" />
                              فعال شد
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">{step.description}</p>
                      </div>
                    </div>
                    <div className={`text-3xl font-bold text-${step.color}-500`}>
                      {index + 1}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {step.buttons.map((button, buttonIndex) => (
                    <Button
                      key={buttonIndex}
                      size="lg"
                      className="w-full justify-start gap-3 text-lg py-6"
                      asChild
                      onClick={() => step.activation && handleStepActivation(step.id)}
                    >
                      <a 
                        href={button.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
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

      {/* Footer Message */}
      <div className="py-12 bg-gradient-to-r from-red-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">🚀 مسیر موفقیت در بازار آمریکا!</h3>
          <p className="text-red-100 max-w-2xl mx-auto text-lg">
            شما اکنون به راهنمای کامل ورود به بازار آمریکا دسترسی دارید. با استفاده از این محتوا می‌توانید کسب‌وکار بین‌المللی خود را آغاز کنید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmericanBusinessAccess;
