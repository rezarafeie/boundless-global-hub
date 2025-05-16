
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";

const FreeCourses = () => {
  const { translations } = useLanguage();

  const courses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false,
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    },
  ];

  return (
    <MainLayout>
      <Hero
        title={translations.freeCoursesTitle}
        subtitle={translations.freeCoursesSubtitle}
        ctaText={translations.startLearning}
        ctaLink="#courses"
      />
      
      <section id="courses" className="py-16">
        <div className="container">
          <SectionTitle
            title={translations.coursesTitle}
            subtitle={translations.coursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {courses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
                image={course.image}
              />
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default FreeCourses;
