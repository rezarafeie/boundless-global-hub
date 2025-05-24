
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, Play, Star, Users, Download, MessageCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaidCourseViewProps {
  language?: "en" | "fa";
}

const PaidCourseView = ({ language: propLanguage }: PaidCourseViewProps) => {
  const { translations, setLanguage, language } = useLanguage();
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage);
    }
  }, [propLanguage, setLanguage]);
  
  useEffect(() => {
    // Redirect to homepage if no course title is provided
    if (!courseSlug) {
      navigate(language === "en" ? "/en" : "/");
    }
  }, [courseSlug, navigate, language]);

  const courseTitle = courseSlug ? decodeURIComponent(courseSlug) : "";

  const handleStartCourse = () => {
    navigate(`/courses/${courseSlug}/paid-start`);
  };

  return (
    <MainLayout>
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-purple-100 text-purple-800 border-purple-200">
              {translations.paidCoursesTitle}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {courseTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {translations.paidCourseAccessInstructions}
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <Card className="mb-12 border-none shadow-2xl bg-gradient-to-r from-purple-500 to-blue-600 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center">
                <Award className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">{translations.courseAccessGranted}</h2>
                <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
                  {language === "en" ? "Welcome to your premium learning experience! You now have full access to all course materials." : "به تجربه یادگیری ممتاز خوش آمدید! اکنون به تمام مطالب دوره دسترسی کامل دارید."}
                </p>
                <Button 
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-3"
                  onClick={handleStartCourse}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {translations.startCourse}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Video Player Section */}
          <Card className="mb-12 border-none shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                  <Play className="h-8 w-8 text-purple-500" />
                  {language === "en" ? "Premium Course Content" : "محتوای دوره حرفه‌ای"}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-6"></div>
              </div>
              
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 max-w-5xl mx-auto rounded-2xl flex items-center justify-center border-2 border-gray-200 shadow-inner">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-xl font-medium mb-2 text-gray-700">{translations.videoPlayerPlaceholder}</p>
                  <p className="text-sm text-gray-500">{translations.rafeiPlayer}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Course Materials */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Download className="h-8 w-8 text-blue-500" />
                  <h3 className="text-xl font-bold text-blue-800">{translations.courseMaterials}</h3>
                </div>
                <p className="text-gray-700 mb-6">{translations.courseMaterialsDescription}</p>
                <div className="space-y-3">
                  {[
                    language === "en" ? "HD Video Lectures" : "ویدیوهای آموزشی HD",
                    language === "en" ? "Downloadable Resources" : "منابع قابل دانلود",
                    language === "en" ? "Course Workbooks" : "کتاب‌های کار دوره",
                    language === "en" ? "Assignment Templates" : "قالب‌های تکالیف"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Access */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle className="h-8 w-8 text-green-500" />
                  <h3 className="text-xl font-bold text-green-800">{translations.communityAccess}</h3>
                </div>
                <p className="text-gray-700 mb-6">{translations.communityAccessDescription}</p>
                <div className="space-y-3">
                  {[
                    language === "en" ? "Private Discord Server" : "سرور خصوصی دیسکورد",
                    language === "en" ? "Weekly Q&A Sessions" : "جلسات پرسش و پاسخ هفتگی",
                    language === "en" ? "Peer Networking" : "شبکه‌سازی با همتایان",
                    language === "en" ? "Instructor Support" : "پشتیبانی مدرس"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certification */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="h-8 w-8 text-purple-500" />
                  <h3 className="text-xl font-bold text-purple-800">{translations.certificateOfCompletion}</h3>
                </div>
                <p className="text-gray-700 mb-6">
                  {language === "en" ? "Earn a verified certificate upon successful completion" : "با تکمیل موفق دوره، گواهی معتبر دریافت کنید"}
                </p>
                <div className="space-y-3">
                  {[
                    language === "en" ? "Verified Certificate" : "گواهی معتبر",
                    language === "en" ? "LinkedIn Integration" : "ادغام با لینکدین",
                    language === "en" ? "Digital Badge" : "نشان دیجیتال",
                    language === "en" ? "Portfolio Addition" : "افزودن به نمونه کار"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <Card className="mb-12 border-none shadow-lg bg-gradient-to-r from-gray-50 to-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">{language === "en" ? "Your Learning Journey" : "سفر یادگیری شما"}</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {language === "en" ? "Track your progress and celebrate your achievements as you advance through the course" : "پیشرفت خود را پیگیری کنید و دستاوردهایتان را در طول پیشروی در دوره جشن بگیرید"}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold mb-2">{language === "en" ? "0% Complete" : "۰٪ تکمیل شده"}</h4>
                  <p className="text-sm text-gray-600">{language === "en" ? "Let's get started!" : "بیایید شروع کنیم!"}</p>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold mb-2">{language === "en" ? "Join Community" : "عضویت در انجمن"}</h4>
                  <p className="text-sm text-gray-600">{language === "en" ? "Connect with peers" : "با همتایان ارتباط برقرار کنید"}</p>
                </div>

                <div className="text-center p-6 bg-purple-50 rounded-xl">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold mb-2">{language === "en" ? "Earn Certificate" : "کسب گواهی"}</h4>
                  <p className="text-sm text-gray-600">{language === "en" ? "Complete to get certified" : "برای دریافت گواهی تکمیل کنید"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="border-none shadow-2xl bg-gradient-to-r from-black to-gray-800 text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-4">{language === "en" ? "Ready to Begin?" : "آماده شروع هستید؟"}</h3>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  {language === "en" ? "Your premium learning experience awaits. Start your first lesson now!" : "تجربه یادگیری ممتاز شما در انتظار است. اولین درس خود را همین حالا شروع کنید!"}
                </p>
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-xl px-12 py-4"
                  onClick={handleStartCourse}
                >
                  <Play className="h-6 w-6 mr-3" />
                  {translations.startCourse}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaidCourseView;
