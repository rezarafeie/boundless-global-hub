
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import IframeModal from "@/components/IframeModal";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Users, CheckCircle, Star, Zap, Target, Brain, Rocket } from "lucide-react";

const ChangeCoursePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              پروژه تغییر
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              یادگیری اصول تغییر و تحول شخصی برای رسیدن به بهترین نسخه از خودتان
            </p>
            
            <CountdownTimer 
              endDate="2025-02-20T23:59:59"
              className="max-w-md mx-auto mb-8"
            />
            
            <Button 
              onClick={openModal}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full"
            >
              ⚡ شروع دوره رایگان
            </Button>
            
            <p className="text-sm text-gray-500 mt-4">
              ✅ دسترسی فوری • ✅ بدون هیچ هزینه‌ای • ✅ گواهی معتبر
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">چه چیزهایی یاد می‌گیرید؟</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-purple-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">اصول علمی تغییر رفتار</h3>
                  <p className="text-gray-600">یادگیری روش‌های مبتنی بر علم برای ایجاد عادت‌های مثبت</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-purple-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">غلبه بر مقاومت در برابر تغییر</h3>
                  <p className="text-gray-600">تکنیک‌های عملی برای شکستن الگوهای منفی ذهنی</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-purple-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">برنامه‌ریزی هدفمند</h3>
                  <p className="text-gray-600">ایجاد برنامه شخصی‌سازی شده برای رسیدن به اهداف</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-purple-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">تقویت انگیزه و اراده</h3>
                  <p className="text-gray-600">روش‌های حفظ انگیزه در مسیر تغییر و پیشرفت</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Play className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">۲ ساعت</h3>
                  <p className="text-gray-600">محتوای ویدیویی</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Download className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">منابع قابل دانلود</h3>
                  <p className="text-gray-600">کتابچه‌های عملی</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">پشتیبانی آنلاین</h3>
                  <p className="text-gray-600">مربیگری شخصی</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Join */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">این دوره برای چه کسانی است؟</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-purple-50 rounded-lg">
                <Zap className="w-8 h-8 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">افراد انگیزه‌مند</h3>
                <p className="text-sm text-gray-600">خواهان تغییر مثبت</p>
              </div>
              
              <div className="p-6 bg-blue-50 rounded-lg">
                <Target className="w-8 h-8 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">هدف‌گراها</h3>
                <p className="text-sm text-gray-600">دارای اهداف مشخص</p>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg">
                <Brain className="w-8 h-8 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">علاقه‌مندان به رشد</h3>
                <p className="text-sm text-gray-600">خواهان پیشرفت شخصی</p>
              </div>
              
              <div className="p-6 bg-orange-50 rounded-lg">
                <Rocket className="w-8 h-8 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">کارآفرینان</h3>
                <p className="text-sm text-gray-600">خواهان موفقیت در کسب و کار</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-purple-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">همین حالا شروع کنید!</h2>
          <p className="text-xl mb-8 opacity-90">
            تغییر مثبت در زندگی‌تان را از امروز آغاز کنید
          </p>
          
          <Button 
            onClick={openModal}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-full"
          >
            🚀 ثبت‌نام رایگان
          </Button>
        </div>
      </section>

      <IframeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="ثبت‌نام در پروژه تغییر"
        url="https://rafeie.com/taghir"
      />
    </MainLayout>
  );
};

export default ChangeCoursePage;
