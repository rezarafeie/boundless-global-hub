
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseStatusBadge from "@/components/CourseStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Course {
  title: string;
  description: string;
  benefits: string;
  outcome: string;
  isPaid: boolean;
  slug: string;
  category: string;
  status: "active" | "upcoming" | "past";
}

const CourseArchive = () => {
  const { translations } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");

  const courses: Course[] = [
    // Active courses
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      slug: "boundless",
      category: "business",
      status: "active"
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      slug: "instagram",
      category: "social",
      status: "active"
    },
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      slug: "boundless-taste",
      category: "business",
      status: "active"
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      slug: "passive-income",
      category: "tech",
      status: "active"
    },
    // Upcoming courses
    {
      title: "دوره هوش تجاری",
      description: "آشنایی با اصول هوش تجاری و تحلیل داده‌ها برای تصمیم‌گیری‌های کسب‌وکار",
      benefits: "یادگیری تحلیل داده‌های کسب‌وکار و ساخت داشبوردهای مدیریتی",
      outcome: "توانایی استفاده از هوش تجاری برای بهبود عملکرد کسب‌وکار",
      isPaid: true,
      slug: "business-intelligence",
      category: "business",
      status: "upcoming"
    },
    {
      title: "کسب‌وکار در مارکت‌پلیس‌ها",
      description: "آموزش جامع کسب درآمد از طریق فروش محصولات دیجیتال در مارکت‌پلیس‌های بین‌المللی",
      benefits: "یادگیری اصول طراحی و فروش محصولات دیجیتال در پلتفرم‌های جهانی",
      outcome: "راه‌اندازی کسب‌وکار دیجیتالی در مارکت‌پلیس‌های معتبر",
      isPaid: true,
      slug: "marketplace-business",
      category: "business",
      status: "upcoming"
    },
    // Past courses
    {
      title: "وبینار آینده کسب‌وکارها",
      description: "معرفی روندهای آینده کسب‌وکارها و فرصت‌های نوظهور در دنیای دیجیتال",
      benefits: "آشنایی با تکنولوژی‌های آینده و تاثیر آنها بر کسب‌وکارها",
      outcome: "دید استراتژیک نسبت به آینده صنایع مختلف",
      isPaid: false,
      slug: "future-seminar",
      category: "business",
      status: "past"
    },
    {
      title: "دوره رایگان ثروت",
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: false,
      slug: "wealth",
      category: "finance",
      status: "past"
    }
  ];

  // Filter courses based on active tab
  const getFilteredCourses = () => {
    switch (activeTab) {
      case "active":
        return courses.filter(course => course.status === "active");
      case "upcoming":
        return courses.filter(course => course.status === "upcoming");
      case "past":
        return courses.filter(course => course.status === "past");
      case "paid":
        return courses.filter(course => course.isPaid);
      case "free":
        return courses.filter(course => !course.isPaid);
      case "business":
      case "tech":
      case "social":
      case "finance":
      case "personal":
        return courses.filter(course => course.category === activeTab);
      default:
        return courses;
    }
  };

  const filteredCourses = getFilteredCourses();

  // Group courses by status for the "all" tab
  const activeCourses = courses.filter(course => course.status === "active");
  const upcomingCourses = courses.filter(course => course.status === "upcoming");
  const pastCourses = courses.filter(course => course.status === "past");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
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

  const renderCourseCard = (course: Course) => (
    <motion.div key={course.slug} variants={itemVariants} className="h-full">
      <Card className="h-full border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 overflow-hidden relative">
        <div className="absolute top-3 left-3 z-10">
          <CourseStatusBadge status={course.isPaid ? "paid" : "free"} />
        </div>
        <CardContent className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-black/70" />
            </div>
            <h3 className="text-xl font-bold mb-2">{course.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
          </div>
          
          <div className="mt-auto">
            <Button asChild className="w-full bg-black hover:bg-black/90 text-white">
              <Link to={`/courses/${course.slug}`}>
                مشاهده دوره
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <MainLayout>
      <Hero
        title="مرکز آموزش"
        subtitle="دوره‌های تخصصی آکادمی رفیعی برای کسب مهارت‌های کاربردی در عصر دیجیتال"
        ctaText="مشاهده دوره‌ها"
        ctaLink="#courses"
        backgroundType="glow"
      />
      
      <section id="courses" className="py-16 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-b before:from-background before:to-secondary/5 before:z-0">
        <div className="container relative z-10">
          <SectionTitle
            title="مرکز آموزش"
            subtitle="دوره‌های تخصصی آکادمی رفیعی"
          />
          
          <Tabs defaultValue="all" className="w-full mb-8">
            <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-7">
              <TabsTrigger value="all" onClick={() => setActiveTab("all")}>همه</TabsTrigger>
              <TabsTrigger value="active" onClick={() => setActiveTab("active")}>در حال اجرا</TabsTrigger>
              <TabsTrigger value="upcoming" onClick={() => setActiveTab("upcoming")}>به زودی</TabsTrigger>
              <TabsTrigger value="past" onClick={() => setActiveTab("past")}>گذشته</TabsTrigger>
              <TabsTrigger value="paid" onClick={() => setActiveTab("paid")}>ویژه</TabsTrigger>
              <TabsTrigger value="free" onClick={() => setActiveTab("free")}>رایگان</TabsTrigger>
              <TabsTrigger value="business" onClick={() => setActiveTab("business")}>کسب‌وکار</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {activeTab === "all" ? (
            <>
              {/* Active Courses Section */}
              {activeCourses.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center mb-6">
                    <h2 className="text-2xl font-bold">دوره‌های در حال اجرا</h2>
                    <CourseStatusBadge status="active" className="mr-2" />
                  </div>
                  
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key="active-courses"
                  >
                    {activeCourses.map(course => renderCourseCard(course))}
                  </motion.div>
                </div>
              )}
              
              {/* Upcoming Courses Section */}
              {upcomingCourses.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center mb-6">
                    <h2 className="text-2xl font-bold">دوره‌های آینده</h2>
                    <CourseStatusBadge status="upcoming" className="mr-2" />
                  </div>
                  
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key="upcoming-courses"
                  >
                    {upcomingCourses.map(course => renderCourseCard(course))}
                  </motion.div>
                </div>
              )}
              
              {/* Past Courses Section */}
              {pastCourses.length > 0 && (
                <div>
                  <div className="flex items-center mb-6">
                    <h2 className="text-2xl font-bold">دوره‌های گذشته</h2>
                    <CourseStatusBadge status="past" className="mr-2" />
                  </div>
                  
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key="past-courses"
                  >
                    {pastCourses.map(course => renderCourseCard(course))}
                  </motion.div>
                </div>
              )}
            </>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={activeTab}
            >
              {filteredCourses.map(course => renderCourseCard(course))}
            </motion.div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default CourseArchive;
