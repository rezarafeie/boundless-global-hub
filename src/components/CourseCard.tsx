
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthModal from "./Auth/AuthModal";
import { BookOpen, Code, DollarSign, Graduation, GraduationCap, Search, Star } from "lucide-react";

interface CourseCardProps {
  title: string;
  description: string;
  benefits: string;
  outcome: string;
  isPaid?: boolean;
  englishTitle?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  benefits,
  outcome,
  isPaid = false,
  englishTitle = "",
}) => {
  const { translations } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get an appropriate icon based on the course title
  const getCourseIcon = () => {
    if (title.includes("متاورس") || title.includes("Metaverse")) {
      return <Code size={36} className="text-primary" />;
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Search size={36} className="text-primary" />;
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return <DollarSign size={36} className="text-primary" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless")) {
      return <GraduationCap size={36} className="text-primary" />;
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return <Star size={36} className="text-primary" />;
    } else {
      return <BookOpen size={36} className="text-primary" />;
    }
  };

  return (
    <>
      <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md group h-full flex flex-col bg-white">
        <div className="overflow-hidden aspect-video relative bg-black/5 flex items-center justify-center">
          {getCourseIcon()}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-end">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{title}</h3>
              {englishTitle && (
                <p className="text-sm text-white/80">{englishTitle}</p>
              )}
            </div>
          </div>
          <Badge
            variant={isPaid ? "default" : "outline"}
            className="absolute top-3 right-3 z-10 bg-white text-black border-black/10"
          >
            {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
          </Badge>
        </div>
        
        <CardContent className="p-6 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
          
          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <span className="font-medium">✓ </span>
              {benefits}
            </div>
            <div className="text-sm">
              <span className="font-medium">→ </span>
              {outcome}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-6 pt-0">
          <Button 
            className="w-full bg-black text-white hover:bg-black/90 rounded-full transition-all"
            onClick={() => setShowAuthModal(true)}
          >
            {isPaid ? translations.startCourse : translations.startFreeCourse}
          </Button>
        </CardFooter>
      </Card>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        courseTitle={title}
        isPaid={isPaid || false}
      />
    </>
  );
};

export default CourseCard;
