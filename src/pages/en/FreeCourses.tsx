import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import RegistrationForm from "@/components/RegistrationForm";
import { motion } from "framer-motion";

const EnglishFreeCourses = () => {
  const { translations, setLanguage } = useLanguage();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    setLanguage("en");
  }, [setLanguage]);
  
  const courses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false
    },
  ];

  const handleCourseClick = (title: string) => {
    setSelectedCourse(title);
    
    // Scroll to registration form
    setTimeout(() => {
      document.getElementById("registration-form")?.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };

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
      />
      
      <section id="courses" className="py-16 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-b before:from-background before:to-secondary/10 before:z-0">
        <div className="container relative z-10">
          <SectionTitle
            title={translations.coursesTitle}
            subtitle={translations.coursesSubtitle}
          />
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {courses.map((course, index) => (
              <motion.div key={index} variants={childVariants} className="h-full">
                <div 
                  className="h-full group cursor-pointer" 
                  onClick={() => handleCourseClick(course.title)}
                >
                  <div className="h-full transform transition-all duration-300 group-hover:scale-[1.02]">
                    <CourseCard
                      title={course.title}
                      description={course.description}
                      benefits={course.benefits}
                      outcome={course.outcome}
                      isPaid={course.isPaid}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="registration-form" className="py-16 bg-gradient-to-b from-accent/5 to-background">
        <div className="container">
          <SectionTitle
            title={selectedCourse || translations.startLearning}
            subtitle={translations.freeCoursesSubtitle}
          />
          
          <div className="mt-8">
            <RegistrationForm courseTitle={selectedCourse || ""} isPaid={false} />
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default EnglishFreeCourses;
