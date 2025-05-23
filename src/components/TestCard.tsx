
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BookOpen, Briefcase, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TestCardProps {
  title: string;
  description: string;
  category: string;
}

const TestCard: React.FC<TestCardProps> = ({ title, description, category }) => {
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

  const { direction } = useLanguage();

  return (
    <Card className={`overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-lg group h-full flex flex-col bg-white rounded-xl`}>
      <CardContent className="p-6">
        <div className="flex flex-row items-start gap-3 mb-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center">
            {getTestIcon()}
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default TestCard;
