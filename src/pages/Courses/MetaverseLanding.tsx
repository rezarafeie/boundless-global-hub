import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import CourseRegistrationForm from "@/components/CourseRegistrationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Zap, Globe, Coins, TrendingUp, Play } from "lucide-react";

const MetaverseLanding = () => {
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
              courseSlug="metaverse" 
              courseTitle="امپراطوری متاورس"
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2">
                🚀 آینده تکنولوژی
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                  امپراطوری متاورس
                </span>
              </h1>
              
              <p className="text-xl text-purple-100 leading-relaxed">
                وارد دنیای آینده شوید! از NFT و Web3 تا ساخت کسب‌وکار در متاورس. همه چیز را از صفر یاد بگیرید و امپراطوری دیجیتال خود را بسازید.
              </p>
              
              {/* Price Block */}
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl space-y-3 max-w-sm border border-white/20">
                <div className="flex justify-between items-center">
                  <span className="line-through text-purple-200 text-lg">
                    ۵ میلیون تومان
                  </span>
                  <Badge className="bg-yellow-500 text-black">
                    ۴۴% تخفیف
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-white">
                  ۲٫۸ میلیون تومان
                </div>
                <div className="text-sm text-purple-200">
                  دسترسی کامل به اکوسیستم متاورس
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  <Globe className="w-5 h-5 mr-2" />
                  ورود به متاورس
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Clock size={16} />
                <span>تعداد محدود - فقط ۵۰ نفر!</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border border-purple-400/30 bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <Globe size={80} className="text-purple-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-white">دنیای متاورس</p>
                </div>
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-black/10 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            چرا امپراطوری متاورس؟
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 text-center">
              <CardContent className="p-6">
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  یادگیری سریع و آسان
                </h3>
                <p className="text-gray-300">
                  مفاهیم پیچیده متاورس را به زبان ساده یاد بگیرید
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 text-center">
              <CardContent className="p-6">
                <Globe className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  ورود به دنیای جدید
                </h3>
                <p className="text-gray-300">
                  فرصت‌های بی‌نظیر کسب‌وکار در متاورس را کشف کنید
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 text-center">
              <CardContent className="p-6">
                <Coins className="w-10 h-10 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  کسب درآمد دلاری
                </h3>
                <p className="text-gray-300">
                  روش‌های کسب درآمد از NFT، Web3 و پروژه‌های متاورسی
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="bg-black text-white py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            در این دوره چه چیزهایی یاد می‌گیرید؟
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <TrendingUp size={32} className="text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                NFT و دارایی‌های دیجیتال
              </h3>
              <p className="text-sm text-white/70">
                چگونه NFT بسازید، بخرید و بفروشید
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <TrendingUp size={32} className="text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Web3 و آینده اینترنت
              </h3>
              <p className="text-sm text-white/70">
                چگونه از Web3 برای ساخت برنامه‌های غیرمتمرکز استفاده کنید
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors">
              <TrendingUp size={32} className="text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                کسب‌وکار در متاورس
              </h3>
              <p className="text-sm text-white/70">
                چگونه در متاورس کسب‌وکار خود را راه‌اندازی کنید
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-blue-900 border-t border-purple-500/30 py-3 z-30 shadow-lg">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-white">امپراطوری متاورس - ۲٫۸ میلیون تومان</div>
              <div className="text-sm text-purple-200">تعداد محدود باقی مانده</div>
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full w-full sm:w-auto"
              onClick={() => setShowRegistrationForm(true)}
            >
              <Globe className="w-4 h-4 mr-2" />
              ثبت‌نام در دوره
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MetaverseLanding;
