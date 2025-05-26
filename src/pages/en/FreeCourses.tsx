
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import EnhancedFreeCourseCard from "@/components/EnhancedFreeCourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const EnglishFreeCourses = () => {
  const { translations, setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage("en");
  }, [setLanguage]);
  
  const courses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      slug: "boundless-taste",
      duration: "2 hours",
      studentCount: 1250,
      features: [
        "Introduction to international business",
        "Target market identification",
        "Online sales principles",
        "Course completion certificate"
      ],
      testimonial: "Excellent! It helped me understand if the main course is right for me."
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      slug: "passive-income",
      duration: "1.5 hours",
      studentCount: 890,
      features: [
        "AI tools introduction",
        "Automated content creation",
        "Revenue generation strategies",
        "Practical examples"
      ],
      testimonial: "Very practical. I was able to start from day one."
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      slug: "change-project",
      duration: "1 hour",
      studentCount: 670,
      features: [
        "Mental barriers identification",
        "Habit change techniques",
        "Goal-oriented planning",
        "Practical solutions"
      ],
      testimonial: "A course that changed my life. Thank you so much Mr. Rafiei."
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      slug: "american-business",
      duration: "3 hours",
      studentCount: 1100,
      features: [
        "US business regulations",
        "Company registration steps",
        "Tax system overview",
        "Investment opportunities"
      ],
      testimonial: "I learned everything I needed to start working in America."
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

export default EnglishFreeCourses;
