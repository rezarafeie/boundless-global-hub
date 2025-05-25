
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface CourseCardProps {
  title: string;
  description: string;
  benefits: string | string[];
  outcome: string;
  isPaid: boolean;
  slug?: string;
}

const CourseCard = ({ title, description, benefits, outcome, isPaid, slug }: CourseCardProps) => {
  const benefitsList = Array.isArray(benefits) ? benefits : benefits.split('\n').filter(b => b.trim());

  // Generate correct route based on course type and slug
  const getRouteUrl = () => {
    if (!slug) return '/courses';
    
    if (!isPaid) {
      // For free courses, remove 'free/' prefix if it exists and go to free course landing
      const cleanSlug = slug.replace('free/', '');
      return `/free-course/${cleanSlug}`;
    }
    
    // For paid courses, go to course landing page (not checkout)
    return `/course/${slug}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Link to={getRouteUrl()} className="block h-full">
        <Card className="h-full bg-gradient-to-br from-background to-secondary/30 border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group cursor-pointer">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 group-hover:from-blue-600 group-hover:to-primary transition-all duration-300">
                {title}
              </CardTitle>
              <Badge variant={isPaid ? "default" : "secondary"}>
                {isPaid ? "ویژه" : "رایگان"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-0">
            <p className="text-muted-foreground leading-relaxed line-clamp-3">{description}</p>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">مزایای این دوره:</h3>
              <ul className="space-y-2">
                {benefitsList.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-primary mr-2 flex-shrink-0">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
                {benefitsList.length > 3 && (
                  <li className="text-sm text-muted-foreground">
                    و {benefitsList.length - 3} مورد دیگر...
                  </li>
                )}
              </ul>
            </div>
            
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">نتیجه دوره:</h4>
              <p className="text-sm line-clamp-2">{outcome}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {isPaid ? "کلیک برای مشاهده دوره" : "کلیک برای ثبت نام رایگان"}
              </span>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default CourseCard;
