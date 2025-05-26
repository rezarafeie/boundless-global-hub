
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BookOpen, Briefcase, Heart, Clock, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface TestCardProps {
  title: string;
  description: string;
  category: string;
  duration?: string;
  questions?: number;
  slug?: string;
}

const TestCard: React.FC<TestCardProps> = ({ 
  title, 
  description, 
  category, 
  duration, 
  questions, 
  slug 
}) => {
  const { translations, language } = useLanguage();

  // Get icon based on test category
  const getTestIcon = () => {
    if (category.includes("شخصیت") || category.includes("Personality")) {
      return <Brain size={28} className="text-primary" />;
    } else if (category.includes("هوش") || category.includes("Intelligence")) {
      return <BookOpen size={28} className="text-primary" />;
    } else if (category.includes("شغل") || category.includes("Career")) {
      return <Briefcase size={28} className="text-primary" />;
    } else {
      return <Heart size={28} className="text-primary" />;
    }
  };

  // Handle test start
  const handleStartTest = () => {
    if (slug === "test/boundless") {
      window.open("https://auth.rafiei.co/test/boundless", "_blank");
    } else if (slug) {
      window.open(`https://auth.rafiei.co/${slug}`, "_blank");
    }
  };

  return (
    <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-lg group h-full flex flex-col bg-white rounded-xl">
      <CardContent className="p-6 flex-grow">
        <div className="flex flex-row items-start gap-3 mb-4">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center">
            {getTestIcon()}
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
          </div>
        </div>
        
        {(duration || questions) && (
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{duration}</span>
              </div>
            )}
            {questions && (
              <div className="flex items-center gap-1">
                <HelpCircle size={14} />
                <span>{questions} {language === "fa" ? "سؤال" : "questions"}</span>
              </div>
            )}
          </div>
        )}
        
        {slug && (
          <Button 
            onClick={handleStartTest}
            className="w-full bg-black text-white hover:bg-black/90 rounded-full"
          >
            {language === "fa" ? "شروع تست" : translations.startTest}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCard;
