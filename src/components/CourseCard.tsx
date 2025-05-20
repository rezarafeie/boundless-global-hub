
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  title: string;
  description: string;
  benefits: string;
  outcome: string;
  isPaid?: boolean;
  englishTitle?: string;
  slug?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  benefits,
  outcome,
  isPaid = false,
  englishTitle = "",
  slug = ""
}) => {
  const { translations } = useLanguage();

  // Get an appropriate icon based on the course title
  const getCourseIcon = () => {
    if (title.includes("متاورس") || title.includes("Metaverse")) {
      return <Code size={28} className="text-primary" />;
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Search size={28} className="text-primary" />;
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return <DollarSign size={28} className="text-primary" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless")) {
      return <GraduationCap size={28} className="text-primary" />;
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return <Star size={28} className="text-primary" />;
    } else {
      return <BookOpen size={28} className="text-primary" />;
    }
  };

  // Generate a slug if not provided
  const courseSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  
  // Generate course detail URL based on whether it's paid or free
  const courseDetailUrl = isPaid 
    ? `/courses/${courseSlug}` 
    : `/free-courses/${courseSlug}`;

  return (
    <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-lg group h-full flex flex-col bg-white rounded-xl">
      <div className="p-4 flex items-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/5">
          {getCourseIcon()}
        </div>
        <div className="ml-3">
          <Badge
            variant={isPaid ? "default" : "outline"}
            className="bg-white text-black border-black/10 text-xs"
          >
            {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 pt-0 flex-grow">
        <h3 className="text-xl font-bold text-black mb-2">{title}</h3>
        {englishTitle && (
          <p className="text-sm text-black/60 mb-2">{englishTitle}</p>
        )}
        
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
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-black text-white hover:bg-black/90 rounded-full transition-all"
          asChild
        >
          <Link to={courseDetailUrl}>
            {isPaid ? translations.startCourse : translations.startFreeCourse}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
