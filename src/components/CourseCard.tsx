
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthModal from "./Auth/AuthModal";

interface CourseCardProps {
  title: string;
  description: string;
  benefits: string;
  outcome: string;
  isPaid?: boolean;
  image?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  benefits,
  outcome,
  isPaid = false,
  image,
}) => {
  const { translations } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md group h-full flex flex-col bg-white">
        <div className="overflow-hidden aspect-video relative">
          <img
            src={image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-end">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
          </div>
          <Badge
            variant={isPaid ? "default" : "outline"}
            className="absolute top-3 right-3 z-10 bg-white text-black border-black/10"
          >
            {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
          </Badge>
        </div>
        
        <CardContent className="p-6 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
          
          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <span className="font-medium">✓ </span>
              {benefits}
            </div>
            <div className="text-sm">
              <span className="font-medium">→ </span>
              {outcome}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-6 pt-0">
          <Button 
            className="w-full bg-black text-white hover:bg-black/90 rounded-full transition-all"
            onClick={() => setShowAuthModal(true)}
          >
            {translations.startCourse}
          </Button>
        </CardFooter>
      </Card>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        courseTitle={title}
        isPaid={isPaid || false}
      />
    </>
  );
};

export default CourseCard;

