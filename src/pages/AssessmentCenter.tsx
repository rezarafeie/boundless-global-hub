
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import TestCard from "@/components/TestCard";

const AssessmentCenter = () => {
  const { translations } = useLanguage();

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
              description={translations.personalityTestDesc}
              category={translations.personalityTests}
              slug="test/mbti"
              duration={translations.testDuration20}
              questions={93}
            />
            <TestCard
              title={translations.intelligenceTests}
              description={translations.intelligenceTestDesc}
              category={translations.intelligenceTests}
              slug="test/mii"
              duration={translations.testDuration15}
              questions={40}
            />
            <TestCard
              title={translations.careerTests}
              description={translations.careerTestDesc}
              category={translations.careerTests}
              slug="test/boundless"
              duration={translations.testDuration10}
              questions={25}
            />
            <TestCard
              title={translations.emotionTests}
              description={translations.emotionTestDesc}
              category={translations.emotionTests}
              slug="test/eq-shatt"
              duration={translations.testDuration12}
              questions={30}
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AssessmentCenter;
