
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
  Unlock,
  AlertTriangle
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 dark:from-black dark:via-gray-900 dark:to-black relative overflow-hidden" dir="rtl">
        
        {/* War Effects Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-gray-900/20 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-red-700 to-red-600 animate-pulse"></div>
        
        {/* Iranian Flag - Top Left */}
        <div className="absolute top-6 left-6 z-20">
          <div className="w-16 h-12 shadow-2xl rounded border border-gray-700">
            <div className="w-full h-4 bg-green-600"></div>
            <div className="w-full h-4 bg-white flex items-center justify-center">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            </div>
            <div className="w-full h-4 bg-red-600"></div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-black/30 to-green-600/20"></div>
          <div className="relative max-w-6xl mx-auto text-center">
            
            {/* War Status Badge */}
            <Badge className="mb-6 bg-red-900/80 text-red-100 dark:bg-red-900 dark:text-red-200 text-lg px-8 py-3 border border-red-700 shadow-lg">
              <AlertTriangle className="w-6 h-6 ml-2 animate-pulse text-red-400" />
              حالت اضطراری جنگ - همبستگی انسان‌دوستانه
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-2xl">
              در کنار مردم هستیم
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-3xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
              در روزهای جنگ، با دانش و اینترنت آزاد کنار شما هستیم
            </p>

            {/* Emergency Message */}
            <div className="bg-black/70 backdrop-blur-sm rounded-3xl p-8 mb-12 border border-red-800/50 shadow-2xl max-w-5xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-3"></div>
                <AlertTriangle className="w-6 h-6 text-red-400 ml-3" />
              </div>
              <p className="text-lg text-gray-200 leading-relaxed font-medium">
                تمامی دوره‌های آکادمی رفیعی را رایگان در اختیار مردم ایران قرار می‌دهیم، تا دانش، چراغی باشد در تاریکی جنگ
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-green-700 hover:bg-green-600 text-white px-10 py-5 text-xl rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 border border-green-600"
              >
                <Download className="w-7 h-7 ml-2" />
                دریافت رایگان دوره‌ها
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-red-600 text-red-400 hover:bg-red-600 hover:text-white px-10 py-5 text-xl rounded-full shadow-2xl hover:shadow-red-500/25 transition-all duration-300 bg-black/50"
                asChild
              >
                <a href="https://bnets.co" target="_blank" rel="noopener noreferrer">
                  <Unlock className="w-7 h-7 ml-2" />
                  اتصال به اینترنت بدون مرز
                  <ExternalLink className="w-5 h-5 mr-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Free Courses Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black/80 to-gray-900/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-4"></div>
                <h2 className="text-3xl md:text-5xl font-bold text-white">
                  دوره‌های رایگان برای مردم ایران
                </h2>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-4"></div>
              </div>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                در این زمان سخت، دانش را به عنوان ابزار مقاومت و امید ارائه می‌دهیم
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {freeCourses.map((course, index) => {
                const IconComponent = course.icon;
                return (
                  <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border border-gray-700 shadow-xl bg-gray-900/90 backdrop-blur-sm hover:border-red-500/50">
                    <CardContent className="p-8">
                      <div className="flex items-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-r from-red-600 to-green-600 rounded-full flex items-center justify-center ml-4 shadow-lg">
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {course.title}
                          </h3>
                          <Badge className="bg-green-800/80 text-green-200 border border-green-600">
                            رایگان
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-400 mb-6 text-base">
                        {course.description}
                      </p>
                      <Link to={`/course/${course.slug}`}>
                        <Button className="w-full bg-red-700 hover:bg-red-600 text-white rounded-lg py-3 shadow-lg hover:shadow-red-500/25 transition-all duration-300">
                          <BookOpen className="w-5 h-5 ml-2" />
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
        <section className="py-20 px-4 bg-gradient-to-r from-gray-900/90 via-black/90 to-gray-800/90 backdrop-blur-sm border-t border-red-800/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-700 to-green-700 rounded-full mb-8 shadow-2xl">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                شبکه بدون مرز
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-4xl mx-auto">
                ابزار مقاومت دیجیتال - دسترسی آزاد به اینترنت حتی در زمان قطع ارتباطات
              </p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-gray-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-6">
                    آزادی دیجیتال در دستان شما
                  </h3>
                  <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                    با استفاده از شبکه بدون مرز می‌توانید در هر شرایطی، حتی قطع اینترنت، به دنیای آزاد متصل بمانید
                  </p>
                  
                  <div className="space-y-6 mb-10">
                    <div className="flex items-center">
                      <Wifi className="w-7 h-7 text-green-400 ml-4" />
                      <span className="text-gray-200 text-lg">دسترسی مداوم به اینترنت</span>
                    </div>
                    <div className="flex items-center">
                      <Lock className="w-7 h-7 text-red-400 ml-4" />
                      <span className="text-gray-200 text-lg">امنیت و رمزگذاری پیشرفته</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="w-7 h-7 text-blue-400 ml-4" />
                      <span className="text-gray-200 text-lg">دور زدن فیلترینگ و محدودیت‌ها</span>
                    </div>
                  </div>

                  <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6 mb-8">
                    <p className="text-red-200 font-semibold text-xl">
                      آدرس سایت: 
                      <a 
                        href="https://bnets.co" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mr-3 underline hover:no-underline text-red-300"
                      >
                        bnets.co
                      </a>
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-red-700 to-green-700 hover:from-red-600 hover:to-green-600 text-white py-5 text-xl rounded-xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300 border border-red-600"
                    asChild
                  >
                    <a href="https://bnets.co" target="_blank" rel="noopener noreferrer">
                      <Shield className="w-7 h-7 ml-2" />
                      دریافت اتصال امن
                      <ExternalLink className="w-5 h-5 mr-2" />
                    </a>
                  </Button>
                </div>

                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-800/80 to-black/80 rounded-3xl p-10 text-center border border-gray-700 shadow-2xl">
                    <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-r from-red-600 to-green-600 rounded-full shadow-2xl mb-8">
                      <Unlock className="w-14 h-14 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-6">
                      آزادی اطلاعات
                    </h4>
                    <p className="text-gray-400 text-lg">
                      حق دسترسی به اطلاعات و ارتباط آزاد، حقی انسانی و غیرقابل انکار است
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solidarity Message */}
        <section className="py-20 px-4 bg-gradient-to-b from-black/90 to-gray-900/90">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-10">
              <Heart className="w-20 h-20 text-red-500 animate-pulse" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
              پیام همبستگی
            </h2>
            <div className="bg-black/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-red-800/50">
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                در این لحظات سخت، ما با مردم ایران هستیم. دانش و آگاهی، قدرتمندترین ابزار مقاومت در برابر تاریکی است. 
                با ارائه آموزش‌های رایگان و دسترسی آزاد به اینترنت، امیدواریم بتوانیم چراغی باشیم در این شب طولانی.
              </p>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-4"></div>
                <p className="text-2xl font-semibold text-white">
                  امید، در یادگیری است. آزادی، در دانش است. ✊
                </p>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-4"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default SolidarityLanding;
