
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import QuickAccess from "@/components/QuickAccess";
import SectionTitle from "@/components/SectionTitle";
import CourseCard from "@/components/CourseCard";
import TestCard from "@/components/TestCard";
import EducationCard from "@/components/EducationCard";
import FloatingNotification from "@/components/FloatingNotification";
import HubCTABanner from "@/components/HubCTABanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Users } from "lucide-react";

const Index = () => {
  const { translations, language } = useLanguage();

  const courses = [
    {
      id: 1,
      title: language === "en" ? "American Business" : "کسب و کار آمریکایی",
      description: language === "en" ? "Learn American business strategies and mindset" : "استراتژی‌های کسب و کار آمریکایی را بیاموزید",
      benefits: language === "en" ? "Business mindset • Strategic thinking • Leadership" : "تفکر کسب و کار • تفکر استراتژیک • رهبری",
      outcome: language === "en" ? "Master American business practices" : "تسلط بر شیوه‌های کسب و کار آمریکایی",
      instructor: language === "en" ? "Ramin Rafiei" : "رامین رفیعی",
      duration: language === "en" ? "8 weeks" : "۸ هفته",
      level: language === "en" ? "Intermediate" : "متوسط",
      image: "/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png",
      link: "/course/american-business",
      isPaid: true,
      price: language === "en" ? "$299" : "۲۹۹ دلار"
    },
    {
      id: 2,
      title: language === "en" ? "Passive Income Strategies" : "درآمد غیرفعال",
      description: language === "en" ? "Build multiple streams of passive income" : "جریان‌های متعدد درآمد غیرفعال بسازید",
      benefits: language === "en" ? "Investment strategies • Online income • Automation" : "استراتژی‌های سرمایه‌گذاری • درآمد آنلاین • اتوماسیون",
      outcome: language === "en" ? "Create sustainable passive income" : "درآمد غیرفعال پایدار بسازید",
      instructor: language === "en" ? "Ramin Rafiei" : "رامین رفیعی",
      duration: language === "en" ? "6 weeks" : "۶ هفته",
      level: language === "en" ? "Beginner" : "مبتدی",
      image: "/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png",
      link: "/course/passive-income",
      isPaid: true,
      price: language === "en" ? "$199" : "۱۹۹ دلار"
    }
  ];

  const tests = [
    {
      id: 1,
      title: language === "en" ? "Business Knowledge Assessment" : "آزمون دانش کسب و کار",
      description: language === "en" ? "Test your business knowledge" : "دانش کسب و کار خود را بسنجید",
      duration: language === "en" ? "30 minutes" : "۳۰ دقیقه",
      questions: language === "en" ? "25 questions" : "۲۵ سوال",
      category: language === "en" ? "Business" : "کسب و کار",
      link: "/assessment-center"
    }
  ];

  const educationCards = [
    {
      title: language === "en" ? "Free Business Course" : "دوره رایگان کسب و کار",
      description: language === "en" ? "Start your business journey" : "سفر کسب و کار خود را آغاز کنید",
      icon: BookOpen,
      link: "/courses/free",
      gradient: "from-blue-500 to-purple-600",
      iconColor: "bg-blue-500"
    },
    {
      title: language === "en" ? "1-on-1 Consultation" : "مشاوره تک به تک",
      description: language === "en" ? "Personal business guidance" : "راهنمایی شخصی کسب و کار",
      icon: Users,
      link: "/contact",
      gradient: "from-green-500 to-teal-600",
      iconColor: "bg-green-500"
    }
  ];

  return (
    <MainLayout>
      <Hero
        title={translations.slogan || "تبدیل زندگی با هوش مصنوعی"}
        subtitle={translations.tagline || "آموزش جامع و ابزارهای لازم برای زندگی بهتر با هوش مصنوعی"}
        ctaText={translations.callToAction || "شروع کنید"}
        ctaLink="/courses"
        backgroundType="glow"
        glowTheme="home"
      />

      <FloatingNotification />

      <HubCTABanner />

      <QuickAccess />

      <div className="container mx-auto px-4 py-16">
        <SectionTitle 
          title={translations.coursesTitle || "دوره‌ها"}
          subtitle={language === "en" ? "Discover our most popular courses" : "محبوب‌ترین دوره‌های ما را کشف کنید"}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>

        <SectionTitle 
          title={translations.assessmentCenter}
          subtitle={language === "en" ? "Test your knowledge and skills" : "دانش و مهارت‌های خود را بسنجید"}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {tests.map((test) => (
            <TestCard key={test.id} {...test} />
          ))}
        </div>

        <SectionTitle 
          title={language === "en" ? "Learning Resources" : "منابع یادگیری"}
          subtitle={language === "en" ? "Additional resources to support your learning journey" : "منابع اضافی برای حمایت از سفر یادگیری شما"}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {educationCards.map((card, index) => (
            <EducationCard key={index} {...card} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
