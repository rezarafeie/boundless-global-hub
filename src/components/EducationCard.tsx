
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EducationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  gradient: string;
  isPaid?: boolean;
  className?: string;
}

const EducationCard: React.FC<EducationCardProps> = ({
  title,
  description,
  icon,
  link,
  gradient,
  isPaid = false,
  className = ""
}) => {
  const { direction } = useLanguage();

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group cursor-pointer ${className}`}
    >
      <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          {/* Header with gradient and icon */}
          <div className={`${gradient} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            <div className="relative z-10 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              {isPaid && (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  پولی
                </span>
              )}
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {description}
            </p>
            
            <Button 
              asChild 
              variant="outline" 
              className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
            >
              <a href={link} className="flex items-center justify-center gap-2">
                <span>مشاهده دوره</span>
                {direction === 'rtl' ? (
                  <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EducationCard;
