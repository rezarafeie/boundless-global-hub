import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import CourseRegistrationForm from "@/components/CourseRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Trophy, Users, Target, TrendingUp, Instagram, Play } from "lucide-react";

const InstagramLanding = () => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  if (showRegistrationForm) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
          <div className="container max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowRegistrationForm(false)}
                className="mb-4"
              >
                بازگشت به صفحه دوره
              </Button>
            </div>
            <CourseRegistrationForm 
              courseSlug="instagram" 
              courseTitle="اینستاگرام اسنشیالز"
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-24 pb-16 overflow-hidden">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2">
                🔥 محبوب‌ترین دوره اینستاگرام
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  اینستاگرام اسنشیالز
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                از صفر تا قهرمان اینستاگرام! یاد بگیرید چگونه محتوای جذاب تولید کنید، فالوور واقعی جذب کنید و از اینستاگرام درآمدزایی کنید.
              </p>
              
              {/* Price Block */}
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-2xl space-y-3 max-w-sm border border-pink-200">
                <div className="flex justify-between items-center">
                  <span className="line-through text-gray-500 text-lg">
                    ۳٫۵ میلیون تومان
                  </span>
                  <Badge className="bg-red-500 text-white">
                    ۴۸% تخفیف
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-pink-600">
                  ۱٫۸ میلیون تومان
                </div>
                <div className="text-sm text-gray-600">
                  شامل تمام بونوس‌ها و پشتیبانی
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  <Instagram className="w-5 h-5 mr-2" />
                  شروع دوره اینستاگرام
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>آخرین فرصت ثبت‌نام با این قیمت!</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border border-pink-200 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                  <Instagram size={80} className="text-pink-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">پیش‌نمایش دوره</p>
                </div>
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="bg-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            چه چیزی یاد خواهید گرفت؟
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-pink-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">جذب فالوور هدفمند</h3>
                    <p className="text-gray-600">
                      یاد می‌گیرید چگونه با استفاده از استراتژی‌های محتوایی و هشتگ‌گذاری، فالوورهای واقعی و علاقه‌مند به حوزه کاری خود جذب کنید.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">افزایش نرخ تعامل</h3>
                    <p className="text-gray-600">
                      با تکنیک‌های افزایش تعامل، کاری می‌کنید که پست‌های شما بیشتر دیده شوند، لایک و کامنت بیشتری بگیرند و به اکسپلور راه پیدا کنند.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-pink-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">تبدیل فالوور به مشتری</h3>
                    <p className="text-gray-600">
                      با استفاده از قیف فروش اینستاگرامی، فالوورهای خود را به مشتریان وفادار تبدیل می‌کنید و فروش خود را چند برابر می‌کنید.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Features */}
      <section className="bg-gradient-to-br from-pink-50 via-white to-purple-50 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            ویژگی‌های کلیدی دوره
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center border-pink-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Instagram className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">آموزش جامع و کاربردی</h3>
                <p className="text-gray-600 text-sm">
                  از مبانی تا تکنیک‌های پیشرفته اینستاگرام
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">پشتیبانی و منتورینگ</h3>
                <p className="text-gray-600 text-sm">
                  پاسخ به سوالات و رفع اشکالات شما
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-pink-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Check className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">آپدیت‌های رایگان</h3>
                <p className="text-gray-600 text-sm">
                  مطالب جدید و تغییرات الگوریتم اینستاگرام
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="bg-white py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-pink-100 to-purple-100 mx-auto mb-6">
              <Instagram size={48} className="text-pink-500 mx-auto" />
            </div>
            <h3 className="text-xl font-bold mb-2">رضا رفیعی</h3>
            <p className="text-sm text-gray-600 mb-4">مدرس و متخصص بازاریابی اینستاگرام</p>
            <p className="text-gray-700">
              با بیش از ۱۰ سال تجربه در زمینه بازاریابی دیجیتال و مدیریت شبکه‌های اجتماعی، به شما کمک می‌کنم تا به یک اینفلوئنسر موفق در اینستاگرام تبدیل شوید.
            </p>
          </div>
        </div>
      </section>
      
      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-200 py-3 z-30 shadow-lg">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-pink-600">اینستاگرام اسنشیالز - ۱٫۸ میلیون تومان</div>
              <div className="text-sm text-gray-600">آخرین فرصت ثبت‌نام</div>
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full w-full sm:w-auto"
              onClick={() => setShowRegistrationForm(true)}
            >
              <Instagram className="w-4 h-4 mr-2" />
              ثبت‌نام در دوره
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default InstagramLanding;
