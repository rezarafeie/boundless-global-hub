
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundType?: "gradient" | "glow" | "simple";
  glowTheme?: "blue" | "purple" | "pink";
}

const Hero: React.FC<HeroProps> = ({ 
  title, 
  subtitle, 
  ctaText, 
  ctaLink, 
  backgroundType = "gradient",
  glowTheme = "blue" 
}) => {
  const getBackgroundClasses = () => {
    switch (backgroundType) {
      case "glow":
        return `relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 overflow-hidden`;
      case "simple":
        return "bg-background py-20";
      default:
        return "relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden";
    }
  };

  const getGlowClasses = () => {
    switch (glowTheme) {
      case "purple":
        return "from-purple-400/20 to-pink-600/20";
      case "pink":
        return "from-pink-400/20 to-red-600/20";
      default:
        return "from-blue-400/20 to-purple-600/20";
    }
  };

  return (
    <section className={getBackgroundClasses()}>
      {backgroundType === "glow" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br ${getGlowClasses()} rounded-full blur-3xl`}></div>
          <div className={`absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr ${getGlowClasses()} rounded-full blur-3xl`}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br ${getGlowClasses()} rounded-full blur-3xl`}></div>
        </div>
      )}
      
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${
            backgroundType === "glow" 
              ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" 
              : "text-white"
          }`}>
            {title}
          </h1>
          
          {subtitle && (
            <p className={`text-xl md:text-2xl mb-8 ${
              backgroundType === "glow" 
                ? "text-slate-600 dark:text-slate-300" 
                : "text-white/90"
            }`}>
              {subtitle}
            </p>
          )}
          
          {ctaText && ctaLink && (
            <Link to={ctaLink}>
              <Button 
                size="lg" 
                className={`text-lg px-8 py-4 ${
                  backgroundType === "glow"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "bg-white text-blue-600 hover:bg-gray-100"
                }`}
              >
                {ctaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
