
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, FileText, BarChart3, GraduationCap } from "lucide-react";

interface TestCardProps {
  title: string;
  description: string;
  category: string;
}

const TestCard: React.FC<TestCardProps> = ({
  title,
  description,
  category,
}) => {
  const { translations } = useLanguage();

  // Map categories to appropriate icons
  const getIconForCategory = () => {
    switch (category.toLowerCase()) {
      case "personality":
        return <FileText className="w-12 h-12 text-primary" />;
      case "intelligence":
        return <BarChart3 className="w-12 h-12 text-primary" />;
      case "career":
        return <GraduationCap className="w-12 h-12 text-primary" />;
      default:
        return <BookOpen className="w-12 h-12 text-primary" />;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group animate-scale-in">
      <div className="overflow-hidden aspect-video relative flex items-center justify-center bg-black/5 p-6">
        {getIconForCategory()}
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
