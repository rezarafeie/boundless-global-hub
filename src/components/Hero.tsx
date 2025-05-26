
import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "react-router-dom";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  backgroundType?: "gradient" | "wave" | "dots" | "image" | "glow";
  glowTheme?: "home" | "courses" | "assessment" | "magazine" | "support";
}

const Hero = ({ 
  title, 
  subtitle, 
  ctaText, 
  ctaLink, 
  image,
  backgroundType = "glow",
  glowTheme
}: HeroProps) => {
  const { direction } = useLanguage();
  const location = useLocation();

  // Auto-detect glow theme based on current route if not provided
  const getGlowTheme = () => {
    if (glowTheme) return glowTheme;
    
    const path = location.pathname;
    if (path.includes('/courses') || path.includes('/course')) return 'courses';
    if (path.includes('/assessment')) return 'assessment';
    if (path.includes('/mag') || path.includes('/blog')) return 'magazine';
    if (path.includes('/support') || path.includes('/contact')) return 'support';
    return 'home';
  };

  const currentGlowTheme = getGlowTheme();

  return (
    <div className="relative w-full overflow-hidden bg-background py-20 md:py-28">
      {/* Background Effects */}
      {backgroundType === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 dark:from-white/5 via-transparent to-transparent"></div>
      )}
      
      {backgroundType === "wave" && (
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path d="M0,1000 C300,800 400,600 500,500 C600,400 700,300 1000,0 L1000,1000 Z" fill="currentColor" className="text-foreground"></path>
          </svg>
        </div>
      )}
      
      {backgroundType === "dots" && (
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 text-foreground" style={{ 
            backgroundImage: `radial-gradient(currentColor 1px, transparent 0)`, 
            backgroundSize: '20px 20px' 
          }}></div>
        </div>
      )}
      
      {backgroundType === "image" && image && (
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-0"></div>
      )}
      
      {backgroundType === "image" && image && (
        <div className="absolute inset-0 z-[-1]">
          <img 
            src={image} 
            alt="Background" 
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      {backgroundType === "glow" && (
        <>
          <div className={`absolute inset-0 overflow-hidden hero-glow-${currentGlowTheme}`}>
            <div className="glow-circle glow-circle-1"></div>
            <div className="glow-circle glow-circle-2"></div>
            <div className="glow-circle glow-circle-3"></div>
            <div className="glow-circle glow-circle-4"></div>
          </div>
          <div className="absolute inset-0 bg-background/50 dark:bg-background/70 backdrop-blur-[20px] z-0"></div>
        </>
      )}
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Text Content - Center Aligned */}
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="font-bold tracking-tighter text-4xl md:text-5xl lg:text-6xl animate-fade-up text-balance text-foreground">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-up animation-delay-200 max-w-2xl mx-auto">
              {subtitle}
            </p>
            <div className="animate-fade-up animation-delay-400">
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground btn-hover btn-glow">
                <a href={ctaLink}>
                  {ctaText}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
