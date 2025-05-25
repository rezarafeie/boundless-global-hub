
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import IframeModal from "@/components/IframeModal";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Users, CheckCircle, Star, Flag, Building, DollarSign, Scale } from "lucide-react";

const AmericanBusinessPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-red-50 to-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              کسب و کار آمریکایی
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              اصول کسب و کار در آمریکا و راز موفقیت در بزرگترین اقتصاد دنیا
            </p>
            
            <CountdownTimer 
              endDate="2025-03-01T23:59:59"
              className="max-w-md mx-auto mb-8"
            />
            
            <Button 
              onClick={openModal}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg rounded-full"
            >
              🇺🇸 شروع دوره رایگان
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
                <CheckCircle className="w-6 h-6 text-red-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">قوانین و مقررات کسب و کار</h3>
                  <p className="text-gray-600">آشنایی کامل با سیستم حقوقی و تجاری آمریکا</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-red-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">نحوه ثبت شرکت</h3>
                  <p className="text-gray-600">راهنمای گام به گام برای شروع کسب و کار قانونی</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-red-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">استراتژی‌های بازاریابی</h3>
                  <p className="text-gray-600">تکنیک‌های فروش موثر در بازار آمریکا</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-red-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">مسائل مالیاتی و حسابداری</h3>
                  <p className="text-gray-600">نحوه مدیریت صحیح امور مالی کسب و کار</p>
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
                  <h3 className="text-2xl font-bold mb-2">۱.۵ ساعت</h3>
                  <p className="text-gray-600">محتوای ویدیویی</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Download className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">فرم‌های قانونی</h3>
                  <p className="text-gray-600">نمونه اسناد و فرم‌ها</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">مشاوره تخصصی</h3>
                  <p className="text-gray-600">پشتیبانی حقوقی</p>
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
              <div className="p-6 bg-red-50 rounded-lg">
                <Flag className="w-8 h-8 mx-auto mb-4 text-red-600" />
                <h3 className="font-semibold mb-2">مهاجران</h3>
                <p className="text-sm text-gray-600">تازه واردان به آمریکا</p>
              </div>
              
              <div className="p-6 bg-blue-50 rounded-lg">
                <Building className="w-8 h-8 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">کارآفرینان</h3>
                <p className="text-sm text-gray-600">علاقه‌مندان به کسب و کار</p>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg">
                <DollarSign className="w-8 h-8 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">سرمایه‌گذاران</h3>
                <p className="text-sm text-gray-600">خواهان سرمایه‌گذاری در آمریکا</p>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-lg">
                <Scale className="w-8 h-8 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">مشاوران حقوقی</h3>
                <p className="text-sm text-gray-600">متخصصان امور مهاجرت</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">همین حالا شروع کنید!</h2>
          <p className="text-xl mb-8 opacity-90">
            فرصت کسب و کار در آمریکا را از دست ندهید
          </p>
          
          <Button 
            onClick={openModal}
            size="lg"
            className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-full"
          >
            🚀 ثبت‌نام رایگان
          </Button>
        </div>
      </section>

      <IframeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="ثبت‌نام در دوره کسب و کار آمریکایی"
        url="https://rafeie.com/class/americanbusiness/"
      />
    </MainLayout>
  );
};

export default AmericanBusinessPage;
