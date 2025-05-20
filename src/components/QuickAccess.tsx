
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, BookOpenCheck, Award, MessageSquare, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const QuickAccess = () => {
  const { translations, direction } = useLanguage();
  
  const quickLinks = [
    {
      title: translations.paidCoursesTitle,
      icon: <BookOpen size={32} />,
      link: "/paid-courses",
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: translations.freeCoursesTitle,
      icon: <BookOpenCheck size={32} />,
      link: "/free-courses",
      color: "bg-green-50 text-green-700"
    },
    {
      title: translations.assessmentCenterTitle,
      icon: <Award size={32} />,
      link: "/assessment-center",
      color: "bg-purple-50 text-purple-700"
    },
    {
      title: translations.aiAssistantTitle,
      icon: <MessageSquare size={32} />,
      link: "/ai-assistant",
      color: "bg-amber-50 text-amber-700"
    },
    {
      title: translations.specialOffersTitle || "Special Offers",
      icon: <Gift size={32} />,
      link: "/special-offers",
      color: "bg-red-50 text-red-700"
    }
  ];

  return (
    <section className="py-10 bg-white">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickLinks.map((item, index) => (
            <Link key={index} to={item.link} className="block group">
              <Card className="h-full border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 overflow-hidden">
                <CardContent className={`p-4 flex flex-col items-center justify-center text-center h-full ${item.color}`}>
                  <div className="mb-3 p-3 rounded-full bg-white/80 backdrop-blur">
                    {item.icon}
                  </div>
                  <p className="font-medium">{item.title}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccess;
