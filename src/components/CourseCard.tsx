
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, Clock, Users, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import BlackFridayBadge from "@/components/BlackFriday/BlackFridayBadge";
import { courseImage, courseImagePosition } from "@/lib/academyImagery";

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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-border bg-card transition-all duration-500 ease-smooth hover:-translate-y-1 hover:shadow-float"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-photo-shade">
        <img src={courseImage(slug, title)} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" style={{ objectPosition: courseImagePosition(slug, title) }} />
        <div className="absolute inset-0 bg-gradient-to-t from-photo-shade via-photo-shade/30 to-transparent" />
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {blackFridayDiscount > 0 && <BlackFridayBadge discount={blackFridayDiscount} className="text-xs scale-75" />}
          <span className="rounded-full border border-photo-ink/20 bg-photo-shade/40 px-3 py-1 text-xs font-medium text-photo-ink backdrop-blur-md">
            {status === "upcoming" ? "به‌زودی" : isPaid ? "ویژه" : "رایگان"}
          </span>
        </div>
        <h3 className="absolute inset-x-5 bottom-5 line-clamp-2 text-xl font-extrabold leading-snug text-photo-ink md:text-2xl">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <p className="line-clamp-2 flex-grow text-sm leading-7 text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <button onClick={handleCtaClick} className="text-sm font-semibold text-foreground">
            {cta || (isPaid ? "مشاهده دوره" : translations.startFreeCourse)}
          </button>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-500 ease-smooth group-hover:-translate-x-1">
            <ArrowLeft size={16} />
          </span>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
