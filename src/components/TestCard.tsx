
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface TestCardProps {
  title: string;
  description: string;
  category: string;
  image?: string;
}

const TestCard: React.FC<TestCardProps> = ({
  title,
  description,
  category,
  image,
}) => {
  const { translations } = useLanguage();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group animate-scale-in">
      <div className="overflow-hidden aspect-video relative">
        <img
          src={image || "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80"}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      <CardHeader>
        <div className="text-sm text-primary mb-1">{category}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {translations.startTest}
        </p>
      </CardContent>
      
      <CardFooter>
        <Button className="w-full">
          {translations.startTest}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TestCard;
