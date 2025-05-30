
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
      return <Instagram size={100} className="text-gray-100 dark:text-gray-800/30" />;
    } else if (title.includes("ثروت") || title.includes("Wealth") || title.includes("غیرفعال") || title.includes("Passive")) {
      return <DollarSign size={100} className="text-gray-100 dark:text-gray-800/30" />;
    } else if (title.includes("متاورس") || title.includes("Metaverse")) {
      return <Code size={100} className="text-gray-100 dark:text-gray-800/30" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless")) {
      return <GraduationCap size={100} className="text-gray-100 dark:text-gray-800/30" />;
    } else {
      return <BookOpen size={100} className="text-gray-100 dark:text-gray-800/30" />;
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
      className={`group h-full flex flex-col cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in border ${
        isPaid 
          ? "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-gray-200 dark:border-gray-700"
          : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700"
      }`}
      onClick={handleCardClick}
    >
      {/* Watermark Background */}
      <div className="absolute top-4 right-4 opacity-20">
        {getWatermarkIcon()}
      </div>
      
      {/* Header with Badge */}
      <div className="relative p-6 pb-4 z-10">
        <div className="flex justify-center mb-4">
          <Badge
            className={`px-4 py-2 text-sm font-bold shadow-sm ${
              isPaid 
                ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-emerald-600 text-white dark:bg-emerald-500"
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
            isPaid ? "bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700" : "bg-white dark:bg-emerald-800 border border-emerald-200 dark:border-emerald-600"
          }`}>
            {getCourseIcon()}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-1 line-clamp-2 ${
              isPaid ? "text-slate-900 dark:text-slate-100" : "text-emerald-900 dark:text-emerald-100"
            }`}>
              {title}
            </h3>
            {englishTitle && (
              <p className={`text-sm ${
                isPaid ? "text-slate-600 dark:text-slate-400" : "text-emerald-700 dark:text-emerald-300"
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
            isPaid ? "text-slate-700 dark:text-slate-300" : "text-emerald-800 dark:text-emerald-200"
          }`}>
            {getStandardizedDescription(description)}
          </p>
        </div>
        
        {/* Benefits section */}
        <div className="space-y-3 mb-4 flex-grow min-h-[100px]">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span className={`line-clamp-2 leading-relaxed ${
              isPaid ? "text-slate-700 dark:text-slate-300" : "text-emerald-800 dark:text-emerald-200"
            }`}>
              {benefits}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <ArrowLeft size={14} className="text-blue-500 mt-0.5 flex-shrink-0 rtl:rotate-180" />
            <span className={`line-clamp-2 leading-relaxed ${
              isPaid ? "text-slate-700 dark:text-slate-300" : "text-emerald-800 dark:text-emerald-200"
            }`}>
              {outcome}
            </span>
          </div>
        </div>

        {/* Instructor info */}
        {instructor && (
          <div className="flex items-center gap-2 text-sm mb-4">
            <User size={12} className={isPaid ? "text-slate-500 dark:text-slate-400" : "text-emerald-600 dark:text-emerald-400"} />
            <span className={isPaid ? "text-slate-600 dark:text-slate-400" : "text-emerald-700 dark:text-emerald-300"}>
              {instructor}
            </span>
            {level && (
              <Badge variant="outline" className={`text-xs ${
                isPaid ? "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300" : "border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-300"
              }`}>
                {level}
              </Badge>
            )}
          </div>
        )}
        
        {/* Enrollment count */}
        <div className="flex items-center gap-2 text-xs mb-4 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <Users size={12} className={isPaid ? "text-slate-500 dark:text-slate-400" : "text-emerald-600 dark:text-emerald-400"} />
          <span className={isPaid ? "text-slate-600 dark:text-slate-400" : "text-emerald-700 dark:text-emerald-300"}>
            {enrollmentCount.toLocaleString()} دانشجو تاکنون
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0 z-10">
        <Button 
          onClick={handleCtaClick}
          className={`w-full text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md text-sm font-bold py-3 ${
            isPaid 
              ? "bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
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
