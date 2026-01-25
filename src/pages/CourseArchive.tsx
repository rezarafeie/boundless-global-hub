import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import RescueProjectBanner from "@/components/RescueProjectBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

const CourseArchive = () => {
  const { translations, direction } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "همه دوره‌ها", labelEn: "All Courses" },
    { id: "business", label: "کسب‌وکار", labelEn: "Business" },
    { id: "personal", label: "توسعه فردی", labelEn: "Personal Development" },
    { id: "free", label: "رایگان", labelEn: "Free" },
    { id: "upcoming", label: "به‌زودی", labelEn: "Coming Soon" },
    { id: "completed", label: "تکمیل شده", labelEn: "Completed" }
  ];

  const courses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      status: "active" as const,
      category: "business" as const,
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
      cartUrl: "https://auth.rafiei.co/?add-to-cart=5311"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      status: "active" as const,
      category: "business" as const,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      cartUrl: "https://auth.rafiei.co/?add-to-cart=5089"
    },
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      status: "completed" as const,
      category: "self-development" as const,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      cartUrl: "https://auth.rafiei.co/?add-to-cart=148"
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      status: "upcoming" as const,
      category: "business" as const,
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80",
      cartUrl: "https://auth.rafiei.co/?add-to-cart=145"
    },
    {
      title: "پک هوشمند | زندگی بهتر با هوش مصنوعی",
      description: "پکیج جامع آموزش و ابزار برای بهتر زندگی کردن با هوش مصنوعی. شامل پادکست، پرامپت‌ها، ابزارها و آموزش عملی.",
      benefits: "۶ اپیزود پادکست آموزشی، دفترچه پرامپت‌نویسی کامل، ابزارهای برتر هوش مصنوعی، آموزش ساخت ایجنت هوشمند",
      outcome: "تسلط کامل بر ابزارهای هوش مصنوعی برای بهبود زندگی شخصی و کاری",
      isPaid: true,
      status: "active" as const,
      category: "business" as const,
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
      link: "/courses/smart-pack"
    },
    {
      title: "زندگی هوشمند | شروع با هوش مصنوعی",
      description: "۲ جلسه رایگان برای شروع زندگی هوشمند با AI. با ۲ قدم ساده، یاد بگیر چطور هوش مصنوعی می‌تونه زندگی شخصی و کاری‌تو متحول کنه.",
      benefits: "دسترسی کامل به جلسه ۱ دوره پرمیوم، جلسه بونوس انحصاری، کاربردهای عملی با ابزارهای ChatGPT، Gemini، Canva، Suno",
      outcome: "شروع زندگی هوشمند با AI و آمادگی برای شرکت در دوره کامل هوش مصنوعی",
      isPaid: false,
      status: "active" as const,
      category: "free" as const,
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
      link: "/course/smart-life"
    },
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      status: "active" as const,
      category: "free" as const,
      link: "/course/boundless-taste"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      status: "active" as const,
      category: "free" as const,
      link: "/course/passive-income"
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false,
      status: "active" as const,
      category: "free" as const,
      link: "/course/change"
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false,
      status: "active" as const,
      category: "free" as const,
      link: "/course/american-business"
    },
    {
      title: "پروژه بحران",
      description: "🎯 مدیریت بحران، سرمایه‌گذاری هوشمند، و ساخت کسب‌وکار بین‌المللی در سخت‌ترین شرایط. این پروژه به شما کمک می‌کند تا بحران را به فرصت تبدیل کنید.",
      benefits: "⚡ یادگیری مدیریت بحران فردی و اقتصادی • درک مکانیزم ماشه و تأثیرات آن • تکنیک‌های سرمایه‌گذاری هوشمند در شرایط بحران • راه‌اندازی کسب‌وکارهای بدون مرز",
      outcome: "🌟 پس از این پروژه: با اعتماد به نفس کامل، بحران را به فرصت تبدیل خواهید کرد و مسیر واضحی برای رسیدن به آزادی مالی و کسب‌وکار بین‌المللی خواهید داشت.",
      isPaid: false,
      status: "active" as const,
      category: "business" as const,
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=800&q=80",
      link: "/course/crisis-project"
    }
  ];

  const filteredCourses = activeFilter === "all" 
    ? courses 
    : courses.filter(course => {
        if (activeFilter === "free") return !course.isPaid;
        if (activeFilter === "upcoming") return course.status === "upcoming";
        if (activeFilter === "completed") return course.status === "completed";
        if (activeFilter === "personal") return course.category === "self-development";
        return course.category === activeFilter;
      });

  return (
    <MainLayout>
      {/* Single Hero Section - Remove dark secondary hero */}
      <Hero
        title={translations.trainingCenter}
        subtitle={translations.trainingCenterDesc}
        ctaText={translations.callToAction}
        ctaLink="#courses"
        backgroundType="glow"
      />
      
      <RescueProjectBanner />
      
      <section id="courses" className="py-16">
        <div className="container">
          <SectionTitle
            title={translations.coursesTitle}
            subtitle={translations.coursesSubtitle}
          />
          
          {/* Mobile-Optimized Filter Tabs */}
          <div className="mb-8">
            {/* Desktop Filters */}
            <div className="hidden md:flex justify-center">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeFilter === filter.id
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-600 hover:text-black hover:bg-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mobile Horizontal Scrollable Filters */}
            <div className="md:hidden">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className={`flex gap-3 p-4 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                        activeFilter === filter.id
                          ? 'bg-black text-white border-black shadow-lg'
                          : 'text-gray-600 border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
          
          {/* Course Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            key={activeFilter}
          >
            {filteredCourses.map((course, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CourseCard {...course} />
              </motion.div>
            ))}
          </motion.div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">هیچ دوره‌ای در این دسته‌بندی یافت نشد.</p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default CourseArchive;
