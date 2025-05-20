
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Award, Star, Clock } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import AIAssistantButton from "@/components/AIAssistant/AIAssistantButton";

const CourseArchive = () => {
  const { translations } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  
  const paidCourses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless",
      instructor: "رضا رفیعی",
      level: translations.intermediate,
      cta: "شروع یادگیری"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram",
      instructor: "رضا رفیعی",
      level: translations.beginner,
      cta: "شروع یادگیری"
    },
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      slug: "wealth",
      instructor: "رضا رفیعی",
      level: translations.intermediate,
      cta: "شروع یادگیری"
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      slug: "metaverse",
      instructor: "رضا رفیعی",
      level: translations.advanced,
      cta: "شروع یادگیری"
    }
  ];

  const freeCourses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      slug: "boundless-taste",
      instructor: "رضا رفیعی",
      level: translations.beginner,
      cta: "شروع یادگیری"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      slug: "passive-income",
      instructor: "رضا رفیعی",
      level: translations.beginner,
      cta: "شروع یادگیری"
    },
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false,
      slug: "change-project",
      instructor: "رضا رفیعی",
      level: translations.beginner,
      cta: "شروع یادگیری"
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false,
      slug: "american-business",
      instructor: "رضا رفیعی",
      level: translations.intermediate,
      cta: "شروع یادگیری"
    },
    {
      title: "آشنایی با متاورس",
      description: "آشنایی با مفاهیم پایه متاورس، ارزهای دیجیتال و فرصت‌های این فناوری نوظهور",
      benefits: "درک مفهوم متاورس و کاربردهای آن در زندگی روزمره",
      outcome: "آشنایی با مفاهیم اولیه ارزهای دیجیتال و NFT",
      isPaid: false,
      slug: "metaverse-free",
      instructor: "رضا رفیعی",
      level: translations.beginner,
      cta: "شروع یادگیری"
    }
  ];
  
  const displayCourses = activeTab === 'all' 
    ? [...paidCourses, ...freeCourses]
    : activeTab === 'paid' 
      ? paidCourses 
      : freeCourses;

  return (
    <MainLayout>
      <div className="py-12 bg-black text-white text-center">
        <div className="container">
          <SectionTitle 
            title="مرکز آموزش" 
            subtitle="مجموعه دوره‌های تخصصی برای توسعه مهارت‌های کسب و کار و کسب درآمد ارزی"
            isCentered={true}
            isWhite={true}
          />
        </div>
      </div>

      <div className="container py-16">
        {/* AI Assistant Button */}
        <div className="flex justify-center mb-12">
          <AIAssistantButton size="lg" />
        </div>
        
        {/* Course Filter Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-12">
            <TabsList className="bg-black/5">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>همه دوره‌ها</span>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{translations.paidCoursesTitle}</span>
              </TabsTrigger>
              <TabsTrigger value="free" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{translations.freeCoursesTitle}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayCourses.map((course, index) => (
                <CourseCard
                  key={index}
                  title={course.title}
                  description={course.description}
                  benefits={course.benefits}
                  outcome={course.outcome}
                  isPaid={course.isPaid}
                  slug={course.slug}
                  instructor={course.instructor}
                  instructorLink="/instructor/reza-rafiei"
                  level={course.level}
                  cta={course.cta}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="paid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paidCourses.map((course, index) => (
                <CourseCard
                  key={index}
                  title={course.title}
                  description={course.description}
                  benefits={course.benefits}
                  outcome={course.outcome}
                  isPaid={course.isPaid}
                  slug={course.slug}
                  instructor={course.instructor}
                  instructorLink="/instructor/reza-rafiei"
                  level={course.level}
                  cta={course.cta}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="free">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {freeCourses.map((course, index) => (
                <CourseCard
                  key={index}
                  title={course.title}
                  description={course.description}
                  benefits={course.benefits}
                  outcome={course.outcome}
                  isPaid={course.isPaid}
                  slug={course.slug}
                  instructor={course.instructor}
                  instructorLink="/instructor/reza-rafiei"
                  level={course.level}
                  cta={course.cta}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CourseArchive;
