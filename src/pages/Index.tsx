
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Hero from '@/components/Hero';
import CourseCard from '@/components/CourseCard';
import TestCard from '@/components/TestCard';
import EducationCard from '@/components/EducationCard';
import SectionTitle from '@/components/SectionTitle';
import FloatingNotification from '@/components/FloatingNotification';
import HubCTABanner from '@/components/HubCTABanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, MessageCircle } from 'lucide-react';

const Index = () => {
  const { translations } = useLanguage();
  const [showWarNotification, setShowWarNotification] = useState(true);

  // Auto-hide war notification after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarNotification(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const featuredCourses = [
    {
      id: 1,
      title: "دوره جامع اینستاگرام",
      description: "آموزش کامل بازاریابی در اینستاگرام",
      instructor: "استاد رفیعی",
      duration: "8 ساعت",
      level: "مقدماتی تا پیشرفته",
      image: "/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png",
      link: "/courses/instagram",
      isPaid: true,
      price: "۲۹۹,۰۰۰ تومان",
      benefits: "آموزش تولید محتوا، استراتژی‌های رشد، تبلیغات هدفمند",
      outcome: "تسلط کامل بر بازاریابی اینستاگرام"
    },
    {
      id: 2,
      title: "متاورس و فرصت‌های درآمدزایی",
      description: "کشف دنیای جدید درآمد در متاورس",
      instructor: "استاد رفیعی",
      duration: "رایگان",
      level: "مقدماتی",
      image: "/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png",
      link: "/courses/metaverse",
      isPaid: false,
      price: "رایگان",
      benefits: "درک مفهوم متاورس، شناسایی فرصت‌ها، راه‌های کسب درآمد",
      outcome: "آمادگی برای ورود به دنیای متاورس"
    }
  ];

  const featuredTests = [
    {
      id: 1,
      title: "تست شخصیت‌شناسی کاریری",
      description: "کشف شغل ایده‌آل خود بر اساس شخصیت",
      category: "شخصیت‌شناسی",
      duration: "۱۵ دقیقه",
      questions: 50,
      link: "/assessment"
    },
    {
      id: 2,
      title: "آزمون هوش مالی",
      description: "سنجش میزان دانش مالی و سرمایه‌گذاری شما",
      category: "هوش مالی",
      duration: "۱۰ دقیقه", 
      questions: 30,
      link: "/assessment"
    }
  ];

  const educationOptions = [
    {
      title: "دوره‌های آموزشی",
      description: "آموزش‌های تخصصی با گواهینامه معتبر",
      icon: BookOpen,
      link: "/courses",
      type: "course" as const,
      gradient: "from-blue-500 to-purple-600",
      iconColor: "text-blue-500"
    },
    {
      title: "مشاوره تخصصی",
      description: "مشاوره یک به یک با کارشناسان مجرب",
      icon: MessageCircle,
      link: "/contact",
      type: "consultation" as const,
      gradient: "from-green-500 to-teal-600",
      iconColor: "text-green-500"
    }
  ];

  return (
    <MainLayout>
      <Hero
        title={translations.slogan || "آکادمی رفیعی"}
        subtitle={translations.tagline || "راه خود را به سوی موفقیت پیدا کنید"}
        ctaText={translations.callToAction || "شروع کنید"}
        ctaLink="/courses"
        backgroundType="glow"
        glowTheme="home"
      />

      {showWarNotification && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
            <p className="text-amber-800 dark:text-amber-200 font-medium">
              ⚠️ به دلیل وضعیت جنگی و نامعلوم بودن شرایط، تمام دوره‌ها تا اطلاع ثانوی متوقف شده‌اند.
            </p>
          </div>
        </div>
      )}

      {/* Hub CTA Banner */}
      <div className="container mx-auto px-4">
        <HubCTABanner />
      </div>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title={translations.paidCoursesTitle || "دوره‌های ویژه"} 
            subtitle="بهترین دوره‌ها برای شروع مسیر یادگیری شما" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {featuredCourses.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="مرکز ارزیابی شخصیت" 
            subtitle="خودتان را بهتر بشناسید و مسیر درست را انتخاب کنید" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredTests.map((test) => (
              <TestCard
                key={test.id}
                {...test}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="گزینه‌های آموزشی" 
            subtitle="انتخاب کنید که چگونه می‌خواهید یاد بگیرید" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {educationOptions.map((option) => (
              <EducationCard
                key={option.title}
                {...option}
              />
            ))}
          </div>
        </div>
      </section>

      <FloatingNotification />
    </MainLayout>
  );
};

export default Index;
