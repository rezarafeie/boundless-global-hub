
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "./Auth/AuthModal";

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
  courseId?: string;
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
  courseId
}) => {
  const { translations, language } = useLanguage();
  const { user, activateCourse } = useAuth();
  const navigate = useNavigate();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  // Generate a slug if not provided
  const courseSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  
  // Generate course URL - Fixed routing to use proper course detail pages
  const courseUrl = isPaid ? `/course/paid/${courseSlug}` : `/courses/${courseSlug}`;
  
  // Generate course ID if not provided
  const id = courseId || courseSlug;

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

  const handleStartCourse = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is logged in, activate course
    if (user) {
      await activateCourse(id, title, isPaid);
    } else {
      // Show auth modal
      setIsAuthModalOpen(true);
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <>
      <Link to={courseUrl} className="block h-full group">
        <Card className={`overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-lg h-full flex flex-col bg-white rounded-xl ${language === 'fa' ? 'text-right' : 'text-left'}`}>
          <div className={`p-4 flex items-center justify-between ${language === 'fa' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex items-center ${language === 'fa' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5">
                {getCourseIcon()}
              </div>
              <div className={language === 'fa' ? 'mr-3' : 'ml-3'}>
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
                {status === "active" && (language === 'fa' ? 'در حال اجرا' : translations.activeStatus)}
                {status === "upcoming" && (language === 'fa' ? 'آینده' : translations.upcomingStatus)}
                {status === "completed" && (language === 'fa' ? 'تمام شده' : translations.completedStatus)}
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
              <div className={`text-sm flex items-start gap-2 ${language === 'fa' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>{benefits}</span>
              </div>
              <div className={`text-sm flex items-start gap-2 ${language === 'fa' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                <Star size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <span>{outcome}</span>
              </div>
            </div>
            
            {instructor && (
              <div className={`flex items-center mt-3 pb-2 text-sm text-gray-600 ${language === 'fa' ? 'flex-row-reverse' : 'flex-row'}`}>
                <User size={14} className={language === 'fa' ? 'ml-1' : 'mr-1'} />
                {instructorLink ? (
                  <Link to={instructorLink} onClick={(e) => e.stopPropagation()} className="hover:text-primary hover:underline">
                    {instructor}
                  </Link>
                ) : (
                  <span>{instructor}</span>
                )}
                {level && (
                  <Badge variant="outline" className={`text-xs ${language === 'fa' ? 'mr-2' : 'ml-2'}`}>
                    {level}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            <Button 
              className="w-full bg-black text-white hover:bg-black/90 rounded-full transition-all"
              onClick={handleStartCourse}
            >
              {cta || (isPaid ? translations.startCourse : translations.startFreeCourse)}
            </Button>
          </CardFooter>
        </Card>
      </Link>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        courseTitle={title}
        isPaid={isPaid}
        courseId={id}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default CourseCard;
