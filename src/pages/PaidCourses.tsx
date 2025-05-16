
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";

const PaidCourses = () => {
  const { translations } = useLanguage();

  const courses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80"
    },
  ];

  return (
    <MainLayout>
      <Hero
        title={translations.paidCoursesTitle}
        subtitle={translations.paidCoursesSubtitle}
        ctaText={translations.callToAction}
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

export default PaidCourses;
