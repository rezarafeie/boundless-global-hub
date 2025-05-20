
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, BookOpen, GraduationCap, FileCheck, MessageCircle } from "lucide-react";
import AuthModal from "@/components/Auth/AuthModal";

interface FreeCourseProps {
  title: string;
  englishTitle?: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType?: "book" | "graduation" | "file" | "message";
}

const FreeCourseLanding: React.FC<FreeCourseProps> = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType = "book"
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      <section className="bg-white pt-24 pb-20">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {title}
            </h1>
            {englishTitle && (
              <p className="text-lg text-gray-600 mb-4">{englishTitle}</p>
            )}
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          </div>
          
          <div className="flex justify-center mb-12">
            <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center">
              {getIcon()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="border-black/5 shadow-sm bg-black/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">{benefitOne}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-black/5 shadow-sm bg-black/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-white" />
                  </div>
                  <p className="font-medium">{benefitTwo}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-black hover:bg-black/90 text-white rounded-full px-8"
              onClick={() => setShowAuthModal(true)}
            >
              شروع رایگان
            </Button>
          </div>
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
      
      {/* Final CTA */}
      <section className="bg-white py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">آماده یادگیری هستید؟</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            همین حالا دوره رایگان را شروع کنید و مهارت‌های خود را توسعه دهید.
          </p>
          <Button 
            size="lg" 
            className="bg-black hover:bg-black/90 text-white rounded-full px-8"
            onClick={() => setShowAuthModal(true)}
          >
            شروع رایگان
          </Button>
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        courseTitle={title}
        isPaid={false}
      />
    </MainLayout>
  );
};

export default FreeCourseLanding;
