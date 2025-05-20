
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Award, BookOpen } from "lucide-react";
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
  const { translations, language } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border border-black/10 hover:border-black/30 transition-all shadow-lg hover:shadow-xl group animate-scale-in h-full flex flex-col">
        <div className="overflow-hidden aspect-video relative">
          <img
            src={image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <Badge
            variant={isPaid ? "default" : "outline"}
            className="absolute top-3 right-3 z-10 bg-white text-black border-black/10"
          >
            {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
          </Badge>
        </div>
        
        <CardHeader className="relative z-10 mt-[-20px] pt-0">
          <div className="bg-background/95 backdrop-blur-sm p-4 rounded-t-lg border-t border-x border-black/10 shadow-lg">
            <CardTitle className="text-xl font-bold">
              {title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-grow">
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center">
              <User size={16} className="mr-2" />
              <span>{translations.instructor}</span>
            </h4>
            <p className="text-sm text-muted-foreground">{translations.rezaRafiei}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center">
              <BookOpen size={16} className="mr-2" />
              <span>{language === "en" ? "What you'll learn:" : "آنچه خواهید آموخت:"}</span>
            </h4>
            <p className="text-sm text-muted-foreground">{benefits}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center">
              <Award size={16} className="mr-2" />
              <span>{language === "en" ? "Outcome:" : "نتیجه:"}</span>
            </h4>
            <p className="text-sm text-muted-foreground">{outcome}</p>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2">
          <Button 
            className="w-full bg-black hover:bg-gray-800 text-white transition-all"
            size="lg"
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
