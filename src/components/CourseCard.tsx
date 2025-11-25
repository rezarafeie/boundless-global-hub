
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, Clock, Users, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import BlackFridayBadge from "@/components/BlackFriday/BlackFridayBadge";

interface CourseCardProps {
  title: string;
  description: string;
  benefits: string;
  outcome: string;
  isPaid?: boolean;
  englishTitle?: string;
  slug?: string;
  instructor?: string;
  instructorLink?: string;
  level?: string;
  cta?: string;
  status?: "active" | "upcoming" | "completed";
  category?: "business" | "self-development" | "free";
  image?: string;
  cartUrl?: string;
  link?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  benefits,
  outcome,
  isPaid = false,
  englishTitle = "",
  slug = "",
  instructor = "",
  instructorLink = "",
  level = "",
  cta = "",
  status,
  category,
  image,
  cartUrl,
  link
}) => {
  const { translations } = useLanguage();
  const navigate = useNavigate();
  const { isActive: isBlackFridayActive, getCourseDiscount } = useBlackFridayContext();
  
  // Get Black Friday discount for this course if active
  const blackFridayDiscount = isBlackFridayActive && slug ? getCourseDiscount(slug) : 0;

  // Get an appropriate icon based on the course title
  const getCourseIcon = () => {
    if (title.includes("متاورس") || title.includes("Metaverse")) {
      return <Code size={20} className="text-purple-500" />;
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Search size={20} className="text-pink-500" />;
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return <DollarSign size={20} className="text-green-500" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless") || title.includes("شروع")) {
      return <GraduationCap size={20} className="text-blue-500" />;
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return <Star size={20} className="text-orange-500" />;
    } else {
      return <BookOpen size={20} className="text-indigo-500" />;
    }
  };

  // Generate course URL based on type and slug
  const getCourseUrl = () => {
    if (link) return link;
    if (isPaid) {
      if (slug === "boundless" || title.includes("بدون مرز") || title.includes("Boundless") || title.includes("شروع")) {
        return "/courses/boundless";
      } else if (slug === "instagram" || title.includes("اینستاگرام") || title.includes("Instagram")) {
        return "/courses/instagram";
      } else if (slug === "metaverse" || title.includes("متاورس") || title.includes("Metaverse")) {
        return "/courses/metaverse";
      } else if (slug === "wealth" || slug === "servat" || title.includes("ثروت") || title.includes("Wealth")) {
        return "/courses/servit";
      } else {
        return `/courses/${slug}`;
      }
    } else {
      return `/course/${slug}`;
    }
  };

  // Handle card click
  const handleCardClick = () => {
    const targetUrl = getCourseUrl();
    navigate(targetUrl);
  };

  // Handle CTA button click
  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const targetUrl = getCourseUrl();
    navigate(targetUrl);
  };

  return (
    <Card 
      className="group h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      
      {/* Clean Header */}
      <div className="relative p-6 pb-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
              {getCourseIcon()}
            </div>
            <Badge
              variant="outline"
              className="text-xs font-medium border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
            >
              {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
            </Badge>
            {/* Black Friday Badge */}
            {blackFridayDiscount > 0 && (
              <BlackFridayBadge discount={blackFridayDiscount} className="text-xs scale-75" />
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{title}</h3>
          {englishTitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{englishTitle}</p>
          )}
        </div>
      </div>
      
      <CardContent className="p-6 pt-4 flex-grow flex flex-col">
        {/* Fixed height description container - consistent across all cards */}
        <div className="h-12 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{description}</p>
        </div>
        
        {/* Fixed height benefits section - consistent layout */}
        <div className="space-y-3 mb-6 flex-grow min-h-[80px]">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-200 line-clamp-2 leading-relaxed">{benefits}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <ArrowLeft size={14} className="text-blue-500 mt-0.5 flex-shrink-0 rtl:rotate-180" />
            <span className="text-gray-700 dark:text-gray-200 line-clamp-2 leading-relaxed">{outcome}</span>
          </div>
        </div>

        {/* Course Features - minimal design */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Clock size={14} className="text-gray-500 mb-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">دسترسی آزاد</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Users size={14} className="text-gray-500 mb-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">انجمن</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <CheckCircle size={14} className="text-gray-500 mb-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">گواهی</span>
          </div>
        </div>
        
        {instructor && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <User size={12} />
            <span>{instructor}</span>
            {level && (
              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
                {level}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button 
          onClick={handleCtaClick}
          className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 text-white rounded-lg transition-all duration-300"
        >
          <Sparkles size={16} className="ml-2" />
          {cta || (isPaid ? "مشاهده دوره" : translations.startFreeCourse)}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
