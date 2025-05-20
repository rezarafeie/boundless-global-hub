
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, MessageCircle, Zap, Check, Download, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const PaidCourseStart = () => {
  const { translations } = useLanguage();
  
  // State to track which actions have been completed
  const [actionsCompleted, setActionsCompleted] = useState({
    support: false,
    telegram: false,
    aiAssistant: false
  });
  
  const handleActionComplete = (action: 'support' | 'telegram' | 'aiAssistant') => {
    setActionsCompleted(prev => ({
      ...prev,
      [action]: true
    }));
  };
  
  // Mock activation code for Rafiei Player
  const activationCode = "RFEI-2025-7891-AXTZ";

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            {translations.welcomeToCourse}
          </h1>
          
          {/* Player Activation */}
          <div className="mb-12">
            <Card className="border-black/15 shadow-sm">
              <CardHeader className="bg-black text-white">
                <CardTitle>{translations.rafeiPlayer}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">{translations.playerActivationCode}</h3>
                  <div className="bg-black/5 border border-black/10 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-xl font-mono">{activationCode}</span>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(activationCode)}>
                      کپی کد
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border border-black/10 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Globe size={16} className="mr-2" />
                      {translations.howToActivate}
                    </h4>
                    <p className="text-sm text-gray-700">
                      کد فعال‌سازی را در نرم‌افزار پخش‌کننده وارد کنید تا به محتوای دوره دسترسی پیدا کنید.
                    </p>
                  </div>
                  
                  <div className="border border-black/10 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Download size={16} className="mr-2" />
                      {translations.downloadPlayer}
                    </h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        دانلود نسخه ویندوز
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        دانلود نسخه مک
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border border-black/10 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <BookOpen size={16} className="mr-2" />
                      {translations.webPlayerAccess}
                    </h4>
                    <Button size="sm" className="w-full bg-black hover:bg-black/90">
                      ورود به پخش‌کننده تحت وب
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-800 border-green-200">
                    فعال
                  </Badge>
                  <span>دسترسی شما به دوره تا تاریخ ۱۴۰۵/۰۶/۳۱ معتبر است.</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Course Files */}
          <div className="mb-12">
            <Card>
              <CardHeader className="bg-black/5">
                <CardTitle>{translations.accessTrainingFiles}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 border border-black/10 rounded-lg p-4">
                    <BookOpen size={24} className="text-black/70" />
                    <div>
                      <h3 className="font-medium">{translations.worksheets}</h3>
                      <p className="text-sm text-muted-foreground">برگه‌های تمرینی</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border border-black/10 rounded-lg p-4">
                    <BookOpen size={24} className="text-black/70" />
                    <div>
                      <h3 className="font-medium">{translations.resources}</h3>
                      <p className="text-sm text-muted-foreground">منابع اضافی</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <Button className="w-full md:w-auto bg-black text-white hover:bg-black/90">
                    دانلود فایل‌ها
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Activation Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Support Access */}
            <motion.div 
              className={`bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm ${actionsCompleted.support ? "opacity-75" : ""}`}
              whileHover={{ y: actionsCompleted.support ? 0 : -5 }}
            >
              <div className="flex flex-col h-full">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mx-auto mb-4">
                  <MessageCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">{translations.activateSupport}</h3>
                <p className="text-sm text-center text-gray-700 mb-6 flex-grow">
                  دسترسی به پشتیبانی مستقیم دوره برای پرسش سوالات و رفع اشکال
                </p>
                <Button 
                  onClick={() => handleActionComplete('support')}
                  className={`w-full relative ${actionsCompleted.support ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                  disabled={actionsCompleted.support}
                >
                  {actionsCompleted.support ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {translations.activated}
                    </>
                  ) : (
                    translations.activateSupport
                  )}
                </Button>
              </div>
            </motion.div>
            
            {/* Telegram Channel */}
            <motion.div 
              className={`bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm ${actionsCompleted.telegram ? "opacity-75" : ""}`}
              whileHover={{ y: actionsCompleted.telegram ? 0 : -5 }}
            >
              <div className="flex flex-col h-full">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mx-auto mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24"
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="lucide lucide-send"
                  >
                    <line x1="22" x2="11" y1="2" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center mb-2">{translations.joinTelegram}</h3>
                <p className="text-sm text-center text-gray-700 mb-6 flex-grow">
                  عضویت در کانال تلگرام اختصاصی دوره برای دریافت اطلاعیه‌ها و محتوای تکمیلی
                </p>
                <Button 
                  onClick={() => handleActionComplete('telegram')}
                  className={`w-full ${actionsCompleted.telegram ? "bg-green-600 hover:bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
                  disabled={actionsCompleted.telegram}
                >
                  {actionsCompleted.telegram ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {translations.activated}
                    </>
                  ) : (
                    translations.joinTelegram
                  )}
                </Button>
              </div>
            </motion.div>
            
            {/* AI Assistant */}
            <motion.div 
              className={`bg-purple-50 border border-purple-100 rounded-xl p-6 shadow-sm ${actionsCompleted.aiAssistant ? "opacity-75" : ""}`}
              whileHover={{ y: actionsCompleted.aiAssistant ? 0 : -5 }}
            >
              <div className="flex flex-col h-full">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 mx-auto mb-4">
                  <Zap size={24} />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">{translations.launchAIAssistant}</h3>
                <p className="text-sm text-center text-gray-700 mb-6 flex-grow">
                  راه‌اندازی دستیار هوشمند آکادمی رفیعی برای پاسخ به سوالات و راهنمایی شخصی‌سازی شده
                </p>
                <Button 
                  onClick={() => handleActionComplete('aiAssistant')}
                  asChild
                  className={`w-full ${actionsCompleted.aiAssistant ? "bg-green-600 hover:bg-green-600" : "bg-purple-600 hover:bg-purple-700"}`}
                >
                  <a 
                    href="https://ai.rafiei.co/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => handleActionComplete('aiAssistant')}
                  >
                    {actionsCompleted.aiAssistant ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {translations.activated}
                      </>
                    ) : (
                      translations.launchAIAssistant
                    )}
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
          
          {/* Community Access */}
          <Card className="mb-12">
            <CardHeader className="bg-black/5">
              <CardTitle>{translations.communityAccess}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-6">{translations.communityAccessDescription}</p>
              <Button className="bg-black hover:bg-black/90">
                ورود به انجمن دوره
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaidCourseStart;
