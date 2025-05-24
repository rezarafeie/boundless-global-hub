
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRandomQuote } from "@/utils/motivationalQuotes";

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  backgroundType?: "gradient" | "wave" | "dots" | "image" | "glow";
  showRandomQuote?: boolean;
}

const Hero = ({ 
  title, 
  subtitle, 
  ctaText, 
  ctaLink, 
  image,
  backgroundType = "glow",
  showRandomQuote = false
}: HeroProps) => {
  const { direction, language } = useLanguage();
  const [randomQuote, setRandomQuote] = useState<string>("");

  useEffect(() => {
    if (showRandomQuote) {
      const quote = getRandomQuote(language as 'fa' | 'en');
      setRandomQuote(quote);
    }
  }, [showRandomQuote, language]);

  const displayTitle = showRandomQuote ? randomQuote : title;
  const displaySubtitle = showRandomQuote ? subtitle : subtitle;

  return (
    <div className="relative w-full overflow-hidden bg-white py-24 md:py-32 lg:py-40">
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
      
      {backgroundType === "glow" && (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <div className="glow-circle glow-circle-1 animate-pulse"></div>
            <div className="glow-circle glow-circle-2 animate-float-fast"></div>
            <div className="glow-circle glow-circle-3 animate-pulse animation-delay-1000"></div>
            <div className="glow-circle glow-circle-4 animate-float-slow animation-delay-2000"></div>
          </div>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[25px] z-0"></div>
        </>
      )}
      
      <div className="container relative z-10 max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Text Content - Center Aligned */}
          <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="font-bold tracking-tight text-4xl md:text-5xl lg:text-6xl xl:text-7xl animate-slide-down text-balance leading-tight">
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground animate-slide-down animation-delay-200 max-w-3xl mx-auto leading-relaxed">
                {displaySubtitle}
              </p>
            )}
            <div className="animate-slide-down animation-delay-400 pt-4">
              <Button asChild className="rounded-full bg-black hover:bg-black/90 text-white px-8 py-4 text-lg font-semibold">
                <a href={ctaLink}>
                  {ctaText}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-25px) translateX(12px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-8px) translateX(25px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(20px) translateX(12px);
            opacity: 0.7;
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          33% {
            transform: translateY(-12px) translateX(20px);
            opacity: 0.6;
          }
          66% {
            transform: translateY(15px) translateX(-8px);
            opacity: 0.4;
          }
        }
        
        .animate-pulse {
          animation: pulse 8s infinite ease-in-out;
        }
        
        .animate-float-fast {
          animation: float-fast 15s infinite ease-in-out;
        }
        
        .animate-float-slow {
          animation: float-slow 20s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1.5s;
        }
        
        .animation-delay-2000 {
          animation-delay: 3s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
        }
        
        .glow-circle-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(147,112,219,0.4) 0%, rgba(147,112,219,0) 70%);
          top: -200px;
          right: 5%;
        }
        
        .glow-circle-2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(65,105,225,0.35) 0%, rgba(65,105,225,0) 70%);
          bottom: -250px;
          left: 5%;
        }
        
        .glow-circle-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(123,104,238,0.35) 0%, rgba(123,104,238,0) 70%);
          top: 25%;
          left: 20%;
        }
        
        .glow-circle-4 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(72,209,204,0.3) 0%, rgba(72,209,204,0) 70%);
          top: 35%;
          right: 15%;
        }
        `}
      </style>
    </div>
  );
};

export default Hero;
