
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
              image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
              category={translations.personalityTests}
            />
            <TestCard
              title={translations.intelligenceTests}
              description="Measure different aspects of your cognitive abilities and intellectual potential."
              image="https://images.unsplash.com/photo-1455849318743-b2233052fcff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80"
              category={translations.intelligenceTests}
            />
            <TestCard
              title={translations.careerTests}
              description="Identify career paths that align with your interests, values, skills, and personality."
              image="https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80"
              category={translations.careerTests}
            />
            <TestCard
              title={translations.emotionTests}
              description="Evaluate your emotional intelligence and ability to understand and manage emotions."
              image="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
              category={translations.emotionTests}
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default EnglishAssessmentCenter;
