
import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Globe, 
  Shield, 
  Heart, 
  Users, 
  Download,
  ExternalLink,
  Wifi,
  Lock,
  Unlock
} from "lucide-react";

const SolidarityLanding = () => {
  const freeCourses = [
    {
      title: "شروع بدون مرز",
      slug: "boundless-taste",
      description: "آموزش کارآفرینی بین‌المللی",
      icon: Globe
    },
    {
      title: "درآمد غیرفعال", 
      slug: "passive-income",
      description: "ایجاد منابع درآمد پایدار",
      icon: BookOpen
    },
    {
      title: "تغییر",
      slug: "change", 
      description: "تحول شخصی و حرفه‌ای",
      icon: Heart
    },
    {
      title: "بیزینس آمریکایی",
      slug: "american-business",
      description: "استراتژی‌های کسب‌وکار آمریکایی",
      icon: Users
    },
    {
      title: "مزه متاورس",
      slug: "metaverse-free", 
      description: "آینده تکنولوژی و کسب‌وکار",
      icon: Globe
    },
    {
      title: "مزه اینستاگرام",
      slug: "instagram-essentials",
      description: "بازاریابی و برندسازی",
      icon: Users
    },
    {
      title: "ثروت",
      slug: "wealth",
      description: "مدیریت مالی و سرمایه‌گذاری", 
      icon: BookOpen
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950/20 dark:via-gray-900 dark:to-green-950/20" dir="rtl">
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-white/5 to-green-600/10"></div>
          <div className="relative max-w-6xl mx-auto text-center">
            
            {/* Solidarity Badge */}
            <Badge className="mb-6 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-lg px-6 py-2">
              <Heart className="w-5 h-5 ml-2" />
              همبستگی انسان‌دوستانه
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              در کنار مردم هستیم
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              در روزهای جنگ، با دانش و اینترنت آزاد کنار شما هستیم
            </p>

            {/* Solidarity Message */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto">
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                تمامی دوره‌های آکادمی رفیعی را رایگان در اختیار مردم ایران قرار می‌دهیم، تا دانش، چراغی باشد در تاریکی جنگ
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="w-6 h-6 ml-2" />
                دریافت رایگان دوره‌ها
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <a href="https://bnets.co" target="_blank" rel="noopener noreferrer">
                  <Unlock className="w-6 h-6 ml-2" />
                  اتصال به اینترنت بدون مرز
                  <ExternalLink className="w-4 h-4 mr-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Free Courses Section */}
        <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                دوره‌های رایگان برای مردم ایران
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                در این زمان سخت، دانش را به عنوان ابزار مقاومت و امید ارائه می‌دهیم
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeCourses.map((course, index) => {
                const IconComponent = course.icon;
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white dark:bg-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center ml-4">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {course.title}
                          </h3>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            رایگان
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {course.description}
                      </p>
                      <Link to={`/course/${course.slug}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                          <BookOpen className="w-4 h-4 ml-2" />
                          شروع یادگیری
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Internet Freedom Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-gray-900 dark:to-purple-950/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                شبکه بدون مرز
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-4xl mx-auto">
                ابزار مقاومت دیجیتال - دسترسی آزاد به اینترنت حتی در زمان قطع ارتباطات
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    آزادی دیجیتال در دستان شما
                  </h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    با استفاده از شبکه بدون مرز می‌توانید در هر شرایطی، حتی قطع اینترنت، به دنیای آزاد متصل بمانید
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center">
                      <Wifi className="w-6 h-6 text-green-600 ml-3" />
                      <span className="text-gray-800 dark:text-gray-200">دسترسی مداوم به اینترنت</span>
                    </div>
                    <div className="flex items-center">
                      <Lock className="w-6 h-6 text-blue-600 ml-3" />
                      <span className="text-gray-800 dark:text-gray-200">امنیت و رمزگذاری پیشرفته</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="w-6 h-6 text-purple-600 ml-3" />
                      <span className="text-gray-800 dark:text-gray-200">دور زدن فیلترینگ و محدودیت‌ها</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 mb-6">
                    <p className="text-blue-800 dark:text-blue-200 font-semibold text-lg">
                      آدرس سایت: 
                      <a 
                        href="https://bnets.co" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mr-2 underline hover:no-underline"
                      >
                        bnets.co
                      </a>
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    asChild
                  >
                    <a href="https://bnets.co" target="_blank" rel="noopener noreferrer">
                      <Shield className="w-6 h-6 ml-2" />
                      دریافت اتصال امن
                      <ExternalLink className="w-4 h-4 mr-2" />
                    </a>
                  </Button>
                </div>

                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-6">
                      <Unlock className="w-12 h-12 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      آزادی اطلاعات
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      حق دسترسی به اطلاعات و ارتباط آزاد، حقی انسانی و غیرقابل انکار است
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solidarity Message */}
        <section className="py-16 px-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <Heart className="w-16 h-16 text-red-500 mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              پیام همبستگی
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                در این لحظات سخت، ما با مردم ایران هستیم. دانش و آگاهی، قدرتمندترین ابزار مقاومت در برابر تاریکی است. 
                با ارائه آموزش‌های رایگان و دسترسی آزاد به اینترنت، امیدواریم بتوانیم چراغی باشیم در این شب طولانی.
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                امید، در یادگیری است. آزادی، در دانش است. ✊
              </p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default SolidarityLanding;
