
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface FreeCourseViewProps {
  language?: "en" | "fa";
}

const FreeCourseView = ({ language: propLanguage }: FreeCourseViewProps) => {
  const { translations, setLanguage, language } = useLanguage();
  const { slug } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage);
    }
  }, [propLanguage, setLanguage]);
  
  useEffect(() => {
    // Redirect to homepage if no course slug is provided
    if (!slug) {
      navigate(language === "en" ? "/en" : "/");
    }
  }, [slug, navigate, language]);

  // Get course content based on slug
  const getCourseContent = () => {
    switch(slug) {
      case "passive-income":
        return {
          title: "کسب درآمد غیرفعال با هوش مصنوعی",
          description: "یاد بگیرید چگونه با استفاده از ابزارهای هوش مصنوعی، منابع درآمد غیرفعال ایجاد کنید",
          benefits: [
            "آشنایی با ابزارهای هوش مصنوعی",
            "ایجاد محتوای خودکار",
            "راه‌اندازی کسب‌وکار آنلاین"
          ],
          outcome: "توانایی کسب درآمد ماهانه از طریق سیستم‌های خودکار"
        };
      case "taghyir":
        return {
          title: "پروژه تغییر",
          description: "دوره‌ای جامع برای تغییر زندگی و ایجاد عادت‌های مثبت",
          benefits: [
            "شناخت الگوهای رفتاری",
            "ایجاد عادت‌های مثبت",
            "حذف عادت‌های منفی"
          ],
          outcome: "کنترل کامل بر زندگی و ایجاد تغییرات پایدار"
        };
      case "mazeh-metaverse":
        return {
          title: "مذه متاورس",
          description: "آشنایی عمیق با دنیای متاورس و فرصت‌های آن",
          benefits: [
            "درک مفهوم متاورس",
            "آشنایی با ارزهای دیجیتال",
            "فرصت‌های کسب درآمد"
          ],
          outcome: "توانایی کسب درآمد از متاورس و ارزهای دیجیتال"
        };
      default:
        return {
          title: decodeURIComponent(slug || ""),
          description: "دوره رایگان آموزشی",
          benefits: ["یادگیری مهارت‌های جدید"],
          outcome: "پیشرفت در مسیر شغلی"
        };
    }
  };

  const courseContent = getCourseContent();

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          {/* Course Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{courseContent.title}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{courseContent.description}</p>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <Card className="border border-black/10 shadow-lg">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-black/5 to-black/10 rounded-t-lg flex items-center justify-center border-b border-black/10">
                    <div className="text-center">
                      <PlayCircle size={64} className="text-black/30 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">پخش ویدیو</p>
                      <p className="text-sm text-gray-500">محتوای ویدیویی دوره</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-medium mb-4 text-lg">درباره این دوره</h3>
                    <p className="text-gray-600 mb-6">{courseContent.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2 text-green-800">مزایای دوره</h4>
                          <ul className="space-y-1">
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
                          <h4 className="font-medium mb-2 text-blue-800">نتیجه نهایی</h4>
                          <div className="flex items-center gap-2">
                            <Star size={14} className="text-blue-600" />
                            <p className="text-sm text-blue-700">{courseContent.outcome}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border border-black/10 shadow-lg mb-6">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4 text-lg">ارتقا به دوره پولی</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    برای دسترسی به محتوای کامل و پشتیبانی، دوره‌های پولی را بررسی کنید
                  </p>
                  <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                    <Link to="/courses">
                      مشاهده دوره‌های پولی
                      <ArrowRight size={16} className="mr-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border border-black/10 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4 text-lg">دسترسی سریع</h3>
                  <div className="space-y-3">
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link to="/assessment-center">
                        مرکز ارزیابی
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link to="/support">
                        پشتیبانی
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link to="/blog">
                        مجله
                      </Link>
                    </Button>
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

export default FreeCourseView;
