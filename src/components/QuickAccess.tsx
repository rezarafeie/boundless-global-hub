
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Award, MessageSquare, BookOpenCheck, Headphones, BookCheck, MessageCircle, Network } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const QuickAccess = () => {
  const { translations, direction } = useLanguage();
  
  const quickLinks = [
    {
      title: "مرکز آموزش",
      icon: <BookOpen size={28} />,
      link: "/courses",
      color: "text-foreground"
    },
    {
      title: "مرکز سنجش",
      icon: <Award size={28} />,
      link: "/assessment",
      color: "text-foreground"
    },
    {
      title: "مجله",
      icon: <BookCheck size={28} />,
      link: "https://mag.rafiei.co",
      color: "text-foreground",
      external: true
    },
    {
      title: "پشتیبانی",
      icon: <Headphones size={28} />,
      link: "/support",
      color: "text-foreground"
    },
    {
      title: "دستیار هوشمند",
      icon: <MessageSquare size={28} />,
      link: "https://ai.rafiei.co/",
      external: true,
      color: "text-foreground"
    },
    {
      title: "هاب بدون مرز",
      icon: <Network size={28} />,
      link: "/hub",
      color: "text-foreground"
    },
    {
      title: "پیام‌رسان",
      icon: <MessageCircle size={28} />,
      link: "/hub/messenger",
      color: "text-foreground"
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
    <section className="py-10 bg-background">
      <div className="container">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {quickLinks.map((quickLink, index) => (
            <motion.div key={index} variants={itemVariants}>
              {quickLink.external ? (
                <a href={quickLink.link} target="_blank" rel="noopener noreferrer" className="block group h-full">
                  <Card className="h-full rounded-2xl border-border shadow-none transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-soft overflow-hidden bg-card">
                    <CardContent className={`p-4 flex flex-col items-center justify-center text-center h-full ${quickLink.color}`}>
                      <div className="mb-3 p-3 rounded-2xl bg-muted">
                        {quickLink.icon}
                      </div>
                      <p className="font-medium text-sm">{quickLink.title}</p>
                    </CardContent>
                  </Card>
                </a>
              ) : (
                <Link to={quickLink.link} className="block group h-full">
                  <Card className="h-full rounded-2xl border-border shadow-none transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-soft overflow-hidden bg-card">
                    <CardContent className={`p-4 flex flex-col items-center justify-center text-center h-full ${quickLink.color}`}>
                      <div className="mb-3 p-3 rounded-2xl bg-muted">
                        {quickLink.icon}
                      </div>
                      <p className="font-medium text-sm">{quickLink.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default QuickAccess;
