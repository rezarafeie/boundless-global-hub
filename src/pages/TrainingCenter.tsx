
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TrainingCenter = () => {
  const { translations, setLanguage, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("all");
  const [isCurrentlyRunningOpen, setIsCurrentlyRunningOpen] = useState(true);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isPastOpen, setIsPastOpen] = useState(false);
  
  useEffect(() => {
    setLanguage("fa");
  }, [setLanguage]);

  const courses = [
    // Currently Running
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless",
      category: "business",
      status: "active" as const
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram",
      category: "business",
      status: "active" as const
    },
    // Upcoming
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      slug: "wealth",
      category: "business",
      status: "upcoming" as const
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      slug: "metaverse",
      category: "business",
      status: "upcoming" as const
    },
    // Past
    {
      title: translations.changeProject,
      description: translations.changeProjectDesc,
      benefits: translations.changeProjectBenefits,
      outcome: translations.changeProjectOutcome,
      isPaid: false,
      slug: "change-project",
      category: "self-development",
      status: "completed" as const
    },
    {
      title: translations.americanBusiness,
      description: translations.americanBusinessDesc,
      benefits: translations.americanBusinessBenefits,
      outcome: translations.americanBusinessOutcome,
      isPaid: false,
      slug: "american-business",
      category: "business",
      status: "completed" as const
    }
  ];

  const getFilteredCourses = (status: string, category?: string) => {
    let filtered = courses.filter(course => course.status === status);
    
    if (category && category !== "all") {
      if (category === "free") {
        filtered = filtered.filter(course => !course.isPaid);
      } else {
        filtered = filtered.filter(course => course.category === category);
      }
    }
    
    return filtered;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const childVariants = {
    hidden: { y: 30, opacity: 0 },
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
      {/* Simple Header */}
      <section className="py-12 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">مرکز آموزش</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              مهارت‌های خود را با دوره‌های حرفه‌ای ما ارتقا دهید
            </p>
          </div>
        </div>
      </section>
      
      <section className="py-16">
        <div className="container">
          {/* Filter Buttons */}
          <div className="mb-8">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                <TabsTrigger value="all" onClick={() => setActiveFilter("all")}>همه دوره‌ها</TabsTrigger>
                <TabsTrigger value="self-development" onClick={() => setActiveFilter("self-development")}>توسعه شخصی</TabsTrigger>
                <TabsTrigger value="business" onClick={() => setActiveFilter("business")}>کسب و کار</TabsTrigger>
                <TabsTrigger value="free" onClick={() => setActiveFilter("free")}>دوره‌های رایگان</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Currently Running Courses */}
          <div className="mb-12">
            <Collapsible open={isCurrentlyRunningOpen} onOpenChange={setIsCurrentlyRunningOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl">{translations.currentlyRunning}</CardTitle>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {getFilteredCourses("active", activeFilter === "all" ? undefined : activeFilter).length} دوره
                        </Badge>
                      </div>
                      {isCurrentlyRunningOpen ? <ChevronUp /> : <ChevronDown />}
                    </div>
                    <p className="text-muted-foreground text-right">{translations.currentlyRunningDesc}</p>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {getFilteredCourses("active", activeFilter === "all" ? undefined : activeFilter).map((course, index) => (
                        <motion.div key={index} variants={childVariants}>
                          <CourseCard
                            title={course.title}
                            description={course.description}
                            benefits={course.benefits}
                            outcome={course.outcome}
                            isPaid={course.isPaid}
                            slug={course.slug}
                            status={course.status}
                            category={course.category}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Upcoming Courses */}
          <div className="mb-12">
            <Collapsible open={isUpcomingOpen} onOpenChange={setIsUpcomingOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl">{translations.upcomingCourses}</CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {getFilteredCourses("upcoming", activeFilter === "all" ? undefined : activeFilter).length} دوره
                        </Badge>
                      </div>
                      {isUpcomingOpen ? <ChevronUp /> : <ChevronDown />}
                    </div>
                    <p className="text-muted-foreground text-right">{translations.upcomingCoursesDesc}</p>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {getFilteredCourses("upcoming", activeFilter === "all" ? undefined : activeFilter).map((course, index) => (
                        <motion.div key={index} variants={childVariants}>
                          <CourseCard
                            title={course.title}
                            description={course.description}
                            benefits={course.benefits}
                            outcome={course.outcome}
                            isPaid={course.isPaid}
                            slug={course.slug}
                            status={course.status}
                            category={course.category}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Past Courses */}
          <div className="mb-12">
            <Collapsible open={isPastOpen} onOpenChange={setIsPastOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl">{translations.pastCourses}</CardTitle>
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          {getFilteredCourses("completed", activeFilter === "all" ? undefined : activeFilter).length} دوره
                        </Badge>
                      </div>
                      {isPastOpen ? <ChevronUp /> : <ChevronDown />}
                    </div>
                    <p className="text-muted-foreground text-right">{translations.pastCoursesDesc}</p>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {getFilteredCourses("completed", activeFilter === "all" ? undefined : activeFilter).map((course, index) => (
                        <motion.div key={index} variants={childVariants}>
                          <CourseCard
                            title={course.title}
                            description={course.description}
                            benefits={course.benefits}
                            outcome={course.outcome}
                            isPaid={course.isPaid}
                            slug={course.slug}
                            status={course.status}
                            category={course.category}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default TrainingCenter;
