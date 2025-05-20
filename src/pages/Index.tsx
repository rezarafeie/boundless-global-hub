
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import AIAssistantCTA from "@/components/AIAssistant/AIAssistantCTA";

const Index = () => {
  const { translations } = useLanguage();

  const paidCourses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const freeCourses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
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
      
      {/* AI Assistant CTA */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold mb-4">{translations.aiAssistantTitle}</h2>
              <p className="text-lg text-gray-700 mb-6">{translations.aiAssistantDescription}</p>
              <Button 
                asChild 
                className="bg-black hover:bg-gray-800 text-white"
                size="lg"
              >
                <Link to="/ai-assistant">
                  {translations.aiAssistantAction}
                </Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <AIAssistantCTA />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Paid Courses */}
      <section className="py-16 bg-white">
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
                image={course.image}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Link to="/paid-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Free Courses */}
      <section className="py-16 bg-gray-50">
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
                image={course.image}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="border-black hover:bg-gray-100"
            >
              <Link to="/free-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {translations.assessmentCenterDesc}
              </p>
              <Button 
                asChild 
                size="lg"
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Link to="/assessment-center">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-lg border border-black/10 text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.personalityTests}
                  </h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border border-black/10 text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.intelligenceTests}
                  </h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border border-black/10 text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.careerTests}
                  </h3>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border border-black/10 text-center">
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
