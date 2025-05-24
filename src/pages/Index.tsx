
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { GraduationCap, Brain, TrendingUp, Globe, Bot, Target, Star, Award } from "lucide-react";

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
    <MainLayout>
      <Hero
        title={translations.slogan}
        subtitle={translations.tagline}
        ctaText={translations.callToAction}
        ctaLink="/paid-courses"
      />

      {/* Unified Courses Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{translations.coursesTitle}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {translations.coursesSubtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allCourses.map((course, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
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
                  
                  <Button asChild className="w-full rounded-full" variant={course.isPaid ? "default" : "outline"}>
                    <Link to={`/course/${course.slug}`}>
                      {course.isPaid ? "مشاهده دوره" : "شروع رایگان"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/paid-courses">
                مشاهده همه دوره‌ها
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-20 bg-black text-white">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2">
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {translations.assessmentCenterDesc}
              </p>
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/assessment-center">
                  شروع ارزیابی
                </Link>
              </Button>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-colors">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain size={24} className="text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {translations.personalityTests}
                  </h3>
                  <p className="text-sm text-gray-300">
                    شناخت شخصیت و استعدادها
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-colors">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap size={24} className="text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {translations.intelligenceTests}
                  </h3>
                  <p className="text-sm text-gray-300">
                    سنجش هوش و توانایی‌ها
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-colors">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target size={24} className="text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">
                    {translations.careerTests}
                  </h3>
                  <p className="text-sm text-gray-300">
                    مشاوره مسیر شغلی
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/15 transition-colors">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
    </MainLayout>
  );
};

export default Index;
