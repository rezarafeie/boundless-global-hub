
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, BookOpenCheck, Award, MessageSquare, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const QuickAccess = () => {
  const { translations, direction } = useLanguage();
  
  const quickLinks = [
    {
      title: translations.coursesTitle,
      icon: <BookOpen size={28} />,
      link: "/courses",
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: translations.freeCoursesTitle,
      icon: <BookOpenCheck size={28} />,
      link: "/courses?filter=free",
      color: "bg-green-50 text-green-700"
    },
    {
      title: translations.assessmentCenterTitle,
      icon: <Award size={28} />,
      link: "/assessment-center",
      color: "bg-purple-50 text-purple-700"
    },
    {
      title: translations.aiAssistantTitle,
      icon: <MessageSquare size={28} />,
      link: "/ai-assistant",
      color: "bg-amber-50 text-amber-700"
    },
    {
      title: "Special Offers",
      icon: <Gift size={28} />,
      link: "/courses?filter=special",
      color: "bg-red-50 text-red-700"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <section className="py-10 bg-white">
      <div className="container">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-5 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {quickLinks.map((item, index) => (
            <motion.div key={index} variants={item}>
              <Link to={item.link} className="block group h-full">
                <Card className="h-full border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 overflow-hidden">
                  <CardContent className={`p-4 flex flex-col items-center justify-center text-center h-full ${item.color}`}>
                    <div className="mb-3 p-2 rounded-full bg-white/80 backdrop-blur">
                      {item.icon}
                    </div>
                    <p className="font-medium text-sm md:text-base">{item.title}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default QuickAccess;
