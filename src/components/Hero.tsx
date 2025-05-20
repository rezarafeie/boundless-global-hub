
import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  backgroundType?: "gradient" | "wave" | "dots" | "image";
}

const Hero = ({ 
  title, 
  subtitle, 
  ctaText, 
  ctaLink, 
  image,
  backgroundType = "gradient" 
}: HeroProps) => {
  const { direction } = useLanguage();

  return (
    <div className="relative w-full overflow-hidden bg-white py-20 md:py-28">
      {/* Background Effects */}
      {backgroundType === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-transparent"></div>
      )}
      
      {backgroundType === "wave" && (
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path d="M0,1000 C300,800 400,600 500,500 C600,400 700,300 1000,0 L1000,1000 Z" fill="black"></path>
          </svg>
        </div>
      )}
      
      {backgroundType === "dots" && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </div>
      )}
      
      {backgroundType === "image" && image && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>
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
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div className={`space-y-6 text-center md:text-${direction === "rtl" ? "right" : "left"}`}>
            <h1 className="font-bold tracking-tighter text-4xl md:text-5xl lg:text-6xl animate-slide-down text-balance">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-slide-down animation-delay-200 max-w-md">
              {subtitle}
            </p>
            <div className="animate-slide-down animation-delay-400">
              <Button asChild className="rounded-full bg-black hover:bg-black/90 text-white">
                <a href={ctaLink}>
                  {ctaText}
                </a>
              </Button>
            </div>
          </div>
          
          {/* Visual Element */}
          <div className="hidden md:block">
            {image ? (
              <div className="relative aspect-square md:aspect-video w-full rounded-xl overflow-hidden animate-scale-in">
                <img
                  src={image}
                  alt="Hero"
                  className="object-cover w-full h-full rounded-xl shadow-lg"
                />
              </div>
            ) : (
              <div className="relative w-full aspect-square md:aspect-video">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-black/5 animate-float"></div>
                <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-black/5 animate-float animation-delay-200"></div>
                <div className="absolute bottom-1/4 right-1/3 transform translate-x-1/2 translate-y-1/2 w-48 h-48 rounded-full bg-black/5 animate-float animation-delay-400"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

