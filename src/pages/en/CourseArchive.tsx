import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EnglishCourseArchive = () => {
  const { translations, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  
  useEffect(() => {
    setLanguage("en");
  }, [setLanguage]);

  const courses = [
    // Paid courses
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless",
      category: "business"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram",
      category: "social"
    },
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      slug: "wealth",
      category: "finance"
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      slug: "metaverse",
      category: "tech"
    },
    {
      title: "The Smart Pack | Life Upgrade with AI",
      description: "Complete package of training and tools for better living with artificial intelligence. Includes podcasts, prompts, tools and practical training.",
      benefits: "6 educational podcast episodes, Complete prompt writing guide, Top AI tools, Smart agent creation training",
      outcome: "Complete mastery of AI tools to improve personal and professional life",
      isPaid: true,
      slug: "smart-pack",
      category: "tech",
      link: "/smart-pack"
    },
    // Free courses
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      slug: "boundless-taste",
      category: "business"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      slug: "passive-income",
      category: "tech"
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false,
      slug: "change-project",
      category: "personal"
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false,
      slug: "american-business",
      category: "business"
    }
  ];

  const filteredCourses = activeTab === "all" 
    ? courses 
    : activeTab === "paid" 
      ? courses.filter(course => course.isPaid)
      : activeTab === "free"
        ? courses.filter(course => !course.isPaid)
        : courses.filter(course => course.category === activeTab);

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
        title={translations.coursesTitle}
        subtitle={translations.coursesSubtitle}
        ctaText={translations.startLearning}
        ctaLink="#courses"
        backgroundType="glow"
      />
      
      <section id="courses" className="py-16 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-b before:from-background before:to-secondary/10 before:z-0">
        <div className="container relative z-10">
          <SectionTitle
            title={translations.coursesTitle}
            subtitle={translations.coursesSubtitle}
          />
          
          <Tabs defaultValue="all" className="w-full mb-8">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-6">
              <TabsTrigger value="all" onClick={() => setActiveTab("all")}>All</TabsTrigger>
              <TabsTrigger value="paid" onClick={() => setActiveTab("paid")}>Paid</TabsTrigger>
              <TabsTrigger value="free" onClick={() => setActiveTab("free")}>Free</TabsTrigger>
              <TabsTrigger value="business" onClick={() => setActiveTab("business")}>Business</TabsTrigger>
              <TabsTrigger value="tech" onClick={() => setActiveTab("tech")}>Tech</TabsTrigger>
              <TabsTrigger value="personal" onClick={() => setActiveTab("personal")}>Personal</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeTab} // Re-animate when tab changes
          >
            {filteredCourses.map((course, index) => (
              <motion.div key={index} variants={childVariants} className="h-full">
                <div className="h-full transform transition-all duration-300 hover:scale-[1.02]">
                  <CourseCard
                    title={course.title}
                    description={course.description}
                    benefits={course.benefits}
                    outcome={course.outcome}
                    isPaid={course.isPaid}
                    slug={course.slug}
                    link={course.link}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default EnglishCourseArchive;
