
import React from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users, Award, Play, ArrowRight, CheckCircle } from "lucide-react";

const FreeCourseStart = () => {
  const { slug } = useParams();

  // Sample free courses data
  const courses = {
    "passive-income": {
      title: "پروژه درآمد غیرفعال",
      englishTitle: "Passive Income Project",
      description: "راهنمای کامل برای ایجاد منابع درآمد غیرفعال و مستقل از زمان",
      instructor: "رضا رافعی",
      duration: "۴ ساعت",
      lessons: "۱۲ درس",
      students: "۲,۳۴۰",
      level: "مقدماتی تا پیشرفته",
      modules: [
        {
          title: "مبانی درآمد غیرفعال",
          lessons: ["تعریف درآمد غیرفعال", "انواع منابع درآمد", "برنامه‌ریزی اولیه"],
          duration: "۱ ساعت"
        },
        {
          title: "سرمایه‌گذاری هوشمند",
          lessons: ["بورس و سهام", "املاک", "ارزهای دیجیتال"],
          duration: "۱.۵ ساعت"
        },
        {
          title: "کسب‌وکار آنلاین",
          lessons: ["فروش محصولات دیجیتال", "بازاریابی وابسته", "درآمد از محتوا"],
          duration: "۱.۵ ساعت"
        }
      ]
    },
    "change": {
      title: "پروژه تغییر",
      englishTitle: "Change Project",
      description: "دوره جامع برای تغییر مثبت زندگی و دستیابی به اهداف بزرگ",
      instructor: "رضا رافعی",
      duration: "۳ ساعت",
      lessons: "۱۰ درس",
      students: "۱,۸۹۰",
      level: "همه سطوح",
      modules: [
        {
          title: "تحلیل وضعیت فعلی",
          lessons: ["ارزیابی زندگی", "شناسایی نقاط ضعف", "تعیین اولویت‌ها"],
          duration: "۱ ساعت"
        },
        {
          title: "برنامه‌ریزی تغییر",
          lessons: ["تعیین اهداف SMART", "طراحی نقشه راه", "مدیریت زمان"],
          duration: "۱ ساعت"
        },
        {
          title: "اجرا و تداوم",
          lessons: ["شروع تغییر", "مقابله با موانع", "حفظ انگیزه", "ارزیابی پیشرفت"],
          duration: "۱ ساعت"
        }
      ]
    },
    "boundless-taste": {
      title: "مزه بدون مرز",
      englishTitle: "Boundless Taste",
      description: "کشف طعم موفقیت و تجربه زندگی بدون محدودیت",
      instructor: "رضا رافعی",
      duration: "۲ ساعت",
      lessons: "۸ درس",
      students: "۳,۱۲۰",
      level: "مقدماتی",
      modules: [
        {
          title: "تغییر نگرش",
          lessons: ["شکستن محدودیت‌های ذهنی", "تفکر مثبت", "باور به توانایی‌ها"],
          duration: "۴۵ دقیقه"
        },
        {
          title: "عادات موثر",
          lessons: ["عادات صبحگاهی", "مدیریت انرژی", "یادگیری مداوم"],
          duration: "۴۵ دقیقه"
        },
        {
          title: "عمل و پیشرفت",
          lessons: ["اقدام فوری", "اندازه‌گیری نتایج"],
          duration: "۳۰ دقیقه"
        }
      ]
    }
  };

  const currentCourse = slug ? courses[slug as keyof typeof courses] : null;

  if (!currentCourse) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">دوره یافت نشد</h1>
            <Link to="/courses/free">
              <Button>بازگشت به دوره‌های رایگان</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              دوره رایگان
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {currentCourse.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              {currentCourse.englishTitle}
            </p>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {currentCourse.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Course Content */}
            <div className="lg:col-span-2">
              
              {/* Course Info */}
              <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <BookOpen className="w-5 h-5" />
                    اطلاعات دوره
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentCourse.duration}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">مدت زمان</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Play className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentCourse.lessons}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">تعداد درس</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentCourse.students}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">دانشجو</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentCourse.level}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">سطح</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Modules */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">سرفصل‌های دوره</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentCourse.modules.map((module, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {module.duration}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{lesson}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Start Course Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      شروع دوره
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      آماده یادگیری هستید؟
                    </p>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">قیمت:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">رایگان</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">دسترسی:</span>
                      <span className="font-medium text-gray-900 dark:text-white">نامحدود</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 text-base font-medium"
                  >
                    <Play className="w-4 h-4 ml-2" />
                    شروع یادگیری
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                    ۱۰۰٪ رایگان، نیازی به ثبت‌نام نیست
                  </p>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">مدرس دوره:</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">ر</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{currentCourse.instructor}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">کارآفرین و مربی کسب‌وکار</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FreeCourseStart;
