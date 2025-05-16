
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import TestCard from "@/components/TestCard";
import SectionTitle from "@/components/SectionTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

const AssessmentCenter = () => {
  const { translations } = useLanguage();

  const personalityTests = [
    {
      title: "Myers-Briggs Type Indicator (MBTI)",
      description: "Discover your personality type and how it influences your work style, relationships, and decision-making.",
      category: translations.personalityTests,
    },
    {
      title: "Big Five Personality Assessment",
      description: "Evaluate your traits across five major dimensions: openness, conscientiousness, extraversion, agreeableness, and neuroticism.",
      category: translations.personalityTests,
    },
  ];

  const intelligenceTests = [
    {
      title: "IQ Assessment",
      description: "Measure your cognitive abilities and logical reasoning with this comprehensive intelligence quotient test.",
      category: translations.intelligenceTests,
    },
    {
      title: "Multiple Intelligences Profile",
      description: "Identify your strengths across different types of intelligence, including linguistic, logical-mathematical, spatial, and more.",
      category: translations.intelligenceTests,
    },
  ];

  const careerTests = [
    {
      title: "Career Path Finder",
      description: "Find the perfect career path based on your interests, skills, values, and personality traits.",
      category: translations.careerTests,
    },
    {
      title: "Entrepreneurship Aptitude Test",
      description: "Evaluate your potential for success as an entrepreneur and business owner.",
      category: translations.careerTests,
    },
  ];

  const emotionTests = [
    {
      title: "Emotional Intelligence Assessment",
      description: "Measure your ability to recognize, understand, manage, and effectively express emotions.",
      category: translations.emotionTests,
    },
    {
      title: "Stress & Resilience Profile",
      description: "Analyze your stress levels and assess your resilience in challenging situations.",
      category: translations.emotionTests,
    },
  ];

  return (
    <MainLayout>
      <Hero
        title={translations.assessmentCenterTitle}
        subtitle={translations.assessmentCenterDesc}
        ctaText={translations.startTest}
        ctaLink="#tests"
        image="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80"
      />
      
      <section id="tests" className="py-16">
        <div className="container">
          <SectionTitle
            title={translations.assessmentCenterTitle}
            subtitle={translations.assessmentCenterDesc}
          />
          
          <Tabs defaultValue="personality" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="personality">{translations.personalityTests}</TabsTrigger>
              <TabsTrigger value="intelligence">{translations.intelligenceTests}</TabsTrigger>
              <TabsTrigger value="career">{translations.careerTests}</TabsTrigger>
              <TabsTrigger value="emotion">{translations.emotionTests}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personality" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {personalityTests.map((test, index) => (
                  <TestCard
                    key={index}
                    title={test.title}
                    description={test.description}
                    category={test.category}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="intelligence" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {intelligenceTests.map((test, index) => (
                  <TestCard
                    key={index}
                    title={test.title}
                    description={test.description}
                    category={test.category}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="career" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {careerTests.map((test, index) => (
                  <TestCard
                    key={index}
                    title={test.title}
                    description={test.description}
                    category={test.category}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="emotion" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {emotionTests.map((test, index) => (
                  <TestCard
                    key={index}
                    title={test.title}
                    description={test.description}
                    category={test.category}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </MainLayout>
  );
};

export default AssessmentCenter;
