
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  title: string;
  description: string;
  image: string;
  price?: string;
  duration: string;
  students: number;
  href: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  title, 
  description, 
  image, 
  price,
  duration, 
  students, 
  href 
}) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="relative overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{students.toLocaleString()}</span>
            </div>
          </div>
          {price && (
            <Badge variant="secondary" className="font-bold text-blue-600 dark:text-blue-400">
              {price}
            </Badge>
          )}
        </div>
        
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Link to={href}>
            مشاهده دوره
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
