
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BookOpen, Briefcase, Heart, Clock, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

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

  const handleTestClick = () => {
    if (slug) {
      // Open test in iframe modal or new window
      window.open(`https://auth.rafiei.co/test/${slug}`, '_blank');
    }
  };

  const cardContent = (
    <Card className={`overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-lg group h-full flex flex-col bg-white rounded-xl ${slug ? 'cursor-pointer' : ''}`}>
      <CardContent className="p-6">
        <div className="flex flex-row items-start gap-3 mb-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center">
            {getTestIcon()}
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
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
                <span>{questions} سؤال</span>
              </div>
            )}
          </div>
        )}
        
        {slug && (
          <button 
            onClick={handleTestClick}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium mt-auto"
          >
            شروع تست
          </button>
        )}
      </CardContent>
    </Card>
  );

  return cardContent;
};

export default TestCard;
