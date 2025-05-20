
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Award, MessageSquare, BookOpenCheck, Headphones, BookCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const QuickAccess = () => {
  const { translations, direction } = useLanguage();
  
  const quickLinks = [
    {
      title: "مرکز آموزش",
      icon: <BookOpen size={28} />,
      link: "/courses",
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "مرکز سنجش",
      icon: <Award size={28} />,
      link: "/assessment-center",
      color: "bg-purple-50 text-purple-700"
    },
    {
      title: "مجله",
      icon: <BookCheck size={28} />,
      link: "/blog",
      color: "bg-green-50 text-green-700"
    },
    {
      title: "پشتیبانی",
      icon: <Headphones size={28} />,
      link: "/support",
      color: "bg-amber-50 text-amber-700"
    },
    {
      title: "دستیار هوشمند",
      icon: <MessageSquare size={28} />,
      link: "/ai-assistant",
      color: "bg-pink-50 text-pink-700"
    },
    {
      title: "برنامه بدون مرز",
      icon: <BookOpenCheck size={28} />,
      link: "/boundless",
      color: "bg-indigo-50 text-indigo-700"
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

  const itemVariants = {
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
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {quickLinks.map((quickLink, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Link to={quickLink.link} className="block group h-full">
                <Card className="h-full border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 overflow-hidden">
                  <CardContent className={`p-4 flex flex-col items-center justify-center text-center h-full ${quickLink.color}`}>
                    <div className="mb-3 p-3 rounded-full bg-white/80 backdrop-blur">
                      {quickLink.icon}
                    </div>
                    <p className="font-medium text-sm md:text-base">{quickLink.title}</p>
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
