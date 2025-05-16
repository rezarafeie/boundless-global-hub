
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { translations } = useLanguage();

  const paidCourses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
    },
  ];

  const freeCourses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
    },
  ];

  return (
    <MainLayout>
      <Hero
        title={translations.slogan}
        subtitle={translations.tagline}
        ctaText={translations.callToAction}
        ctaLink="/paid-courses"
      />

      {/* Featured Paid Courses */}
      <section className="py-16 bg-background">
        <div className="container">
          <SectionTitle
            title={translations.paidCoursesTitle}
            subtitle={translations.paidCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {paidCourses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link to="/paid-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Free Courses */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <SectionTitle
            title={translations.freeCoursesTitle}
            subtitle={translations.freeCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {freeCourses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/free-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {translations.assessmentCenterDesc}
              </p>
              <Button asChild size="lg">
                <Link to="/assessment-center">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.personalityTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.intelligenceTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.careerTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.emotionTests}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
