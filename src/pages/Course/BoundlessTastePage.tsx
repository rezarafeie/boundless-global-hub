
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import IframeModal from "@/components/IframeModal";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Users, CheckCircle, Star, Globe, TrendingUp, Target } from "lucide-react";

const BoundlessTastePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              مزه بدون مرز
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              تجربه کسب و کار بین‌المللی و کشف فرصت‌های بی‌نظیر در بازارهای جهانی
            </p>
            
            <CountdownTimer 
              endDate="2025-02-15T23:59:59"
              className="max-w-md mx-auto mb-8"
            />
            
            <Button 
              onClick={openModal}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full"
            >
              🌍 شروع دوره رایگان
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
                <CheckCircle className="w-6 h-6 text-blue-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">اصول کسب و کار بین‌المللی</h3>
                  <p className="text-gray-600">آشنایی با قوانین و استانداردهای تجارت جهانی</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-blue-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">تکنیک‌های توسعه کسب و کار</h3>
                  <p className="text-gray-600">روش‌های مدرن برای گسترش کسب و کار در سطح بین‌المللی</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-blue-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">شناخت بازارهای جهانی</h3>
                  <p className="text-gray-600">تحلیل و شناسایی فرصت‌های سرمایه‌گذاری مطمئن</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-blue-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">استراتژی‌های صادرات و واردات</h3>
                  <p className="text-gray-600">نحوه ورود موثر به بازارهای بین‌المللی</p>
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
                  <h3 className="text-2xl font-bold mb-2">منابع قابل دانلود</h3>
                  <p className="text-gray-600">فایل‌های آموزشی</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">پشتیبانی آنلاین</h3>
                  <p className="text-gray-600">راهنمایی مستمر</p>
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
              <div className="p-6 bg-blue-50 rounded-lg">
                <Globe className="w-8 h-8 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">صاحبان کسب و کار</h3>
                <p className="text-sm text-gray-600">خواهان توسعه بین‌المللی</p>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">بازرگانان</h3>
                <p className="text-sm text-gray-600">علاقه‌مندان به تجارت خارجی</p>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-lg">
                <Target className="w-8 h-8 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">سرمایه‌گذاران</h3>
                <p className="text-sm text-gray-600">جویای فرصت‌های جدید</p>
              </div>
              
              <div className="p-6 bg-orange-50 rounded-lg">
                <Star className="w-8 h-8 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">کارآفرینان</h3>
                <p className="text-sm text-gray-600">علاقه‌مندان به کسب و کار</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">نظرات شرکت‌کنندگان</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">
                    "این دوره چشمانم را به فرصت‌های بی‌نظیر بازارهای بین‌المللی باز کرد."
                  </p>
                  <p className="font-semibold">- علی رضایی</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">
                    "اطلاعات عملی و کاربردی که واقعاً توی کارم به دردم خورد."
                  </p>
                  <p className="font-semibold">- مریم کریمی</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">سوالات متداول</h2>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">آیا نیاز به تجربه قبلی دارم؟</h3>
                  <p className="text-gray-600">خیر، این دوره برای تمام سطوح طراحی شده و از مبانی شروع می‌کند.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">چگونه می‌توانم با استاد ارتباط برقرار کنم؟</h3>
                  <p className="text-gray-600">از طریق پلتفرم آموزشی و انجمن دانشجویان می‌توانید سوالات خود را مطرح کنید.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">محتوای دوره چقدر به‌روز است؟</h3>
                  <p className="text-gray-600">تمام محتوای دوره بر اساس جدیدترین روندهای بازار جهانی تدوین شده است.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">همین حالا شروع کنید!</h2>
          <p className="text-xl mb-8 opacity-90">
            فرصت ورود به بازارهای بین‌المللی را از دست ندهید
          </p>
          
          <Button 
            onClick={openModal}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-full"
          >
            🚀 ثبت‌نام رایگان
          </Button>
        </div>
      </section>

      <IframeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="ثبت‌نام در دوره مزه بدون مرز"
        url="https://rafeie.com/start"
      />
    </MainLayout>
  );
};

export default BoundlessTastePage;
