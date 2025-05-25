
import React, { useState } from "react";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const AllCourses = () => {
  const { translations } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");

  const allCourses = [
    // Paid courses - Currently Running
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless",
      status: "running",
      category: "business"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram",
      status: "running",
      category: "marketing"
    },
    // Paid courses - Upcoming
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      slug: "wealth",
      status: "upcoming",
      category: "finance"
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      slug: "metaverse",
      status: "upcoming",
      category: "tech"
    },
    // Free courses - Currently Running
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      slug: "boundless-taste",
      status: "running",
      category: "intro"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      slug: "passive-income-ai",
      status: "running",
      category: "ai"
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false,
      slug: "change-project",
      status: "running",
      category: "personal"
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false,
      slug: "american-business",
      status: "running",
      category: "business"
    }
  ];

  const getFilteredCourses = () => {
    switch (activeTab) {
      case "running":
        return allCourses.filter(course => course.status === "running");
      case "upcoming":
        return allCourses.filter(course => course.status === "upcoming");
      case "past":
        return allCourses.filter(course => course.status === "past");
      case "free":
        return allCourses.filter(course => !course.isPaid);
      case "paid":
        return allCourses.filter(course => course.isPaid);
      default:
        return allCourses;
    }
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-800">در حال برگزاری</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800">آینده</Badge>;
      case "past":
        return <Badge className="bg-gray-100 text-gray-800">گذشته</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Hero
        title="مرکز آموزش"
        subtitle="تمام دوره‌های آموزشی ما را مشاهده کنید"
        ctaText="شروع یادگیری"
        ctaLink="#courses"
        backgroundType="glow"
      />
      
      <section id="courses" className="py-16 relative">
        <div className="container relative z-10">
          <SectionTitle
            title="همه دوره‌ها"
            subtitle="از دوره‌های رایگان تا ویژه، همه را اینجا پیدا کنید"
          />
          
          <Tabs defaultValue="all" className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl mx-auto">
              <TabsTrigger value="all" onClick={() => setActiveTab("all")}>همه</TabsTrigger>
              <TabsTrigger value="running" onClick={() => setActiveTab("running")}>در حال برگزاری</TabsTrigger>
              <TabsTrigger value="upcoming" onClick={() => setActiveTab("upcoming")}>آینده</TabsTrigger>
              <TabsTrigger value="past" onClick={() => setActiveTab("past")}>گذشته</TabsTrigger>
              <TabsTrigger value="free" onClick={() => setActiveTab("free")}>رایگان</TabsTrigger>
              <TabsTrigger value="paid" onClick={() => setActiveTab("paid")}>ویژه</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeTab}
          >
            {getFilteredCourses().map((course, index) => (
              <motion.div key={course.slug} variants={childVariants} className="h-full">
                <div className="relative h-full transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {getStatusBadge(course.status)}
                  </div>
                  <CourseCard
                    title={course.title}
                    description={course.description}
                    benefits={course.benefits}
                    outcome={course.outcome}
                    isPaid={course.isPaid}
                    slug={course.slug}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {getFilteredCourses().length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">هیچ دوره‌ای در این دسته‌بندی یافت نشد.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default AllCourses;
