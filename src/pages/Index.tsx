import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Award, BookOpen, Globe, Check, GraduationCap, BookOpenCheck, AlertTriangle } from "lucide-react";
import QuickAccess from "@/components/QuickAccess";

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
      <Hero 
        title={translations.slogan}
        subtitle={translations.tagline}
        ctaText={translations.callToAction}
        ctaLink="/courses"
      />
      
      {/* Live War Mode Block */}
      <section className="py-8 bg-background">
        <div className="container">
          <Link to="/solidarity" className="block">
            <div className="bg-black/90 backdrop-blur-sm border border-red-800/50 rounded-2xl p-6 shadow-2xl hover:shadow-red-500/25 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-center gap-4" dir="rtl">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <AlertTriangle className="w-6 h-6 text-red-400 group-hover:animate-pulse" />
                <span className="text-red-200 font-bold text-lg group-hover:text-white transition-colors">
                  حالت اضطراری جنگ فعال شده | مشاهده
                </span>
                <AlertTriangle className="w-6 h-6 text-red-400 group-hover:animate-pulse" />
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </Link>
        </div>
      </section>
      
      {/* Quick Access Section */}
      <QuickAccess />
      
      {/* AI Assistant CTA */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">{translations.aiAssistantTitle}</h2>
              <p className="text-lg text-muted-foreground mb-8">{translations.aiAssistantDescription}</p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1 text-foreground">{translations.aiAssistantFeature1Title}</h3>
                    <p className="text-sm text-muted-foreground">{translations.aiFeature1Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Award size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1 text-foreground">{translations.aiAssistantFeature2Title}</h3>
                    <p className="text-sm text-muted-foreground">{translations.aiFeature2Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1 text-foreground">{translations.aiAssistantFeature3Title}</h3>
                    <p className="text-sm text-muted-foreground">{translations.aiFeature3Desc}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  asChild 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  size="lg"
                >
                  <a href="https://ai.rafiei.co/" target="_blank" rel="noopener noreferrer">
                    {translations.aiAssistantAction}
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -z-10 top-1/3 right-1/3 w-64 h-64 rounded-full bg-primary/5 dark:bg-primary/10"></div>
              <div className="relative z-10 rounded-2xl overflow-hidden border border-border shadow-lg flex items-center justify-center aspect-video bg-muted/50">
                <MessageCircle size={64} className="text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Course - Boundless */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-sm bg-primary-foreground/20 px-3 py-1 rounded-full mb-4">
                {translations.paidCoursesTitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{translations.boundlessProgram}</h2>
              <p className="text-lg mb-6 text-primary-foreground/90">{translations.boundlessProgramDesc}</p>
              
              <div className="mb-8 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-primary-foreground" />
                  </div>
                  <p className="text-primary-foreground/80">{translations.boundlessBenefits}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe size={14} className="text-primary-foreground" />
                  </div>
                  <p className="text-primary-foreground/80">{translations.boundlessOutcome}</p>
                </div>
              </div>
              
              <Button 
                asChild 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full"
                size="lg"
              >
                <Link to="/courses/boundless">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="rounded-2xl overflow-hidden shadow-xl flex items-center justify-center aspect-video bg-primary-foreground/10">
              <GraduationCap size={64} className="text-primary-foreground/70" />
            </div>
          </div>
        </div>
      </section>

      {/* Training Center */}
      <section className="py-16 bg-background">
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            >
              <Link to="/courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Magazine Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <SectionTitle
            title={translations.magazine}
            subtitle={translations.magazineDesc}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogArticles.map((article, index) => (
              <Card key={index} className="border-border hover:border-primary/20 transition-all shadow-sm hover:shadow-md h-full bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <article.icon size={20} className="text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 text-foreground">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.description}</p>
                  <Link to={`/blog/${article.slug}`} className="text-sm font-medium text-primary hover:underline flex items-center">
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
              className="border-border text-foreground hover:bg-accent rounded-full"
            >
              <Link to="/blog">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {translations.assessmentCenterDesc}
              </p>
              <Button 
                asChild 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              >
                <Link to="/assessment-center">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] bg-card">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2 text-foreground">
                      {translations.personalityTests}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      کشف کنید چه شخصیتی دارید و چگونه با دنیای اطراف خود تعامل می‌کنید.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-border shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] bg-card">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2 text-foreground">
                      {translations.intelligenceTests}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      توانایی‌های شناختی خود را بسنجید و نقاط قوت هوشی خود را کشف کنید.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-border shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] bg-card">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2 text-foreground">
                      {translations.careerTests}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      مسیر شغلی مناسب خود را بر اساس مهارت‌ها، علایق و شخصیت خود پیدا کنید.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-border shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] bg-card">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-lg mb-2 text-foreground">
                      {translations.emotionTests}
                    </h3>
                    <p className="text-sm text-muted-foreground">
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
