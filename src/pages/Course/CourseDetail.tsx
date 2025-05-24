
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, Play, Users, Clock, Award, Star } from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CourseDetail = () => {
  const { courseSlug } = useParams();
  const { translations, language } = useLanguage();
  const navigate = useNavigate();

  // Course data mapping
  const courseData = {
    "boundless": {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      instructor: language === "en" ? "Reza Rafiei" : "رضا رفیعی",
      level: translations.intermediate,
      duration: "8 weeks",
      students: "2,500+",
      rating: 4.9,
      price: "$299",
      originalPrice: "$499",
      outcomes: [
        language === "en" ? "Master the boundless mindset" : "تسلط بر ذهنیت بی‌کرانگی",
        language === "en" ? "Build multiple income streams" : "ایجاد جریان‌های درآمدی متعدد",
        language === "en" ? "Develop leadership skills" : "توسعه مهارت‌های رهبری",
        language === "en" ? "Create your success roadmap" : "ایجاد نقشه راه موفقیت"
      ]
    },
    "instagram": {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      instructor: language === "en" ? "Reza Rafiei" : "رضا رفیعی",
      level: translations.beginner,
      duration: "6 weeks",
      students: "1,800+",
      rating: 4.8,
      price: "$199",
      originalPrice: "$299",
      outcomes: [
        language === "en" ? "Create engaging content" : "ایجاد محتوای جذاب",
        language === "en" ? "Build a loyal following" : "ایجاد فالوورهای وفادار",
        language === "en" ? "Monetize your account" : "کسب درآمد از اکانت",
        language === "en" ? "Master Instagram algorithm" : "تسلط بر الگوریتم اینستاگرام"
      ]
    },
    "passive-income": {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      instructor: language === "en" ? "Reza Rafiei" : "رضا رفیعی",
      level: translations.beginner,
      duration: "4 weeks",
      students: "3,200+",
      rating: 4.7,
      price: "Free",
      originalPrice: "",
      outcomes: [
        language === "en" ? "Learn AI tools for content creation" : "یادگیری ابزارهای هوش مصنوعی",
        language === "en" ? "Set up automated systems" : "راه‌اندازی سیستم‌های خودکار",
        language === "en" ? "Create passive income streams" : "ایجاد جریان‌های درآمد غیرفعال",
        language === "en" ? "Scale your business" : "گسترش کسب‌وکار"
      ]
    },
    "boundless-taste": {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      instructor: language === "en" ? "Reza Rafiei" : "رضا رفیعی",
      level: translations.beginner,
      duration: "2 weeks",
      students: "5,000+",
      rating: 4.6,
      price: "Free",
      originalPrice: "",
      outcomes: [
        language === "en" ? "Introduction to boundless mindset" : "آشنایی با ذهنیت بی‌کرانگی",
        language === "en" ? "Basic success principles" : "اصول پایه موفقیت",
        language === "en" ? "Goal setting techniques" : "تکنیک‌های هدف‌گذاری",
        language === "en" ? "Initial mindset transformation" : "تحول اولیه ذهنیت"
      ]
    }
  };

  const course = courseData[courseSlug as keyof typeof courseData];

  useEffect(() => {
    if (!course) {
      navigate(language === "en" ? "/en/courses" : "/courses");
    }
  }, [course, navigate, language]);

  if (!course) {
    return null;
  }

  const handleEnrollClick = () => {
    const viewPath = course.isPaid 
      ? `/courses/${courseSlug}/paid-view`
      : `/courses/${courseSlug}/free-view`;
    navigate(viewPath);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white py-16">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-white/20 text-white border-white/30">
                  {course.isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  {course.title}
                </h1>
                <p className="text-xl mb-6 text-gray-200 leading-relaxed">
                  {course.description}
                </p>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{course.students} {language === "en" ? "students" : "دانشجو"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-3"
                    onClick={handleEnrollClick}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {course.isPaid ? translations.startCourse : translations.startFreeCourse}
                  </Button>
                  {course.originalPrice && (
                    <div className="text-right">
                      <div className="text-2xl font-bold">{course.price}</div>
                      <div className="text-sm line-through text-gray-400">{course.originalPrice}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl border-4 border-white/20 shadow-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 text-white/80" />
                    <p className="text-lg text-white/80">{translations.videoPlayerPlaceholder}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* What You'll Learn */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Award className="h-6 w-6 text-primary" />
                    {translations.whatYouWillLearn}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course Benefits */}
              <Card className="border-none shadow-lg">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">{translations.description}</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <p className="font-medium text-blue-900 mb-2">✓ {translations.whatYouWillLearn}:</p>
                      <p className="text-blue-800">{course.benefits}</p>
                    </div>
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="font-medium text-green-900 mb-2">→ {translations.courseObjectives}:</p>
                      <p className="text-green-800">{course.outcome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Instructor Card */}
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">{translations.instructor}</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {course.instructor.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{course.instructor}</p>
                      <p className="text-sm text-gray-600">{translations.instructorName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Info */}
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">{translations.courseIncludes}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Play className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">{course.duration} {translations.hoursOfVideo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{course.students} {language === "en" ? "enrolled" : "ثبت نام شده"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-purple-500" />
                      <span className="text-sm">{translations.certificateOfCompletion}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-orange-500" />
                      <span className="text-sm">{translations.fullLifetimeAccess}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-black to-gray-800 text-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">{translations.enrollNow}</h3>
                  {course.price !== "Free" && (
                    <div className="mb-4">
                      <div className="text-3xl font-bold">{course.price}</div>
                      {course.originalPrice && (
                        <div className="text-sm line-through text-gray-400">{course.originalPrice}</div>
                      )}
                    </div>
                  )}
                  <Button 
                    className="w-full bg-white text-black hover:bg-gray-100 text-lg py-3"
                    onClick={handleEnrollClick}
                  >
                    {course.isPaid ? translations.startCourse : translations.startFreeCourse}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseDetail;
