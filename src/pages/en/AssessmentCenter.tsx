
import React, { useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import TestCard from "@/components/TestCard";

const EnglishAssessmentCenter = () => {
  const { translations, setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage("en");
  }, [setLanguage]);

  return (
    <MainLayout>
      <Hero
        title={translations.assessmentCenterTitle}
        subtitle={translations.assessmentCenterDesc}
        ctaText={translations.startTest}
        ctaLink="#tests"
        backgroundType="glow"
      />
      
      <section id="tests" className="py-16">
        <div className="container">
          <SectionTitle
            title={translations.assessmentCenterTitle}
            subtitle={translations.assessmentCenterDesc}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <TestCard
              title={translations.personalityTests}
              description="Discover your personality traits and how they influence your life and career choices."
              category={translations.personalityTests}
              slug="assessment/mbti"
            />
            <TestCard
              title={translations.intelligenceTests}
              description="Measure different aspects of your cognitive abilities and intellectual potential."
              category={translations.intelligenceTests}
              slug="assessment/mii"
            />
            <TestCard
              title={translations.careerTests}
              description="Identify career paths that align with your interests, values, skills, and personality."
              category={translations.careerTests}
              slug="assessment/boundless"
            />
            <TestCard
              title={translations.emotionTests}
              description="Evaluate your emotional intelligence and ability to understand and manage emotions."
              category={translations.emotionTests}
              slug="assessment/eq-shatt"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default EnglishAssessmentCenter;
