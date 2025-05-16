
import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
}

const Hero = ({ title, subtitle, ctaText, ctaLink, image }: HeroProps) => {
  const { direction } = useLanguage();

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
      <div className="container flex flex-col md:flex-row items-center">
        <div className={`w-full md:w-1/2 space-y-6 text-center md:text-${direction === "rtl" ? "right" : "left"} mb-8 md:mb-0`}>
          <h1 className="font-bold tracking-tighter text-3xl md:text-5xl lg:text-6xl animate-slide-down">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl animate-slide-down animation-delay-200">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-down animation-delay-400">
            <Button asChild size="lg" className="rounded-full">
              <a href={ctaLink}>
                {ctaText}
              </a>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full">
              {direction === "rtl" ? "بیشتر بدانید" : "Learn More"}
            </Button>
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="relative aspect-square md:aspect-video mx-auto w-full max-w-md rounded-full md:rounded-2xl overflow-hidden animate-fade-in">
            <img
              src={image || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80"}
              alt="Hero"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
