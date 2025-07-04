import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import IframeModal from "@/components/IframeModal";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, Award, BarChart3 } from "lucide-react";

const PaidCourses = () => {
  const { translations } = useLanguage();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showIframeModal, setShowIframeModal] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");

  const courses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
      category: "business",
      duration: "6 months",
      modules: 12,
      students: 450,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=5311",
      features: [
        "100+ hours of content",
        "180 daily tasks",
        "Business coaching",
        "Psychological coaching",
        "Live sessions",
        "Private community",
        "Lifetime access"
      ]
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      category: "social",
      duration: "4 weeks",
      modules: 6,
      students: 850,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=5089",
      features: [
        "Content creation strategies",
        "Ad campaign setup",
        "Branding essentials",
        "Sales techniques",
        "Analytics mastery",
        "Case studies",
        "Templates included"
      ]
    },
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      category: "finance",
      duration: "8 weeks",
      modules: 8,
      students: 620,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=148",
      features: [
        "Financial planning",
        "Investment strategies",
        "Wealth mindset training",
        "Asset management",
        "Risk management",
        "Tax optimization",
        "Retirement planning"
      ]
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80",
      category: "tech",
      duration: "10 weeks",
      modules: 10,
      students: 380,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=145",
      features: [
        "Web3 fundamentals",
        "NFT creation & trading",
        "Play-to-Earn strategies",
        "Crypto investment",
        "Metaverse business",
        "Digital asset security",
        "Future trends analysis"
      ]
    },
  ];

  const filteredCourses = activeTab === "all" 
    ? courses 
    : courses.filter(course => course.category === activeTab);

  const handleCourseClick = (title: string, cartUrl: string) => {
    setSelectedCourse(title);
    setIframeUrl(cartUrl);
    setShowIframeModal(true);
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

  return (
    <MainLayout>
      <Hero
        title={translations.paidCoursesTitle}
        subtitle={translations.paidCoursesSubtitle}
        ctaText={translations.callToAction}
        ctaLink="#courses"
        backgroundType="glow"
      />
      
      <section id="courses" className="py-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent z-0"></div>
        <div className="absolute top-1/3 right-0 w-1/3 h-2/3 bg-gradient-to-l from-secondary/10 to-transparent z-0"></div>
        
        <div className="container relative z-10">
          <SectionTitle
            title={translations.coursesTitle}
            subtitle={translations.coursesSubtitle}
          />
          
          <Tabs defaultValue="all" className="w-full mb-8">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-5">
              <TabsTrigger value="all" onClick={() => setActiveTab("all")}>All</TabsTrigger>
              <TabsTrigger value="business" onClick={() => setActiveTab("business")}>Business</TabsTrigger>
              <TabsTrigger value="social" onClick={() => setActiveTab("social")}>Social</TabsTrigger>
              <TabsTrigger value="finance" onClick={() => setActiveTab("finance")}>Finance</TabsTrigger>
              <TabsTrigger value="tech" onClick={() => setActiveTab("tech")}>Tech</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeTab}
          >
            {filteredCourses.map((course, index) => (
              <motion.div key={index} variants={childVariants} className="h-full">
                <div 
                  className="h-full group cursor-pointer" 
                  onClick={() => handleCourseClick(course.title, course.cartUrl)}
                >
                  <div className="h-full bg-card border border-primary/10 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/30">
                    <div className="aspect-video relative">
                      <img 
                        src={course.image} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                        <div className="p-6">
                          <h3 className="text-2xl font-bold text-white">{course.title}</h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <p className="text-muted-foreground">{course.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 py-4">
                        <div className="flex flex-col items-center text-center">
                          <Calendar size={20} className="mb-2 text-primary" />
                          <span className="text-sm text-muted-foreground">{course.duration}</span>
                          <span className="text-xs">Duration</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                          <BarChart3 size={20} className="mb-2 text-primary" />
                          <span className="text-sm text-muted-foreground">{course.modules}</span>
                          <span className="text-xs">Modules</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                          <User size={20} className="mb-2 text-primary" />
                          <span className="text-sm text-muted-foreground">{course.students}+</span>
                          <span className="text-xs">Students</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-4">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Award size={16} className="mr-2 text-primary" />
                          What You'll Get:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {course.features.slice(0, 4).map((feature, i) => (
                            <div key={i} className="flex items-start">
                              <span className="text-primary mr-2">•</span>
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <h4 className="font-semibold mb-2">Outcome:</h4>
                        <p className="text-sm text-muted-foreground">{course.outcome}</p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg text-center">
                        <p className="font-medium">Click to register for this premium course</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title={selectedCourse || "Course Purchase"}
        url={iframeUrl}
      />
    </MainLayout>
  );
};

export default PaidCourses;
