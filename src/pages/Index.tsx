
import React from "react";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { GraduationCap, Brain, TrendingUp, Globe, Bot, Target, Star, Award } from "lucide-react";
import QuickAccessRestored from "@/components/QuickAccessRestored";
import PaymentButton from "@/components/PaymentButton";
import DebugCard from "@/components/DebugCard";

const Index = () => {
  const { translations } = useLanguage();

  const allCourses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      icon: <Globe size={32} className="text-emerald-600" />,
      isPaid: true,
      slug: "boundless",
      category: "کسب‌وکار",
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      icon: <TrendingUp size={32} className="text-pink-600" />,
      isPaid: true,
      slug: "instagram",
      category: "بازاریابی",
    },
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      icon: <Award size={32} className="text-yellow-600" />,
      isPaid: true,
      slug: "wealth",
      category: "مالی",
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      icon: <Star size={32} className="text-purple-600" />,
      isPaid: true,
      slug: "metaverse",
      category: "تکنولوژی",
    },
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      icon: <Globe size={32} className="text-blue-600" />,
      isPaid: false,
      slug: "boundless-taste",
      category: "معرفی",
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      icon: <Bot size={32} className="text-indigo-600" />,
      isPaid: false,
      slug: "passive-income-ai",
      category: "هوش مصنوعی",
    },
  ];

  return (
    <>
      <Hero
        title={translations.slogan}
        subtitle={translations.tagline}
        ctaText={translations.callToAction}
        ctaLink="/courses/paid"
      />

      {/* Quick Access Section */}
      <QuickAccessRestored />

      {/* Unified Courses Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {translations.coursesTitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {translations.coursesSubtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allCourses.map((course, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl group-hover:from-white group-hover:to-gray-50 transition-all duration-300 shadow-sm">
                      {course.icon}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={course.isPaid ? "default" : "secondary"} className="text-xs">
                        {course.isPaid ? "ویژه" : "رایگان"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-emerald-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                  
                  <Button asChild className="w-full rounded-full" variant="outline">
                    <Link to={`/course/${course.slug}`}>
                      مشاهده جزئیات
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <Link to="/courses">
                مشاهده همه دوره‌ها
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2">
              <h2 className="text-4xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {translations.assessmentCenterDesc}
              </p>
              <Button asChild size="lg" variant="secondary" className="rounded-full bg-white text-black hover:bg-gray-100">
                <Link to="/assessment">
                  شروع ارزیابی
                </Link>
              </Button>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Brain size={24} className="text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {translations.personalityTests}
                  </h3>
                  <p className="text-sm text-gray-300">
                    شناخت شخصیت و استعدادها
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <GraduationCap size={24} className="text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {translations.intelligenceTests}
                  </h3>
                  <p className="text-sm text-gray-300">
                    سنجش هوش و توانایی‌ها
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Target size={24} className="text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {translations.careerTests}
                  </h3>
                  <p className="text-sm text-gray-300">
                    مشاوره مسیر شغلی
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Award size={24} className="text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {translations.emotionTests}
                  </h3>
                  <p className="text-sm text-gray-300">
                    ارزیابی هوش هیجانی
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Debug Card */}
      <DebugCard />
    </>
  );
};

export default Index;
