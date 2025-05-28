
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, MessageCircle, Zap, Check, Download, Globe, Bot, FileText, Gift, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import CourseAccessCard from "@/components/Course/CourseAccessCard";

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

  // Support links for different courses
  const supportLinks = [
    {
      title: "Boundless Passive Income",
      url: "https://t.me/m/ToRJiOBHN2E0"
    },
    {
      title: "Taghir Project", 
      url: "https://t.me/m/Ljua1cGLZjk0"
    },
    {
      title: "Boundless Taste (Link 1)",
      url: "https://t.me/m/c43Pi3aXODFk"
    },
    {
      title: "Boundless Taste (Link 2)",
      url: "https://t.me/m/YOGv3cr2MmM0"
    }
  ];

  // Telegram channels for files and guides
  const telegramChannels = [
    {
      title: "Boundless Taste",
      url: "https://t.me/mazeboundless"
    },
    {
      title: "Taghir Project",
      url: "https://t.me/taghirproject"
    },
    {
      title: "Boundless Passive Income",
      url: "https://t.me/daramadproject"
    },
    {
      title: "American Business Project",
      url: "https://t.me/+yrd-nFh6De0zNTJk"
    }
  ];

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {translations.welcomeToCourse}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {translations.paidCourseAccessInstructions}
            </p>
          </motion.div>
          
          {/* Player Activation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Globe size={24} />
                  {translations.rafeiPlayer}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-primary" />
                    {translations.playerActivationCode}
                  </h3>
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-xl p-6 flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold tracking-wider">{activationCode}</span>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => navigator.clipboard.writeText(activationCode)}
                      className="border-primary/50 hover:bg-primary/10"
                    >
                      📋 کپی کد
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Globe size={32} className="mx-auto mb-4 text-primary" />
                      <h4 className="font-semibold mb-3">{translations.howToActivate}</h4>
                      <p className="text-sm text-muted-foreground">
                        کد فعال‌سازی را در نرم‌افزار پخش‌کننده وارد کنید تا به محتوای دوره دسترسی پیدا کنید.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Download size={32} className="mx-auto mb-4 text-primary" />
                      <h4 className="font-semibold mb-3">{translations.downloadPlayer}</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          🪟 دانلود نسخه ویندوز
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          🍎 دانلود نسخه مک
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="p-6 text-center">
                      <BookOpen size={32} className="mx-auto mb-4 text-primary" />
                      <h4 className="font-semibold mb-3">{translations.webPlayerAccess}</h4>
                      <Button size="lg" className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                        🌐 ورود به پخش‌کننده تحت وب
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex items-center gap-3 justify-center">
                  <Badge variant="outline" className="text-sm bg-green-50 text-green-800 border-green-200 px-4 py-2">
                    ✅ فعال
                  </Badge>
                  <span className="text-sm text-muted-foreground">دسترسی شما به دوره تا تاریخ ۱۴۰۵/۰۶/۳۱ معتبر است.</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Course Access Cards Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12"
          >
            {/* AI Assistant */}
            <CourseAccessCard
              title={translations.aiAssistantBot}
              description="دسترسی به دستیار هوشمند آکادمی رفیعی برای پاسخ به سوالات و راهنمایی"
              icon={<Bot size={32} className="text-purple-600" />}
              buttons={[
                {
                  label: "فعالسازی دستیار هوشمند",
                  url: "https://t.me/rafiei_bot",
                  variant: "default",
                  icon: <Bot size={16} />
                }
              ]}
              badge="🤖 AI"
              className="border-purple-200 hover:border-purple-300"
            />

            {/* Support Links */}
            <CourseAccessCard
              title={translations.supportLinks}
              description="دسترسی مستقیم به پشتیبانی تخصصی هر دوره"
              icon={<MessageCircle size={32} className="text-blue-600" />}
              buttons={supportLinks.map(link => ({
                label: link.title,
                url: link.url,
                variant: "outline" as const,
                icon: <MessageCircle size={16} />
              }))}
              badge="🎧 Support"
              className="border-blue-200 hover:border-blue-300"
            />

            {/* Telegram Channels */}
            <CourseAccessCard
              title={translations.telegramChannels}
              description="دسترسی به فایل‌ها، راهنماها و محتوای جایزه"
              icon={<FileText size={32} className="text-green-600" />}
              buttons={telegramChannels.map(channel => ({
                label: channel.title,
                url: channel.url,
                variant: "secondary" as const,
                icon: <FileText size={16} />
              }))}
              badge="📁 Files"
              className="border-green-200 hover:border-green-300"
            />
          </motion.div>
          
          {/* Course Materials */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20">
                <CardTitle className="flex items-center gap-3">
                  <Download size={24} className="text-primary" />
                  {translations.accessTrainingFiles}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <BookOpen size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{translations.worksheets}</h3>
                        <p className="text-sm text-muted-foreground">برگه‌های تمرینی و فعالیت‌های عملی</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 rounded-full bg-secondary/10">
                        <FileText size={24} className="text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{translations.resources}</h3>
                        <p className="text-sm text-muted-foreground">کتاب‌ها، مقالات و منابع تکمیلی</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-center">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-8 py-3">
                    <Download size={20} className="mr-2" />
                    دانلود همه فایل‌ها
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Community Access */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-background to-secondary/5">
              <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10 border-b border-primary/20">
                <CardTitle className="flex items-center gap-3">
                  <Users size={24} className="text-secondary" />
                  {translations.communityAccess}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <p className="text-lg text-muted-foreground mb-6">{translations.communityAccessDescription}</p>
                <Button size="lg" className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-semibold px-8 py-3">
                  <Users size={20} className="mr-2" />
                  ورود به انجمن دوره
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaidCourseStart;
