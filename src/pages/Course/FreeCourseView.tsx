
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, Play, Star, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FreeCourseViewProps {
  language?: "en" | "fa";
}

const FreeCourseView = ({ language: propLanguage }: FreeCourseViewProps) => {
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
    navigate(`/courses/${courseSlug}/free-start`);
  };

  const handleViewPaidCourses = () => {
    navigate(language === "en" ? "/en/paid-courses" : "/paid-courses");
  };

  return (
    <MainLayout>
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
              {translations.freeCoursesTitle}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {courseTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {translations.freeCourseAccessInstructions}
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="max-w-5xl mx-auto">
          {/* Main Video Section */}
          <Card className="mb-12 border-none shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                  <Play className="h-8 w-8 text-blue-500" />
                  {translations.freeCourseAccess}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
              </div>
              
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 max-w-4xl mx-auto rounded-2xl flex items-center justify-center border-2 border-gray-200 shadow-inner">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-xl font-medium mb-2 text-gray-700">{translations.videoPlayerPlaceholder}</p>
                  <p className="text-sm text-gray-500">{translations.youtubeEmbed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Benefits Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <h3 className="text-2xl font-bold text-green-800">{translations.whatYouWillLearn}</h3>
                </div>
                <div className="space-y-3">
                  {[
                    language === "en" ? "Access to course introduction" : "دسترسی به معرفی دوره",
                    language === "en" ? "Sample video content" : "نمونه محتوای ویدیویی", 
                    language === "en" ? "Basic course materials" : "مطالب پایه دوره",
                    language === "en" ? "Community access" : "دسترسی به انجمن"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="h-8 w-8 text-blue-500" />
                  <h3 className="text-2xl font-bold text-blue-800">{translations.courseObjectives}</h3>
                </div>
                <div className="space-y-3">
                  {[
                    language === "en" ? "Get familiar with course structure" : "آشنایی با ساختار دوره",
                    language === "en" ? "Experience teaching methodology" : "تجربه روش تدریس",
                    language === "en" ? "Connect with other learners" : "ارتباط با سایر یادگیرندگان",
                    language === "en" ? "Evaluate course quality" : "ارزیابی کیفیت دوره"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Course Card */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-black to-gray-800 text-white overflow-hidden relative">
              <CardContent className="p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
                <div className="relative">
                  <h3 className="text-2xl font-bold mb-4">{translations.startFreeCourse}</h3>
                  <p className="text-gray-300 mb-6">
                    {language === "en" ? "Begin your learning journey with this free course" : "سفر یادگیری خود را با این دوره رایگان آغاز کنید"}
                  </p>
                  <Button 
                    className="w-full bg-white text-black hover:bg-gray-100 text-lg py-3"
                    onClick={handleStartCourse}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {translations.startFreeCourse}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Premium Upgrade Card */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white overflow-hidden relative">
              <CardContent className="p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
                <div className="relative">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Star className="h-6 w-6" />
                    {translations.upgradeToPremium}
                  </h3>
                  <p className="text-purple-100 mb-6">
                    {translations.upgradeToPremiumDescription}
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full border-white text-white hover:bg-white hover:text-purple-600 text-lg py-3"
                    onClick={handleViewPaidCourses}
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    {translations.viewPaidCourses}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info Section */}
          <Card className="mt-12 border-none shadow-lg bg-gradient-to-r from-gray-50 to-white">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">{language === "en" ? "Why Choose Our Free Courses?" : "چرا دوره‌های رایگان ما را انتخاب کنید؟"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h4 className="font-bold mb-2">{language === "en" ? "Expert Instructors" : "مدرسان متخصص"}</h4>
                    <p className="text-sm text-gray-600">{language === "en" ? "Learn from industry professionals" : "از متخصصان صنعت بیاموزید"}</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h4 className="font-bold mb-2">{language === "en" ? "High Quality Content" : "محتوای با کیفیت"}</h4>
                    <p className="text-sm text-gray-600">{language === "en" ? "Premium quality educational materials" : "مطالب آموزشی با کیفیت ممتاز"}</p>
                  </div>
                  <div className="text-center">
                    <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h4 className="font-bold mb-2">{language === "en" ? "Lifetime Access" : "دسترسی مادام‌العمر"}</h4>
                    <p className="text-sm text-gray-600">{language === "en" ? "Access your courses anytime, anywhere" : "در هر زمان و مکان به دوره‌هایتان دسترسی داشته باشید"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default FreeCourseView;
