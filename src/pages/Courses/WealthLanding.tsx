
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Users, BookOpen, Award, Star } from "lucide-react";
import PaymentButton from "@/components/PaymentButton";
import AuthenticationModal from "@/components/Auth/AuthenticationModal";
import { useAuth } from "@/hooks/useAuth";

const WealthLanding = () => {
  const { translations } = useLanguage();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const courseFeatures = [
    "استراتژی‌های ثروت‌سازی مدرن",
    "روش‌های سرمایه‌گذاری هوشمند", 
    "مدیریت ریسک مالی",
    "برنامه‌ریزی مالی شخصی",
    "تحلیل بازارهای مالی",
    "سرمایه‌گذاری در بورس و ارز دیجیتال"
  ];

  const handleEnrollClick = () => {
    if (!user) {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-200">
            دوره تخصصی
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            دوره جامع ثروت‌سازی
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            راز ثروتمندان جهان را کشف کنید و با روش‌های علمی و عملی به ثروت برسید
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Clock className="w-5 h-5" />
              <span>۲۰ ساعت محتوا</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Users className="w-5 h-5" />
              <span>+۵۰۰ دانشجو</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Award className="w-5 h-5" />
              <span>گواهینامه معتبر</span>
            </div>
          </div>

          {user ? (
            <PaymentButton 
              courseSlug="wealth"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
            />
          ) : (
            <Button 
              onClick={handleEnrollClick}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
            >
              شروع یادگیری - ۲ میلیون تومان
            </Button>
          )}
        </div>

        {/* Course Content */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  محتوای دوره
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {courseFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>درباره دوره</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  در این دوره جامع، تمام اصول و استراتژی‌های ثروت‌سازی را از پایه تا پیشرفته یاد خواهید گرفت. 
                  از مدیریت مالی شخصی گرفته تا سرمایه‌گذاری‌های پیشرفته، همه چیز را پوشش می‌دهیم.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  این دوره برای افرادی طراحی شده که می‌خواهند به طور علمی و عملی به ثروت برسند و 
                  استقلال مالی کسب کنند.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-center">مشخصات دوره</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    ۲ میلیون تومان
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    ۳ میلیون تومان
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>مدت زمان:</span>
                    <span>۲۰ ساعت</span>
                  </div>
                  <div className="flex justify-between">
                    <span>سطح:</span>
                    <span>مقدماتی تا پیشرفته</span>
                  </div>
                  <div className="flex justify-between">
                    <span>دسترسی:</span>
                    <span>مادام‌العمر</span>
                  </div>
                  <div className="flex justify-between">
                    <span>گواهینامه:</span>
                    <span>دارد</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 pt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="mr-2 text-sm text-gray-600">۴.۹/۵</span>
                </div>

                {user ? (
                  <PaymentButton 
                    courseSlug="wealth"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  />
                ) : (
                  <Button 
                    onClick={handleEnrollClick}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    ثبت نام در دوره
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <AuthenticationModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          redirectTo="/course/wealth"
        />
      </div>
    </div>
  );
};

export default WealthLanding;
