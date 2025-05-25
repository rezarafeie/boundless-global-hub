
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Award, Star, Clock, GraduationCap, Briefcase, FileText } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CourseArchive = () => {
  const { translations } = useLanguage();
  
  // Track filter states
  const [activeTab, setActiveTab] = useState("all");
  const [courseCategory, setCourseCategory] = useState("all");
  
  const courses = [
    // Currently running courses
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.intermediate,
      cta: "شروع یادگیری",
      status: "active",
      category: "business"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.beginner,
      cta: "شروع یادگیری",
      status: "active",
      category: "business"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      slug: "passive-income",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.beginner,
      cta: "شروع یادگیری",
      status: "active",
      category: "business"
    },
    {
      title: "پروژه تغییر",
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false,
      slug: "change-project",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.beginner,
      cta: "شروع یادگیری",
      status: "active",
      category: "self-development"
    },
    {
      title: "آشنایی با متاورس",
      description: "آشنایی با مفاهیم پایه متاورس، ارزهای دیجیتال و فرصت‌های این فناوری نوظهور",
      benefits: "درک مفهوم متاورس و کاربردهای آن در زندگی روزمره",
      outcome: "آشنایی با مفاهیم اولیه ارزهای دیجیتال و NFT",
      isPaid: false,
      slug: "metaverse-free",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.beginner,
      cta: "شروع یادگیری",
      status: "active",
      category: "business"
    },
    // Upcoming courses
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      slug: "wealth",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.intermediate,
      cta: "شروع یادگیری",
      status: "upcoming",
      category: "self-development"
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      slug: "metaverse",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.advanced,
      cta: "شروع یادگیری",
      status: "upcoming",
      category: "business"
    },
    // Past courses
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false,
      slug: "american-business",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.intermediate,
      cta: "شروع یادگیری",
      status: "completed",
      category: "business"
    },
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      slug: "boundless-taste",
      instructor: "رضا رفیعی",
      instructorLink: "/instructor/reza-rafiei",
      level: translations.beginner,
      cta: "شروع یادگیری",
      status: "completed",
      category: "free"
    }
  ];
  
  // Filter courses based on active tab and category
  const filterCourses = () => {
    let filtered = [...courses];
    
    // Filter by status (active tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(course => course.status === activeTab);
    }
    
    // Filter by category
    if (courseCategory !== "all") {
      filtered = filtered.filter(course => {
        if (courseCategory === "free") {
          return !course.isPaid;
        }
        return course.category === courseCategory;
      });
    }
    
    return filtered;
  };

  return (
    <MainLayout>
      <Hero
        title={translations.trainingCenter}
        subtitle={translations.trainingCenterDesc}
        ctaText={translations.startLearning}
        ctaLink="#courses"
        backgroundType="glow"
      />

      <div className="bg-black text-white py-12">
        <div className="container">
          <SectionTitle 
            title={translations.trainingCenter} 
            subtitle="مجموعه دوره‌های تخصصی برای توسعه مهارت‌های کسب و کار و کسب درآمد ارزی"
            isCentered={true}
            isWhite={true}
          />
        </div>
      </div>

      <div className="container py-16">
        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Button
            variant={courseCategory === "all" ? "default" : "outline"}
            className={`rounded-full ${courseCategory === "all" ? "bg-black text-white" : "border-black/20 text-black"}`}
            onClick={() => setCourseCategory("all")}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            همه دوره‌ها
          </Button>
          <Button
            variant={courseCategory === "business" ? "default" : "outline"}
            className={`rounded-full ${courseCategory === "business" ? "bg-black text-white" : "border-black/20 text-black"}`}
            onClick={() => setCourseCategory("business")}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            {translations.businessCourses}
          </Button>
          <Button
            variant={courseCategory === "self-development" ? "default" : "outline"}
            className={`rounded-full ${courseCategory === "self-development" ? "bg-black text-white" : "border-black/20 text-black"}`}
            onClick={() => setCourseCategory("self-development")}
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            {translations.selfDevelopmentCourses}
          </Button>
          <Button
            variant={courseCategory === "free" ? "default" : "outline"}
            className={`rounded-full ${courseCategory === "free" ? "bg-black text-white" : "border-black/20 text-black"}`}
            onClick={() => setCourseCategory("free")}
          >
            <FileText className="mr-2 h-4 w-4" />
            {translations.freeCoursesTitle}
          </Button>
        </div>
        
        {/* Course Filter Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-black/5 rounded-full p-1">
              <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white px-6">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>همه دوره‌ها</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white px-6">
                <Star className="h-4 w-4 mr-2" />
                <span>{translations.activeStatus}</span>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white px-6">
                <Award className="h-4 w-4 mr-2" />
                <span>{translations.upcomingStatus}</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white px-6">
                <Clock className="h-4 w-4 mr-2" />
                <span>{translations.completedStatus}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Active Tab Content */}
          <TabsContent value={activeTab} className="mt-0">
            {activeTab === "active" && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{translations.currentlyRunning}</h3>
                <p className="text-gray-600 mb-6">{translations.currentlyRunningDesc}</p>
              </div>
            )}
            
            {activeTab === "upcoming" && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{translations.upcomingCourses}</h3>
                <p className="text-gray-600 mb-6">{translations.upcomingCoursesDesc}</p>
              </div>
            )}
            
            {activeTab === "completed" && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{translations.pastCourses}</h3>
                <p className="text-gray-600 mb-6">{translations.pastCoursesDesc}</p>
              </div>
            )}
            
            {/* Display filtered courses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filterCourses().map((course, index) => (
                <CourseCard
                  key={index}
                  title={course.title}
                  description={course.description}
                  benefits={course.benefits}
                  outcome={course.outcome}
                  isPaid={course.isPaid}
                  slug={course.slug}
                  instructor={course.instructor}
                  instructorLink={course.instructorLink}
                  level={course.level}
                  cta={course.cta}
                  status={course.status as any}
                />
              ))}
            </div>
            
            {filterCourses().length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">هیچ دوره‌ای با فیلترهای انتخابی یافت نشد.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setActiveTab('all');
                    setCourseCategory('all');
                  }}
                >
                  نمایش همه دوره‌ها
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CourseArchive;
