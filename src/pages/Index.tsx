
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Award, BookOpen, Globe, Check, GraduationCap } from "lucide-react";
import QuickAccess from "@/components/QuickAccess";

const Index = () => {
  const { translations } = useLanguage();

  const paidCourses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram"
    },
  ];

  const freeCourses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      slug: "boundless-taste"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      slug: "passive-income"
    },
  ];

  return (
    <MainLayout>
      <Hero
        title={translations.slogan}
        subtitle={translations.tagline}
        ctaText={translations.callToAction}
        ctaLink="/courses/boundless"
        backgroundType="glow"
      />
      
      {/* Quick Access Section - NEW */}
      <QuickAccess />
      
      {/* AI Assistant CTA */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">{translations.aiAssistantTitle}</h2>
              <p className="text-lg text-gray-600 mb-8">{translations.aiAssistantDescription}</p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{translations.aiAssistantFeature1Title}</h3>
                    <p className="text-sm text-gray-600">{translations.aiFeature1Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Award size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{translations.aiAssistantFeature2Title}</h3>
                    <p className="text-sm text-gray-600">{translations.aiFeature2Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{translations.aiAssistantFeature3Title}</h3>
                    <p className="text-sm text-gray-600">{translations.aiFeature3Desc}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  asChild 
                  className="bg-black hover:bg-black/90 text-white rounded-full"
                  size="lg"
                >
                  <Link to="/ai-assistant">
                    {translations.aiAssistantAction}
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -z-10 top-1/3 right-1/3 w-64 h-64 rounded-full bg-black/5"></div>
              <div className="relative z-10 rounded-2xl overflow-hidden border border-black/10 shadow-lg flex items-center justify-center aspect-video bg-black/5">
                <MessageCircle size={64} className="text-black/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Course - Boundless */}
      <section className="py-16 bg-black text-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-sm bg-white/20 px-3 py-1 rounded-full mb-4">
                {translations.paidCoursesTitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{translations.boundlessProgram}</h2>
              <p className="text-lg mb-6 text-white/90">{translations.boundlessProgramDesc}</p>
              
              <div className="mb-8 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <p className="text-white/80">{translations.boundlessBenefits}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe size={14} className="text-white" />
                  </div>
                  <p className="text-white/80">{translations.boundlessOutcome}</p>
                </div>
              </div>
              
              <Button 
                asChild 
                className="bg-white text-black hover:bg-white/90 rounded-full"
                size="lg"
              >
                <Link to="/courses/boundless">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="rounded-2xl overflow-hidden shadow-xl flex items-center justify-center aspect-video bg-black/40">
              <GraduationCap size={64} className="text-white/70" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Paid Courses */}
      <section className="py-16 bg-white">
        <div className="container">
          <SectionTitle
            title={translations.paidCoursesTitle}
            subtitle={translations.paidCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {paidCourses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
                slug={course.slug}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-black hover:bg-black/90 text-white rounded-full"
            >
              <Link to="/paid-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Free Courses */}
      <section className="py-16 bg-black/5">
        <div className="container">
          <SectionTitle
            title={translations.freeCoursesTitle}
            subtitle={translations.freeCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {freeCourses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
                slug={course.slug}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="border-black text-black hover:bg-black/5 rounded-full"
            >
              <Link to="/free-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {translations.assessmentCenterDesc}
              </p>
              <Button 
                asChild 
                size="lg"
                className="bg-black hover:bg-black/90 text-white rounded-full"
              >
                <Link to="/assessment-center">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-black/5 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px]">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2">
                      {translations.personalityTests}
                    </h3>
                    <p className="text-sm text-gray-600">
                      کشف کنید چه شخصیتی دارید و چگونه با دنیای اطراف خود تعامل می‌کنید.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-black/5 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px]">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2">
                      {translations.intelligenceTests}
                    </h3>
                    <p className="text-sm text-gray-600">
                      توانایی‌های شناختی خود را بسنجید و نقاط قوت هوشی خود را کشف کنید.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-black/5 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px]">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2">
                      {translations.careerTests}
                    </h3>
                    <p className="text-sm text-gray-600">
                      مسیر شغلی مناسب خود را بر اساس مهارت‌ها، علایق و شخصیت خود پیدا کنید.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-black/5 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px]">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2">
                      {translations.emotionTests}
                    </h3>
                    <p className="text-sm text-gray-600">
                      هوش هیجانی خود را ارزیابی کنید و یاد بگیرید چگونه احساسات خود و دیگران را بهتر درک کنید.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
