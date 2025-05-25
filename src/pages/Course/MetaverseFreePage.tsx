
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import IframeModal from "@/components/IframeModal";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Users, CheckCircle, Star, Clock, Award } from "lucide-react";

const MetaverseFreePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              آشنایی با متاورس
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              ورود به دنیای دیجیتال آینده و کسب درآمد از فرصت‌های بی‌نظیر متاورس
            </p>
            
            <CountdownTimer 
              endDate="2025-02-01T23:59:59"
              className="max-w-md mx-auto mb-8"
            />
            
            <Button 
              onClick={openModal}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-full"
            >
              🎯 شروع دوره رایگان
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
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">مفاهیم پایه‌ای متاورس</h3>
                  <p className="text-gray-600">آشنایی کامل با تکنولوژی‌های Web3، بلاک‌چین و دنیای مجازی</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">ارزهای دیجیتال و NFT</h3>
                  <p className="text-gray-600">نحوه خرید، فروش و سرمایه‌گذاری در ارزهای دیجیتال و NFT</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">فرصت‌های کسب و کار</h3>
                  <p className="text-gray-600">شناسایی و بهره‌برداری از فرصت‌های درآمدزایی در متاورس</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">استراتژی‌های سرمایه‌گذاری</h3>
                  <p className="text-gray-600">روش‌های ایمن و سودآور سرمایه‌گذاری در پروژه‌های متاورس</p>
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
                  <h3 className="text-2xl font-bold mb-2">۲.۵ ساعت</h3>
                  <p className="text-gray-600">محتوای ویدیویی</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Download className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">راهنمای عملی</h3>
                  <p className="text-gray-600">فایل‌های قابل دانلود</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">انجمن یادگیری</h3>
                  <p className="text-gray-600">پشتیبانی و ارتباط</p>
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
                <Award className="w-8 h-8 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">کارآفرینان</h3>
                <p className="text-sm text-gray-600">علاقه‌مندان به کسب و کار دیجیتال</p>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg">
                <Star className="w-8 h-8 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">سرمایه‌گذاران</h3>
                <p className="text-sm text-gray-600">خواهان سرمایه‌گذاری در تکنولوژی</p>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-lg">
                <Clock className="w-8 h-8 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">دانشجویان</h3>
                <p className="text-sm text-gray-600">علاقه‌مندان به فناوری‌های نوین</p>
              </div>
              
              <div className="p-6 bg-orange-50 rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">عموم علاقه‌مندان</h3>
                <p className="text-sm text-gray-600">کنجکاو درباره آینده دیجیتال</p>
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
                    "دوره‌ای فوق‌العاده مفید بود. حالا می‌تونم با اطمینان بیشتری وارد دنیای متاورس بشم."
                  </p>
                  <p className="font-semibold">- محمد حسینی</p>
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
                    "مفاهیم پیچیده رو خیلی ساده و قابل فهم توضیح دادن. دست استاد درد نکنه!"
                  </p>
                  <p className="font-semibold">- فاطمه احمدی</p>
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
                  <h3 className="font-semibold mb-2">آیا این دوره واقعاً رایگان است؟</h3>
                  <p className="text-gray-600">بله، این دوره کاملاً رایگان است و نیازی به پرداخت هیچ هزینه‌ای ندارید.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">چقدر زمان برای تکمیل دوره نیاز است؟</h3>
                  <p className="text-gray-600">دوره شامل ۲.۵ ساعت محتوای ویدیویی است که می‌توانید در زمان دلخواه خود مطالعه کنید.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">آیا گواهی دریافت می‌کنم؟</h3>
                  <p className="text-gray-600">بله، پس از تکمیل دوره، گواهی معتبر دریافت خواهید کرد.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">همین حالا شروع کنید!</h2>
          <p className="text-xl mb-8 opacity-90">
            فرصت طلایی برای ورود به دنیای متاورس را از دست ندهید
          </p>
          
          <Button 
            onClick={openModal}
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg rounded-full"
          >
            🚀 ثبت‌نام رایگان
          </Button>
        </div>
      </section>

      <IframeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="ثبت‌نام در دوره آشنایی با متاورس"
        url="https://rafeie.com/start"
      />
    </MainLayout>
  );
};

export default MetaverseFreePage;
