
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
      
      {backgroundType === "glow" && (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <div className="glow-circle glow-circle-1 animate-pulse-slow"></div>
            <div className="glow-circle glow-circle-2 animate-float"></div>
            <div className="glow-circle glow-circle-3 animate-pulse-slow animation-delay-1000"></div>
          </div>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[40px] z-0"></div>
        </>
      )}
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Text Content - Center Aligned */}
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="font-bold tracking-tighter text-4xl md:text-5xl lg:text-6xl animate-slide-down text-balance">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-slide-down animation-delay-200 max-w-2xl mx-auto">
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
        </div>
      </div>
      
      <style>
        {`
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(0) translateX(20px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(20px) translateX(10px);
            opacity: 0.7;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
        }
        
        .glow-circle-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(147,112,219,0.4) 0%, rgba(147,112,219,0) 70%);
          top: -100px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(65,105,225,0.3) 0%, rgba(65,105,225,0) 70%);
          bottom: -150px;
          left: 10%;
        }
        
        .glow-circle-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(123,104,238,0.35) 0%, rgba(123,104,238,0) 70%);
          top: 30%;
          left: 25%;
        }
        `}
      </style>
    </div>
  );
};

export default Hero;
