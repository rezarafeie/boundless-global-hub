
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group animate-scale-in">
      <div className="overflow-hidden aspect-video relative">
        <img
          src={image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        <Badge
          variant={isPaid ? "default" : "secondary"}
          className="absolute top-3 right-3"
        >
          {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
        </Badge>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1">{translations.instructor}</h4>
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>{translations.rezaRafiei}</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-1">{language === "en" ? "What you'll learn:" : "آنچه خواهید آموخت:"}</h4>
          <p className="text-sm text-muted-foreground">{benefits}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-1">{language === "en" ? "Outcome:" : "نتیجه:"}</h4>
          <p className="text-sm text-muted-foreground">{outcome}</p>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button className="w-full">
          {isPaid ? translations.buyNow : translations.startLearning}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
