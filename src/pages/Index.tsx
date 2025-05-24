import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Award, BookOpen, Globe, Check, GraduationCap, BookOpenCheck } from "lucide-react";
import QuickAccess from "@/components/QuickAccess";
import DynamicQuote from "@/components/DynamicQuote";

const Index = () => {
  const { translations } = useLanguage();

  const featuredCourses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.intermediate,
      status: "active"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.beginner,
      status: "active"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      slug: "passive-income",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.beginner,
      status: "active"
    },
  ];
  
  const blogArticles = [
    {
      title: "چگونه کسب و کار اینترنتی خود را راه‌اندازی کنیم",
      description: "در این مقاله، ما به بررسی گام به گام مراحل راه‌اندازی یک کسب و کار آنلاین موفق می‌پردازیم.",
      icon: BookOpen,
      slug: "start-online-business"
    },
    {
      title: "ابزارهای هوش مصنوعی برای کارآفرینان",
      description: "معرفی بهترین ابزارهای هوش مصنوعی که به کارآفرینان کمک می‌کند تا کسب و کار خود را بهینه کنند.",
      icon: MessageCircle,
      slug: "ai-tools-for-entrepreneurs"
    },
    {
      title: "استراتژی های بازاریابی محتوا در سال ۲۰۲۵",
      description: "آشنایی با جدیدترین روندها و استراتژی‌های بازاریابی محتوا که در سال ۲۰۲۵ مؤثر خواهند بود.",
      icon: BookOpenCheck,
      slug: "content-marketing-2025"
    },
    {
      title: "چگونه به عنوان فریلنسر درآمد دلاری کسب کنیم",
      description: "راهنمای جامع برای فریلنسرها جهت ورود به بازارهای جهانی و کسب درآمد ارزی پایدار.",
      icon: Globe,
      slug: "freelancer-dollar-income"
    }
  ];

  return (
    <MainLayout>
      <div className="relative w-full overflow-hidden bg-white py-20 md:py-28">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse"></div>
          <div className="glow-circle glow-circle-2 animate-float-fast"></div>
          <div className="glow-circle glow-circle-3 animate-pulse animation-delay-1000"></div>
          <div className="glow-circle glow-circle-4 animate-float-slow animation-delay-2000"></div>
        </div>
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[20px] z-0"></div>
        
        <div className="container relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="space-y-6 max-w-3xl mx-auto">
              <DynamicQuote />
              
              <h1 className="font-bold tracking-tighter text-4xl md:text-5xl lg:text-6xl animate-slide-down text-balance">
                {translations.slogan}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground animate-slide-down animation-delay-200 max-w-2xl mx-auto">
                {translations.tagline}
              </p>
              <div className="animate-slide-down animation-delay-400">
                <Button asChild className="rounded-full bg-black hover:bg-black/90 text-white">
                  <Link to="/courses/boundless">
                    {translations.callToAction}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <style>
          {`
          @keyframes pulse {
            0%, 100% { 
              opacity: 0.4;
              transform: scale(1);
            }
            50% { 
              opacity: 0.8;
              transform: scale(1.15);
            }
          }
          
          @keyframes float-fast {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.5;
            }
            25% {
              transform: translateY(-30px) translateX(15px);
              opacity: 0.8;
            }
            50% {
              transform: translateY(-5px) translateX(30px);
              opacity: 0.6;
            }
            75% {
              transform: translateY(25px) translateX(15px);
              opacity: 0.8;
            }
          }
          
          @keyframes float-slow {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.4;
            }
            33% {
              transform: translateY(-15px) translateX(25px);
              opacity: 0.7;
            }
            66% {
              transform: translateY(20px) translateX(-10px);
              opacity: 0.5;
            }
          }
          
          .animate-pulse {
            animation: pulse 6s infinite ease-in-out;
          }
          
          .animate-float-fast {
            animation: float-fast 12s infinite ease-in-out;
          }
          
          .animate-float-slow {
            animation: float-slow 18s infinite ease-in-out;
          }
          
          .animation-delay-1000 {
            animation-delay: 1s;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .glow-circle {
            position: absolute;
            border-radius: 50%;
            filter: blur(30px);
          }
          
          .glow-circle-1 {
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(147,112,219,0.45) 0%, rgba(147,112,219,0) 70%);
            top: -150px;
            right: 10%;
          }
          
          .glow-circle-2 {
            width: 550px;
            height: 550px;
            background: radial-gradient(circle, rgba(65,105,225,0.4) 0%, rgba(65,105,225,0) 70%);
            bottom: -180px;
            left: 10%;
          }
          
          .glow-circle-3 {
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, rgba(123,104,238,0.4) 0%, rgba(123,104,238,0) 70%);
            top: 30%;
            left: 25%;
          }
          
          .glow-circle-4 {
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(72,209,204,0.35) 0%, rgba(72,209,204,0) 70%);
            top: 40%;
            right: 20%;
          }
          `}
        </style>
      </div>
      
      {/* Quick Access Section */}
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
                  <a href="https://ai.rafiei.co/" target="_blank" rel="noopener noreferrer">
                    {translations.aiAssistantAction}
                  </a>
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

      {/* Training Center */}
      <section className="py-16 bg-white">
        <div className="container">
          <SectionTitle
            title={translations.trainingCenter}
            subtitle={translations.trainingCenterDesc}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCourses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
                slug={course.slug}
                instructor={course.instructor}
                instructorLink={course.instructorLink}
                level={course.level}
                status={course.status as any}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-black hover:bg-black/90 text-white rounded-full"
            >
              <Link to="/courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Magazine Section */}
      <section className="py-16 bg-black/5">
        <div className="container">
          <SectionTitle
            title={translations.magazine}
            subtitle={translations.magazineDesc}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogArticles.map((article, index) => (
              <Card key={index} className="border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-black/10 flex items-center justify-center">
                      <article.icon size={20} className="text-black" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{article.description}</p>
                  <Link to={`/blog/${article.slug}`} className="text-sm font-medium text-black hover:underline flex items-center">
                    {translations.readMore}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 rtl:rotate-180">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="border-black text-black hover:bg-black/5 rounded-full"
            >
              <Link to="/blog">
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
