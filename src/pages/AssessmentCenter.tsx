
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import TestCard from "@/components/TestCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const AssessmentCenter = () => {
  const { translations } = useLanguage();

  const tests = [
    {
      title: "تست مسیر هوشمند",
      description: "کشف مسیر شغلی و تحصیلی مناسب بر اساس شخصیت و علایق شما",
      category: "شخصیت",
      duration: "15 دقیقه",
      questions: 60,
      slug: "test/boundless"
    },
    {
      title: "تست شخصیت‌شناسی حرفه‌ای",
      description: "شناخت دقیق ابعاد شخصیتی و نقاط قوت و ضعف",
      category: "شخصیت",
      duration: "20 دقیقه", 
      questions: 80,
      slug: "personality-test"
    },
    {
      title: "تست هوش هیجانی",
      description: "سنجش میزان کنترل احساسات و روابط اجتماعی",
      category: "هوش",
      duration: "12 دقیقه",
      questions: 45,
      slug: "emotional-intelligence"
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
        title={translations.assessmentCenterTitle}
        subtitle={translations.assessmentCenterDesc}
        ctaText={translations.startTest}
        ctaLink="#tests"
        backgroundType="glow"
      />
      
      <section id="tests" className="py-16 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-b before:from-background before:to-secondary/10 before:z-0">
        <div className="container relative z-10">
          <SectionTitle
            title="تست‌های تخصصی"
            subtitle="ارزیابی مهارت‌ها و توانایی‌های شما با استفاده از تست‌های استاندارد"
          />
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {tests.map((test, index) => (
              <motion.div key={index} variants={childVariants} className="h-full">
                <div className="h-full transform transition-all duration-300 group-hover:scale-[1.02]">
                  <TestCard
                    title={test.title}
                    description={test.description}
                    category={test.category}
                    duration={test.duration}
                    questions={test.questions}
                    slug={test.slug}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AssessmentCenter;
