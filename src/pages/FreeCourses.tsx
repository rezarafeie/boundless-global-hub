
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import EnhancedFreeCourseCard from "@/components/EnhancedFreeCourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const FreeCourses = () => {
  const { translations } = useLanguage();

  const courses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      slug: "boundless-taste",
      duration: "2 ساعت",
      studentCount: 1250,
      features: [
        "مقدمه‌ای بر کسب‌وکار بین‌المللی",
        "شناخت بازارهای هدف",
        "اصول فروش آنلاین",
        "گواهی شرکت در دوره"
      ],
      testimonial: "عالی بود! کمکم کرد تا بفهمم آیا دوره اصلی مناسب منه یا نه."
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      slug: "passive-income",
      duration: "1.5 ساعت",
      studentCount: 890,
      features: [
        "آشنایی با ابزارهای هوش مصنوعی",
        "تولید محتوای خودکار",
        "استراتژی‌های درآمدزایی",
        "نمونه‌های عملی"
      ],
      testimonial: "خیلی کاربردی بود. تونستم از همون روز اول شروع کنم."
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      slug: "change",
      duration: "1 ساعت",
      studentCount: 670,
      features: [
        "شناخت موانع ذهنی",
        "تکنیک‌های تغییر عادت",
        "برنامه‌ریزی هدفمند",
        "راهکارهای عملی"
      ],
      testimonial: "دوره‌ای که زندگی‌ام رو عوض کرد. خیلی ممنونم استاد رفیعی."
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      slug: "american-business",
      duration: "3 ساعت",
      studentCount: 1100,
      features: [
        "قوانین کسب‌وکار آمریکا",
        "مراحل ثبت شرکت",
        "سیستم مالیاتی",
        "فرصت‌های سرمایه‌گذاری"
      ],
      testimonial: "همه چیزی که برای شروع کار در آمریکا نیاز داشتم رو یاد گرفتم."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const childVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <MainLayout>
      <Hero
        title={translations.freeCoursesTitle}
        subtitle={translations.freeCoursesSubtitle}
        ctaText={translations.startLearning}
        ctaLink="#courses"
        backgroundType="glow"
      />
      
      <section id="courses" className="py-16 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-b before:from-background before:to-secondary/10 before:z-0">
        <div className="container relative z-10">
          <SectionTitle
            title={translations.coursesTitle}
            subtitle={translations.coursesSubtitle}
          />
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {courses.map((course, index) => (
              <motion.div key={index} variants={childVariants} className="h-full">
                <EnhancedFreeCourseCard
                  title={course.title}
                  description={course.description}
                  benefits={course.benefits}
                  outcome={course.outcome}
                  slug={course.slug}
                  duration={course.duration}
                  studentCount={course.studentCount}
                  features={course.features}
                  testimonial={course.testimonial}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default FreeCourses;
