
import React from "react";
import { useParams, Navigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Award, TrendingUp, CheckCircle, Brain, Heart, DollarSign, Lightbulb, Target, BarChart3 } from "lucide-react";

const TestLanding = () => {
  const { slug } = useParams();

  // Test data configuration
  const tests = {
    personality: {
      title: "تست شخصیت کارآفرین",
      englishTitle: "Entrepreneur Personality Test",
      description: "شخصیت کارآفرینی خود را بشناسید و نقاط قوت و ضعف خود را کشف کنید",
      icon: <Target className="text-blue-500" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۲۵ سوال",
      participants: "۵,۲۳۰",
      features: [
        "تحلیل کامل شخصیت کارآفرینی",
        "شناسایی نقاط قوت و ضعف",
        "پیشنهادات بهبود عملکرد",
        "گزارش تفصیلی نتایج"
      ],
      color: "blue"
    },
    mbti: {
      title: "تست MBTI",
      englishTitle: "Myers-Briggs Type Indicator",
      description: "نوع شخصیت خود را بر اساس مدل معتبر MBTI کشف کنید",
      icon: <Brain className="text-purple-500" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۶۰ سوال",
      participants: "۸,۱۲۰",
      features: [
        "تعیین دقیق نوع شخصیت MBTI",
        "توضیح کامل ویژگی‌های شخصیتی",
        "پیشنهادات شغلی مناسب",
        "راهنمای بهبود روابط"
      ],
      color: "purple"
    },
    financial: {
      title: "تست هوش مالی",
      englishTitle: "Financial Intelligence Test",
      description: "سطح دانش و هوش مالی خود را ارزیابی کنید",
      icon: <DollarSign className="text-green-500" size={24} />,
      duration: "۱۲ دقیقه",
      questions: "۳۰ سوال",
      participants: "۳,۸۹۰",
      features: [
        "ارزیابی دانش مالی شخصی",
        "تحلیل نگرش مالی",
        "پیشنهادات بهبود وضعیت مالی",
        "راهنمای سرمایه‌گذاری"
      ],
      color: "green"
    },
    emotional: {
      title: "تست هوش هیجانی",
      englishTitle: "Emotional Intelligence Test",
      description: "سطح هوش هیجانی و توانایی مدیریت احساسات خود را بسنجید",
      icon: <Heart className="text-red-500" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۲۰ سوال",
      participants: "۶,۷۵۰",
      features: [
        "ارزیابی هوش هیجانی",
        "تحلیل مهارت‌های اجتماعی",
        "راهنمای بهبود روابط",
        "تکنیک‌های مدیریت استرس"
      ],
      color: "red"
    },
    future: {
      title: "تست آینده‌نگری",
      englishTitle: "Future Vision Test",
      description: "توانایی برنامه‌ریزی و چشم‌انداز آینده خود را ارزیابی کنید",
      icon: <Lightbulb className="text-yellow-500" size={24} />,
      duration: "۸ دقیقه",
      questions: "۱۵ سوال",
      participants: "۲,۱۴۰",
      features: [
        "ارزیابی توانایی برنامه‌ریزی",
        "تحلیل نگرش به آینده",
        "پیشنهادات توسعه مهارت",
        "راهنمای تعیین هدف"
      ],
      color: "yellow"
    },
    iq: {
      title: "تست IQ",
      englishTitle: "Intelligence Quotient Test",
      description: "ضریب هوشی خود را با تست استاندارد IQ اندازه‌گیری کنید",
      icon: <BarChart3 className="text-indigo-500" size={24} />,
      duration: "۲۰ دقیقه",
      questions: "۴۰ سوال",
      participants: "۹,۳۲۰",
      features: [
        "اندازه‌گیری دقیق ضریب هوشی",
        "تحلیل انواع هوش",
        "مقایسه با میانگین جامعه",
        "پیشنهادات تقویت ذهن"
      ],
      color: "indigo"
    },
    leadership: {
      title: "تست مهارت‌های رهبری",
      englishTitle: "Leadership Skills Test",
      description: "توانایی‌های رهبری و مدیریت خود را ارزیابی کنید",
      icon: <TrendingUp className="text-orange-500" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۳۵ سوال",
      participants: "۴,۶۸۰",
      features: [
        "ارزیابی مهارت‌های رهبری",
        "تحلیل سبک مدیریت",
        "پیشنهادات توسعه رهبری",
        "راهنمای تیم‌سازی"
      ],
      color: "orange"
    }
  };

  // Get current test or redirect if not found
  const currentTest = slug ? tests[slug as keyof typeof tests] : null;

  if (!currentTest) {
    return <Navigate to="/assessment" replace />;
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      green: "from-green-500 to-green-600",
      red: "from-red-500 to-red-600",
      yellow: "from-yellow-500 to-yellow-600",
      indigo: "from-indigo-500 to-indigo-600",
      orange: "from-orange-500 to-orange-600"
    };
    return colorMap[color as keyof typeof colorMap] || "from-blue-500 to-blue-600";
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container max-w-4xl mx-auto px-4 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                {currentTest.icon}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {currentTest.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              {currentTest.englishTitle}
            </p>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {currentTest.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Test Info */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    اطلاعات تست
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentTest.duration}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">مدت زمان</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentTest.questions}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">تعداد سوال</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Users className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentTest.participants}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">شرکت‌کننده</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      آنچه در این تست دریافت می‌کنید:
                    </h3>
                    <div className="space-y-3">
                      {currentTest.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Start Test Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      شروع تست
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      آماده دریافت نتایج دقیق هستید؟
                    </p>
                  </div>
                  
                  <Badge variant="outline" className="w-full justify-center py-2 mb-4 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                    رایگان
                  </Badge>
                  
                  <Button 
                    size="lg" 
                    className={`w-full bg-gradient-to-r ${getColorClasses(currentTest.color)} hover:opacity-90 text-white rounded-lg py-3 text-base font-medium`}
                  >
                    شروع تست
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                    نتایج فوری و رایگان
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TestLanding;
