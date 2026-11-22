
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
      return <Code size={20} className="text-foreground" />;
    } else if (title.includes("اینستاگرام") || title.includes("Instagram")) {
      return <Search size={20} className="text-foreground" />;
    } else if (title.includes("ثروت") || title.includes("Wealth")) {
      return <DollarSign size={20} className="text-green-500" />;
    } else if (title.includes("بدون مرز") || title.includes("Boundless") || title.includes("شروع")) {
      return <GraduationCap size={20} className="text-foreground" />;
    } else if (title.includes("غیرفعال") || title.includes("Passive")) {
      return <Star size={20} className="text-orange-500" />;
    } else {
      return <BookOpen size={20} className="text-foreground" />;
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
    <article
      onClick={handleCardClick}
      className="group relative flex h-full cursor-pointer flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-500 ease-smooth hover:-translate-y-1 hover:shadow-float"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground [&_svg]:text-foreground">
          {getCourseIcon()}
        </div>
        <div className="flex items-center gap-2">
          {blackFridayDiscount > 0 && (
            <BlackFridayBadge discount={blackFridayDiscount} className="text-xs scale-75" />
          )}
          <span className="rounded-full border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {isPaid ? "ویژه" : "رایگان"}
          </span>
        </div>
      </div>

      <h3 className="mt-8 text-xl font-bold leading-snug tracking-tight text-foreground line-clamp-2">{title}</h3>
      {englishTitle && <p className="mt-1 text-xs text-muted-foreground">{englishTitle}</p>}
      <p className="mt-3 flex-grow text-sm leading-7 text-muted-foreground line-clamp-3">{description}</p>

      {instructor && (
        <p className="mt-4 text-xs text-muted-foreground">{instructor}{level ? ` · ${level}` : ""}</p>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
        <button
          onClick={handleCtaClick}
          className="text-sm font-semibold text-foreground"
        >
          {cta || (isPaid ? "مشاهده دوره" : translations.startFreeCourse)}
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-500 ease-smooth group-hover:-translate-x-1">
          <ArrowLeft size={16} />
        </span>
      </div>
    </article>
  );
};

export default CourseCard;
