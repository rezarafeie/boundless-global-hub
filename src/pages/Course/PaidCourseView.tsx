
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle, Star, Users, Clock, Download } from "lucide-react";

interface PaidCourseViewProps {
  language?: "en" | "fa";
}

const PaidCourseView = ({ language: propLanguage }: PaidCourseViewProps) => {
  const { translations, setLanguage, language } = useLanguage();
  const { courseTitle } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage);
    }
  }, [propLanguage, setLanguage]);
  
  useEffect(() => {
    // Redirect to homepage if no course title is provided
    if (!courseTitle) {
      navigate(language === "en" ? "/en" : "/");
    }
  }, [courseTitle, navigate, language]);

  // Get course content based on courseTitle
  const getCourseContent = () => {
    switch(courseTitle) {
      case "boundless":
        return {
          title: "برنامه بدون مرز",
          description: "دوره جامع کسب‌وکار و کارآفرینی برای کسب درآمد ارزی",
          benefits: [
            "یادگیری کسب‌وکار آنلاین",
            "ایجاد منابع درآمد ارزی",
            "توسعه مهارت‌های کارآفرینی",
            "دسترسی به بازارهای جهانی"
          ],
          outcome: "راه‌اندازی کسب‌وکار مستقل و کسب درآمد ماهانه بالای ۱۰۰۰ دلار",
          modules: [
            "مقدمه و آشنایی با کسب‌وکار آنلاین",
            "شناسایی فرصت‌های کسب‌وکار",
            "ایجاد محصول دیجیتال",
            "بازاریابی و فروش آنلاین",
            "مدیریت مالی و سرمایه‌گذاری"
          ]
        };
      case "instagram":
        return {
          title: "اینستاگرام اسنشالز",
          description: "یادگیری حرفه‌ای بازاریابی و کسب درآمد در اینستاگرام",
          benefits: [
            "رشد ارگانیک فالوور",
            "تولید محتوای جذاب",
            "کسب درآمد از اینستاگرام",
            "استراتژی‌های بازاریابی"
          ],
          outcome: "تبدیل شدن به اینفلوئنسر و کسب درآمد از اینستاگرام",
          modules: [
            "تنظیمات اولیه و بهینه‌سازی پروفایل",
            "استراتژی تولید محتوا",
            "تکنیک‌های رشد فالوور",
            "روش‌های کسب درآمد",
            "تجزیه و تحلیل و بهینه‌سازی"
          ]
        };
      default:
        return {
          title: decodeURIComponent(courseTitle || ""),
          description: "دوره تخصصی آموزشی",
          benefits: ["یادگیری مهارت‌های حرفه‌ای"],
          outcome: "تسلط کامل بر موضوع",
          modules: ["ماژول آموزشی"]
        };
    }
  };

  const courseContent = getCourseContent();

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="max-w-6xl mx-auto">
          {/* Course Header */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-green-100 text-green-800">دسترسی فعال</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{courseContent.title}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{courseContent.description}</p>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-3">
              <Card className="border border-black/10 shadow-lg mb-6">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-black/5 to-black/10 rounded-t-lg flex items-center justify-center border-b border-black/10">
                    <div className="text-center">
                      <PlayCircle size={64} className="text-black/30 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">پخش ویدیو دوره</p>
                      <p className="text-sm text-gray-500">پلیر اختصاصی رفیعی</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-medium mb-4 text-lg">درباره این دوره</h3>
                    <p className="text-gray-600 mb-6">{courseContent.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3 text-green-800 flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-600" />
                            مزایای دوره
                          </h4>
                          <ul className="space-y-2">
                            {courseContent.benefits.map((benefit, index) => (
                              <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-600" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3 text-blue-800 flex items-center gap-2">
                            <Star size={18} className="text-blue-600" />
                            نتیجه نهایی
                          </h4>
                          <p className="text-sm text-blue-700">{courseContent.outcome}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Course Modules */}
              <Card className="border border-black/10 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4 text-lg">ماژول‌های دوره</h3>
                  <div className="space-y-3">
                    {courseContent.modules.map((module, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm font-medium">{module}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border border-black/10 shadow-lg mb-6">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4 text-lg">دسترسی‌های شما</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <PlayCircle size={16} className="text-green-600" />
                      <span>ویدیوهای کامل</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Download size={16} className="text-green-600" />
                      <span>منابع قابل دانلود</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Users size={16} className="text-green-600" />
                      <span>دسترسی به انجمن</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock size={16} className="text-green-600" />
                      <span>دسترسی مادام‌العمر</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-black/10 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4 text-lg">پیشرفت شما</h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>تکمیل شده</span>
                      <span>۰٪</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">برای شروع، اولین ویدیو را تماشا کنید</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaidCourseView;
