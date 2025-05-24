
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import QuickAccess from "@/components/QuickAccess";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";

const EnglishIndex = () => {
  const { translations, setLanguage } = useLanguage();
  
  useEffect(() => {
    setLanguage("en");
  }, [setLanguage]);

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
        ctaLink="/en/paid-courses"
      />

      {/* Quick Access Section */}
      <QuickAccess />

      {/* Featured Paid Courses */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <SectionTitle
            title={translations.paidCoursesTitle}
            subtitle={translations.paidCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
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
          
          <div className="mt-16 text-center">
            <Button asChild size="lg" className="px-8 py-3 text-lg">
              <Link to="/en/paid-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Free Courses */}
      <section className="py-20 bg-secondary/20">
        <div className="container max-w-6xl">
          <SectionTitle
            title={translations.freeCoursesTitle}
            subtitle={translations.freeCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
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
          
          <div className="mt-16 text-center">
            <Button asChild size="lg" variant="outline" className="px-8 py-3 text-lg">
              <Link to="/en/free-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-20 bg-primary/5">
        <div className="container max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2 space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {translations.assessmentCenterDesc}
              </p>
              <Button asChild size="lg" className="px-8 py-3 text-lg">
                <Link to="/en/assessment-center">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary/10 p-8 rounded-xl text-center hover:bg-primary/15 transition-colors">
                  <h3 className="font-semibold text-lg mb-2">
                    {translations.personalityTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-8 rounded-xl text-center hover:bg-primary/15 transition-colors">
                  <h3 className="font-semibold text-lg mb-2">
                    {translations.intelligenceTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-8 rounded-xl text-center hover:bg-primary/15 transition-colors">
                  <h3 className="font-semibold text-lg mb-2">
                    {translations.careerTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-8 rounded-xl text-center hover:bg-primary/15 transition-colors">
                  <h3 className="font-semibold text-lg mb-2">
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

export default EnglishIndex;
