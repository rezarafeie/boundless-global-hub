
import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  backgroundType?: "gradient" | "wave" | "dots" | "image" | "glow";
}

const Hero = ({ 
  title, 
  subtitle, 
  ctaText, 
  ctaLink, 
  image,
  backgroundType = "glow" 
}: HeroProps) => {
  const { direction } = useLanguage();

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
          <div className="absolute inset-0 overflow-hidden">
            <div className="glow-circle glow-circle-1 animate-pulse"></div>
            <div className="glow-circle glow-circle-2 animate-float-fast"></div>
            <div className="glow-circle glow-circle-3 animate-pulse animation-delay-1000"></div>
            <div className="glow-circle glow-circle-4 animate-float-slow animation-delay-2000"></div>
          </div>
          <div className="absolute inset-0 bg-background/40 dark:bg-background/60 backdrop-blur-[20px] z-0"></div>
        </>
      )}
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Text Content - Center Aligned */}
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="font-bold tracking-tighter text-4xl md:text-5xl lg:text-6xl animate-slide-down text-balance text-foreground">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-slide-down animation-delay-200 max-w-2xl mx-auto">
              {subtitle}
            </p>
            <div className="animate-slide-down animation-delay-400">
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
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
            opacity: 0.4;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.15);
          }
        }
        
        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
          }
          25% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-5px) translateX(30px);
            opacity: 0.6;
          }
          75% {
            transform: translateY(25px) translateX(15px);
            opacity: 0.8;
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          33% {
            transform: translateY(-15px) translateX(25px);
            opacity: 0.7;
          }
          66% {
            transform: translateY(20px) translateX(-10px);
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 6s infinite ease-in-out;
        }
        
        .animate-float-fast {
          animation: float-fast 12s infinite ease-in-out;
        }
        
        .animate-float-slow {
          animation: float-slow 18s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(30px);
        }
        
        .glow-circle-1 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(147,112,219,0.45) 0%, rgba(147,112,219,0) 70%);
          top: -150px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(65,105,225,0.4) 0%, rgba(65,105,225,0) 70%);
          bottom: -180px;
          left: 10%;
        }
        
        .glow-circle-3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(123,104,238,0.4) 0%, rgba(123,104,238,0) 70%);
          top: 30%;
          left: 25%;
        }
        
        .glow-circle-4 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(72,209,204,0.35) 0%, rgba(72,209,204,0) 70%);
          top: 40%;
          right: 20%;
        }

        @media (prefers-color-scheme: dark) {
          .glow-circle-1 {
            background: radial-gradient(circle, rgba(147,112,219,0.3) 0%, rgba(147,112,219,0) 70%);
          }
          
          .glow-circle-2 {
            background: radial-gradient(circle, rgba(65,105,225,0.25) 0%, rgba(65,105,225,0) 70%);
          }
          
          .glow-circle-3 {
            background: radial-gradient(circle, rgba(123,104,238,0.25) 0%, rgba(123,104,238,0) 70%);
          }
          
          .glow-circle-4 {
            background: radial-gradient(circle, rgba(72,209,204,0.2) 0%, rgba(72,209,204,0) 70%);
          }
        }
        `}
      </style>
    </div>
  );
};

export default Hero;
