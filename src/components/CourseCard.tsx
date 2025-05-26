
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, Clock, Users, Award, CheckCircle, Globe, HeadphonesIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
      return <Code size={20} className="text-primary" />;
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Search size={20} className="text-primary" />;
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return <DollarSign size={20} className="text-primary" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless")) {
      return <GraduationCap size={20} className="text-primary" />;
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return <Star size={20} className="text-primary" />;
    } else {
      return <BookOpen size={20} className="text-primary" />;
    }
  };

  // Generate course URL based on type and slug
  const getCourseUrl = () => {
    if (link) return link;
    if (isPaid) {
      // Map course titles/slugs to correct URLs
      if (slug === "boundless" || title.includes("بدون مرز") || title.includes("Boundless")) {
        return "/courses/boundless";
      } else if (slug === "instagram" || title.includes("اینستاگرام") || title.includes("Instagram")) {
        return "/courses/instagram";
      } else if (slug === "metaverse" || title.includes("متاورس") || title.includes("Metaverse")) {
        return "/courses/metaverse";
      } else if (slug === "wealth" || slug === "servat" || title.includes("ثروت") || title.includes("Wealth")) {
        return "/courses/servit";
      } else {
        // Generic paid course page
        return `/courses/${slug}`;
      }
    } else {
      // Free courses go to their course pages
      return `/course/${slug}`;
    }
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
        return "bg-green-100 text-green-800 border-green-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "";
    }
  };

  return (
    <Link to={getCourseUrl()} className="block h-full group">
      <Card className="overflow-hidden border-border hover:border-primary/20 transition-all shadow-sm hover:shadow-lg h-full flex flex-col bg-card rounded-xl">
        
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted">
              {getCourseIcon()}
            </div>
            <div className="ml-3">
              <Badge
                variant={isPaid ? "default" : "outline"}
                className={`${isPaid ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border-border'} text-xs`}
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
        
        <CardContent className="p-4 pt-0 flex-grow">
          <h3 className="text-xl font-bold text-card-foreground mb-2">{title}</h3>
          {englishTitle && (
            <p className="text-sm text-muted-foreground mb-2">{englishTitle}</p>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{description}</p>
          
          <div className="space-y-3 mb-4">
            <div className="text-sm text-card-foreground">
              <span className="font-medium">✓ </span>
              {benefits}
            </div>
            <div className="text-sm text-card-foreground">
              <span className="font-medium">→ </span>
              {outcome}
            </div>
          </div>

          {/* Course Features */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>دسترسی آزاد</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>انجمن</span>
            </div>
            <div className="flex items-center gap-1">
              <Award size={12} />
              <span>گواهی</span>
            </div>
          </div>

          {/* Additional Features for Paid Courses */}
          {isPaid && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <HeadphonesIcon size={12} />
                <span>پشتیبانی</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe size={12} />
                <span>آنلاین</span>
              </div>
            </div>
          )}
          
          {instructor && (
            <div className="flex items-center mt-3 pb-2 text-sm text-muted-foreground">
              <User size={14} className="mr-1" />
              {instructorLink ? (
                <Link to={instructorLink} onClick={(e) => e.stopPropagation()} className="hover:text-primary hover:underline">
                  {instructor}
                </Link>
              ) : (
                <span>{instructor}</span>
              )}
              {level && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {level}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={handleCtaClick}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-all"
          >
            {cta || (isPaid ? "مشاهده دوره" : translations.startFreeCourse)}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CourseCard;
