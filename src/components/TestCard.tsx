
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BookOpen, Briefcase, Heart, Clock, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface TestCardProps {
  title: string;
  description: string;
  category?: string;
  duration?: string;
  questions?: number;
  slug?: string;
}

const TestCard: React.FC<TestCardProps> = ({ 
  title, 
  description, 
  category = '', 
  duration, 
  questions, 
  slug 
}) => {
  // Get icon based on test category
  const getTestIcon = () => {
    if (category?.includes("شخصیت") || category?.includes("Personality")) {
      return <Brain size={28} className="text-primary" />;
    } else if (category?.includes("هوش") || category?.includes("Intelligence")) {
      return <BookOpen size={28} className="text-primary" />;
    } else if (category?.includes("شغل") || category?.includes("Career")) {
      return <Briefcase size={28} className="text-primary" />;
    } else {
      return <Heart size={28} className="text-primary" />;
    }
  };

  const { direction } = useLanguage();

  const cardContent = (
    <Card className={`overflow-hidden border-border hover:border-primary/20 transition-all shadow-sm hover:shadow-lg group h-full flex flex-col bg-card rounded-xl ${slug ? 'cursor-pointer hover:scale-[1.02]' : ''}`}>
      <CardContent className="p-6">
        <div className="flex flex-row items-start gap-3 mb-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            {getTestIcon()}
          </div>
          <h3 className="text-lg font-bold group-hover:text-primary transition-colors text-card-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        {(duration || questions) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
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
          <div className="mt-auto">
            <div className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md group-hover:bg-primary/90 transition-colors text-sm font-medium text-center">
              مشاهده جزئیات
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Always link to test landing page, never directly to iframe
  if (slug) {
    return (
      <Link to={`/assessment/${slug}`} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default TestCard;
