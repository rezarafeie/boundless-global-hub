
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Globe, 
  Star, 
  Shield, 
  Wifi, 
  MessageSquare, 
  Video,
  Radio,
  Lock,
  Heart,
  AlertTriangle,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const SolidarityLanding = () => {
  const freeCourses = [
    {
      title: "شروع بدون مرز",
      description: "اگر نمی‌دونی از کجا شروع کنی، این دوره کمک می‌کنه توی این روزهای سخت مسیرت رو پیدا کنی.",
      link: "/courses/boundless-taste"
    },
    {
      title: "درآمد غیرفعال",
      description: "حتی وقتی زندگی متوقف شده، می‌تونی راه‌هایی برای ساختن درآمد غیرفعال یاد بگیری.",
      link: "/courses/passive-income"
    },
    {
      title: "تغییر",
      description: "برای روزهایی که اضطراب داریم و ذهنمون شلوغه، این دوره کمک می‌کنه آرامش و تمرکز برگرده.",
      link: "/courses/change"
    },
    {
      title: "بیزینس آمریکایی",
      description: "یاد بگیر چطور حتی از ایران کسب‌وکاری جهانی راه بندازی، تا از جنگ و بحران عبور کنی.",
      link: "/courses/american-business"
    },
    {
      title: "مزه متاورس",
      description: "در دل جنگ، وارد آینده‌ای شو که مرزها معنی ندارن. متاورس یعنی آزادی دیجیتال.",
      link: "/courses/metaverse"
    },
    {
      title: "مزه اینستاگرام",
      description: "یاد بگیر با گوشی‌ات درآمد بسازی، از دل محتوا و رسانه حتی توی این شرایط.",
      link: "/courses/instagram"
    },
    {
      title: "ثروت",
      description: "ثروت فقط پول نیست؛ این دوره کمکت می‌کنه نگرشت رو به زندگی و موفقیت عوض کنی.",
      link: "/courses/wealth"
    }
  ];

  return (
    <MainLayout>
      {/* Emergency War Header */}
      <section className="relative min-h-screen bg-gradient-to-br from-black via-red-950/20 to-gray-900 overflow-hidden">
        {/* Dark animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-red-600/10 to-orange-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-red-800/10 to-yellow-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-red-900/5 to-orange-900/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 text-white">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Emergency Badge */}
            <div className="inline-flex items-center gap-2 bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-full px-6 py-3">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-red-300 font-medium">حالت اضطراری - وضعیت جنگ</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                حالت اضطراری جنگ
              </span>
              <br />
              <span className="text-white text-3xl md:text-4xl">
                همبستگی انسان‌دوستانه
              </span>
            </h1>

            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-red-300">
                در کنار مردم هستیم
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                در روزهای جنگ، با دانش و اینترنت آزاد کنار شما هستیم
              </p>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                تمامی دوره‌های آکادمی رفیعی را رایگان در اختیار مردم ایران قرار می‌دهیم، تا دانش، چراغی باشد در تاریکی جنگ
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                <BookOpen className="w-5 h-5 mr-2" />
                دریافت رایگان دوره‌ها
              </Button>
              <Button asChild size="lg" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-600/10">
                <Link to="/hub">
                  <Globe className="w-5 h-5 mr-2" />
                  اتصال به اینترنت بدون مرز
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Hub Banner */}
      <section className="py-8 bg-gradient-to-r from-red-900/20 to-orange-900/20 border-y border-red-500/20">
        <div className="container">
          <div className="bg-red-950/30 backdrop-blur-sm border border-red-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Radio className="w-6 h-6 text-red-400 animate-pulse" />
              <h3 className="text-xl font-bold text-red-300">📢 مرکز ارتباط بدون مرز فعال شد</h3>
            </div>
            <p className="text-gray-300 mb-4">
              برای دسترسی به اطلاعیه‌های فوری، پخش زنده، جلسات تصویری و گفتگوی گروهی با اعضای جامعه بدون مرز وارد شوید
            </p>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link to="/hub">
                ورود به مرکز ارتباط بدون مرز
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Free Courses Section */}
      <section className="py-16 bg-gray-900">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              دوره‌های رایگان برای مردم ایران
            </h2>
            <p className="text-lg text-gray-300">
              در این زمان سخت، دانش را به عنوان ابزار مقاومت و امید ارائه می‌دهیم
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeCourses.map((course, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-red-500/30 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-white">{course.title}</CardTitle>
                    <Badge className="bg-red-600 text-white">رایگان</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{course.description}</p>
                  <Button asChild className="w-full bg-red-600 hover:bg-red-700">
                    <Link to={course.link}>
                      شروع یادگیری
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Communication Hub Section */}
      <section className="py-16 bg-black">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              مرکز ارتباط بدون مرز
            </h2>
            <p className="text-lg text-gray-300">
              اطلاعیه‌ها، گفتگوی زنده، جلسات تصویری و پخش مستقیم - همه در یک مکان
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800/30 border-gray-700 text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Radio className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-white">📺 پخش زنده</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">در حال حاضر غیرفعال است</p>
                <Button disabled className="w-full bg-gray-700">
                  فعلاً غیرفعال است
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 border-gray-700 text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">🎥 جلسه تصویری رفیعی</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">اطلاعیه‌های مهم</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  آخرین اخبار و اطلاعیه‌های مهم از تیم بدون مرز
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 border-gray-700 text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white">چت گروهی زنده</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">به گفتگوی زنده اعضای جامعه بدون مرز بپیوندید</p>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link to="/hub/chat">
                    ورود به چت
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 border-gray-700 text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">دسترسی کامل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">دسترسی کامل به تمام امکانات مرکز ارتباط</p>
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                  <Link to="/hub">
                    ورود به مرکز ارتباط
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Borderless Network Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                شبکه بدون مرز
              </h2>
              <p className="text-lg text-gray-300 mb-2">
                ابزار مقاومت دیجیتال - دسترسی آزاد به اینترنت حتی در زمان قطع ارتباطات
              </p>
              <p className="text-xl font-semibold text-red-300">
                آزادی دیجیتال در دستان شما
              </p>
            </div>

            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardContent className="p-8">
                <p className="text-gray-300 text-lg mb-6">
                  با استفاده از شبکه بدون مرز می‌توانید در هر شرایطی، حتی قطع اینترنت، به دنیای آزاد متصل بمانید
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-6 h-6 text-green-400" />
                    <span className="text-white">دسترسی مداوم به اینترنت</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <span className="text-white">امنیت و رمزگذاری پیشرفته</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-purple-400" />
                    <span className="text-white">دور زدن فیلترینگ و محدودیت‌ها</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                  <p className="text-yellow-300 font-mono">آدرس سایت: bnets.co</p>
                </div>

                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  دریافت اتصال امن
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Freedom of Information Section */}
      <section className="py-16 bg-red-950/20">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              آزادی اطلاعات
            </h2>
            <p className="text-lg text-gray-300">
              حق دسترسی به اطلاعات و ارتباط آزاد، حقی انسانی و غیرقابل انکار است
            </p>
          </div>
        </div>
      </section>

      {/* Solidarity Message */}
      <section className="py-16 bg-black">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              پیام همبستگی
            </h2>
            <div className="bg-gray-900/50 rounded-lg p-8 border border-red-500/20">
              <div className="flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-red-400 animate-pulse" />
              </div>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                در این لحظات سخت، ما با مردم ایران هستیم. دانش و آگاهی، قدرتمندترین ابزار مقاومت در برابر تاریکی است. 
                با ارائه آموزش‌های رایگان و دسترسی آزاد به اینترنت، امیدواریم بتوانیم چراغی باشیم در این شب طولانی.
              </p>
              <p className="text-xl font-bold text-red-300 mb-4">
                امید، در یادگیری است. آزادی، در دانش است.
              </p>
              <div className="text-4xl">✊</div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default SolidarityLanding;
