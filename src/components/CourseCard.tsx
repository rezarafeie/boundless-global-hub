
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, Users, CheckCircle, ArrowLeft, Sparkles, Instagram, Gem, Gift } from "lucide-react";
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

  // Get enrollment count simulation
  const getEnrollmentCount = () => {
    if (title.includes("بدون مرز") || title.includes("Boundless")) return 2847;
    if (title.includes("اینستاگرام") || title.includes("Instagram")) return 1923;
    if (title.includes("متاورس") || title.includes("Metaverse")) return 1456;
    if (title.includes("ثروت") || title.includes("Wealth")) return 3201;
    if (title.includes("غیرفعال") || title.includes("Passive")) return 4567;
    if (title.includes("تغییر") || title.includes("Change")) return 2134;
    return Math.floor(Math.random() * 3000) + 500;
  };

  // Get watermark icon
  const getWatermarkIcon = () => {
    if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Instagram size={120} className="text-pink-100 dark:text-pink-900/20" />;
    } else if (title.includes("ثروت") || title.includes("Wealth") || title.includes("غیرفعال") || title.includes("Passive")) {
      return <DollarSign size={120} className="text-green-100 dark:text-green-900/20" />;
    } else if (title.includes("متاورس") || title.includes("Metaverse")) {
      return <Code size={120} className="text-purple-100 dark:text-purple-900/20" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless")) {
      return <GraduationCap size={120} className="text-blue-100 dark:text-blue-900/20" />;
    } else {
      return <BookOpen size={120} className="text-gray-100 dark:text-gray-900/20" />;
    }
  };

  // Get course icon
  const getCourseIcon = () => {
    if (title.includes("متاورس") || title.includes("Metaverse")) {
      return <Code size={18} className="text-purple-600" />;
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Instagram size={18} className="text-pink-600" />;
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return <DollarSign size={18} className="text-green-600" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless") || title.includes("شروع")) {
      return <GraduationCap size={18} className="text-blue-600" />;
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return <Star size={18} className="text-orange-600" />;
    } else {
      return <BookOpen size={18} className="text-indigo-600" />;
    }
  };

  // Generate course URL
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

  // Standardize description to consistent length
  const getStandardizedDescription = (desc: string) => {
    const maxLength = 120;
    if (desc.length > maxLength) {
      return desc.substring(0, maxLength).trim() + "...";
    }
    return desc;
  };

  // Get course-specific CTAs
  const getCourseCTA = () => {
    if (cta) return cta;
    if (isPaid) {
      return "شروع کن و به جمع دانشجویان موفق بپیوند";
    } else {
      return "همین حالا رایگان شروع کن";
    }
  };

  const enrollmentCount = getEnrollmentCount();

  return (
    <Card 
      className={`group h-full flex flex-col cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in border-0 ${
        isPaid 
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-black dark:from-gray-800 dark:via-purple-800 dark:to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 dark:from-blue-900/20 dark:via-green-900/20 dark:to-cyan-900/20"
      }`}
      onClick={handleCardClick}
    >
      {/* Watermark Background */}
      <div className="absolute top-4 left-4 opacity-30">
        {getWatermarkIcon()}
      </div>
      
      {/* Header with Badge */}
      <div className="relative p-6 pb-4 z-10">
        <div className="flex justify-center mb-4">
          <Badge
            className={`transform rotate-1 px-4 py-2 text-sm font-bold shadow-lg ${
              isPaid 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400"
            }`}
          >
            {isPaid ? (
              <>
                <Gem size={14} className="ml-1" />
                💎 دوره‌های ویژه آکادمی رفیعی
              </>
            ) : (
              <>
                <Gift size={14} className="ml-1" />
                💸 دوره‌های رایگان آکادمی رفیعی
              </>
            )}
          </Badge>
        </div>
        
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
            isPaid ? "bg-white/10 backdrop-blur-sm" : "bg-white shadow-sm"
          }`}>
            {getCourseIcon()}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-1 line-clamp-2 ${
              isPaid ? "text-white" : "text-gray-900 dark:text-white"
            }`}>
              {title}
            </h3>
            {englishTitle && (
              <p className={`text-sm ${
                isPaid ? "text-purple-200" : "text-gray-600 dark:text-gray-400"
              }`}>
                {englishTitle}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 pt-0 flex-grow flex flex-col z-10">
        {/* Fixed height description */}
        <div className="h-16 mb-4">
          <p className={`text-sm leading-relaxed line-clamp-3 ${
            isPaid ? "text-purple-100" : "text-gray-700 dark:text-gray-300"
          }`}>
            {getStandardizedDescription(description)}
          </p>
        </div>
        
        {/* Benefits section */}
        <div className="space-y-3 mb-4 flex-grow min-h-[100px]">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
            <span className={`line-clamp-2 leading-relaxed ${
              isPaid ? "text-purple-100" : "text-gray-700 dark:text-gray-200"
            }`}>
              {benefits}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <ArrowLeft size={14} className="text-blue-400 mt-0.5 flex-shrink-0 rtl:rotate-180" />
            <span className={`line-clamp-2 leading-relaxed ${
              isPaid ? "text-purple-100" : "text-gray-700 dark:text-gray-200"
            }`}>
              {outcome}
            </span>
          </div>
        </div>

        {/* Instructor info */}
        {instructor && (
          <div className="flex items-center gap-2 text-sm mb-4">
            <User size={12} className={isPaid ? "text-purple-200" : "text-gray-500"} />
            <span className={isPaid ? "text-purple-200" : "text-gray-500 dark:text-gray-400"}>
              {instructor}
            </span>
            {level && (
              <Badge variant="outline" className={`text-xs ${
                isPaid ? "border-purple-300 text-purple-200" : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"
              }`}>
                {level}
              </Badge>
            )}
          </div>
        )}
        
        {/* Enrollment count */}
        <div className="flex items-center gap-2 text-xs mb-4 pb-4 border-b border-gray-200/20">
          <Users size={12} className={isPaid ? "text-purple-300" : "text-gray-500"} />
          <span className={isPaid ? "text-purple-300" : "text-gray-600 dark:text-gray-400"}>
            {enrollmentCount.toLocaleString()} دانشجو تاکنون
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0 z-10">
        <Button 
          onClick={handleCtaClick}
          className={`w-full text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-bold py-3 ${
            isPaid 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          }`}
        >
          <Sparkles size={16} className="ml-2" />
          {getCourseCTA()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
