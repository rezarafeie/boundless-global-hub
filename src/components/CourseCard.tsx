
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import IframeModal from "./IframeModal";

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
  category
}) => {
  const { translations } = useLanguage();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (isPaid) {
      return `/courses/${slug}`;
    } else {
      return `/course/${slug}`;
    }
  };

  // Get iframe URL for paid courses
  const getPaidCourseIframeUrl = () => {
    const urlMapping: Record<string, string> = {
      "boundless": "https://rafeie.com/?add-to-cart=5311",
      "instagram": "https://rafeie.com/?add-to-cart=5089", 
      "wealth": "https://rafeie.com/?add-to-cart=148",
      "metaverse": "https://rafeie.com/?add-to-cart=145"
    };
    
    return urlMapping[slug] || "https://rafeie.com";
  };

  // Handle CTA button click
  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPaid) {
      // For paid courses, open iframe modal with WooCommerce cart
      setIsModalOpen(true);
    } else {
      // For free courses, go to course page
      navigate(`/course/${slug}`);
    }
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
    <>
      <Link to={getCourseUrl()} className="block h-full group">
        <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-lg h-full flex flex-col bg-white rounded-xl">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5">
                {getCourseIcon()}
              </div>
              <div className="ml-3">
                <Badge
                  variant={isPaid ? "default" : "outline"}
                  className={`${isPaid ? 'bg-black text-white' : 'bg-white text-black border-black/10'} text-xs`}
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
            
            {instructor && (
              <div className="flex items-center mt-3 pb-2 text-sm text-gray-600">
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
              className="w-full bg-black text-white hover:bg-black/90 rounded-full transition-all"
            >
              {cta || (isPaid ? "خرید دوره" : translations.startFreeCourse)}
            </Button>
          </CardFooter>
        </Card>
      </Link>

      {/* Iframe Modal for Paid Courses */}
      {isPaid && (
        <IframeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`خرید دوره ${title}`}
          url={getPaidCourseIframeUrl()}
          height="700px"
        />
      )}
    </>
  );
};

export default CourseCard;
