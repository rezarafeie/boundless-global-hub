
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ClipboardCheck, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const QuickAccess = () => {
  const { translations } = useLanguage();

  const quickAccessItems = [
    {
      icon: BookOpen,
      title: translations.courses,
      description: translations.coursesDesc,
      href: "/courses",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: ClipboardCheck,
      title: translations.assessmentCenter,
      description: translations.assessmentCenterDesc,
      href: "/assessment",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: MessageCircle,
      title: "پیام‌رسان بدون مرز",
      description: "ارتباط مستقیم با مشاوران و سایر کاربران",
      href: "/hub/messenger",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {translations.quickAccess}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {translations.quickAccessDesc}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quickAccessItems.map((item, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20">
              <CardContent className="p-8 text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${item.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {item.description}
                </p>
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 group-hover:scale-105 transition-all duration-200">
                  <Link to={item.href}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {translations.getStarted}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccess;
