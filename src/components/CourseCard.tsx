
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, Clock, Users, Award, CheckCircle, Globe, HeadphonesIcon, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  // Get an appropriate icon based on the course title
  const getCourseIcon = () => {
    if (title.includes("متاورس") || title.includes("Metaverse")) {
      return <Code size={24} className="text-white" />;
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Search size={24} className="text-white" />;
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return <DollarSign size={24} className="text-white" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless") || title.includes("شروع")) {
      return <GraduationCap size={24} className="text-white" />;
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return <Star size={24} className="text-white" />;
    } else {
      return <BookOpen size={24} className="text-white" />;
    }
  };

  // Get gradient based on course type
  const getGradient = () => {
    if (title.includes("متاورس") || title.includes("Metaverse")) {
      return "from-purple-500 via-pink-500 to-red-500";
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return "from-purple-600 via-pink-600 to-red-500";
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return "from-green-500 via-emerald-500 to-teal-500";
    } else if (title.includes("بدون مرز") || title.includes("Boundless") || title.includes("شروع")) {
      return "from-blue-500 via-indigo-500 to-purple-500";
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return "from-orange-500 via-amber-500 to-yellow-500";
    } else {
      return "from-gray-500 via-gray-600 to-gray-700";
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

  // Get status badge color
  const getStatusBadgeColor = () => {
    switch(status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
      default:
        return "";
    }
  };

  return (
    <Card 
      className="group h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      
      {/* Hero Header with Gradient */}
      <div className={`relative p-6 bg-gradient-to-br ${getGradient()} text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              {getCourseIcon()}
            </div>
            <div>
              <Badge
                variant={isPaid ? "secondary" : "outline"}
                className={`${
                  isPaid 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'bg-white/10 text-white border-white/30'
                } text-xs font-medium`}
              >
                {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
              </Badge>
            </div>
          </div>
          {status && (
            <Badge className={`text-xs ${getStatusBadgeColor()}`}>
              {status === "active" && translations.activeStatus}
              {status === "upcoming" && translations.upcomingStatus}
              {status === "completed" && translations.completedStatus}
            </Badge>
          )}
        </div>
        
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{title}</h3>
          {englishTitle && (
            <p className="text-sm text-white/80 mb-3">{englishTitle}</p>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>
      
      <CardContent className="p-6 pt-4 flex-grow flex flex-col">
        <p className="text-sm text-muted-foreground dark:text-gray-300 line-clamp-3 mb-4">{description}</p>
        
        <div className="space-y-3 mb-6 flex-grow">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-foreground dark:text-gray-200">{benefits}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <ArrowLeft size={16} className="text-blue-500 mt-0.5 flex-shrink-0 rtl:rotate-180" />
            <span className="text-foreground dark:text-gray-200">{outcome}</span>
          </div>
        </div>

        {/* Course Features */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Clock size={16} className="text-primary mb-1" />
            <span className="text-xs text-center text-muted-foreground dark:text-gray-400">دسترسی آزاد</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users size={16} className="text-primary mb-1" />
            <span className="text-xs text-center text-muted-foreground dark:text-gray-400">انجمن</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Award size={16} className="text-primary mb-1" />
            <span className="text-xs text-center text-muted-foreground dark:text-gray-400">گواهی</span>
          </div>
        </div>

        {/* Additional Features for Paid Courses */}
        {isPaid && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex flex-col items-center p-2 bg-primary/5 dark:bg-primary/10 rounded-lg">
              <HeadphonesIcon size={14} className="text-primary mb-1" />
              <span className="text-xs text-center text-primary dark:text-primary">پشتیبانی</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-primary/5 dark:bg-primary/10 rounded-lg">
              <Globe size={14} className="text-primary mb-1" />
              <span className="text-xs text-center text-primary dark:text-primary">آنلاین</span>
            </div>
          </div>
        )}
        
        {instructor && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-300 mb-4">
            <User size={14} />
            <span>{instructor}</span>
            {level && (
              <Badge variant="outline" className="text-xs border-border dark:border-gray-600 dark:text-gray-300">
                {level}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button 
          onClick={handleCtaClick}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-xl transition-all duration-300 group-hover:shadow-lg"
        >
          <Sparkles size={16} className="ml-2" />
          {cta || (isPaid ? "مشاهده دوره" : translations.startFreeCourse)}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
