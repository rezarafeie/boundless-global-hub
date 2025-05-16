
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
    <Card className="overflow-hidden border border-primary/10 shadow-lg transition-all hover:shadow-xl hover:border-primary/20 group animate-scale-in h-full flex flex-col">
      <div className="overflow-hidden aspect-video relative">
        <img
          src={image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80"}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <Badge
          variant={isPaid ? "default" : "secondary"}
          className="absolute top-3 right-3 z-10"
        >
          {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
        </Badge>
      </div>
      
      <CardHeader className="relative z-10 mt-[-20px] pt-0">
        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-t-lg border-t border-x border-primary/10">
          <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
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
            <User size={16} className="mr-2 text-primary" />
            <span>{translations.instructor}</span>
          </h4>
          <p className="text-sm text-muted-foreground">{translations.rezaRafiei}</p>
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
        <Button 
          className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-primary/20"
          size="lg"
        >
          {isPaid ? translations.buyNow : translations.startLearning}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
