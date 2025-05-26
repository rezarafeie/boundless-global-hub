
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Clock, Users, Award, Star, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface EnhancedFreeCourseCardProps {
  title: string;
  description: string;
  benefits: string;
  outcome: string;
  slug: string;
  features?: string[];
  testimonial?: string;
  studentCount?: number;
  duration?: string;
}

const EnhancedFreeCourseCard: React.FC<EnhancedFreeCourseCardProps> = ({
  title,
  description,
  benefits,
  outcome,
  slug,
  features = [],
  testimonial,
  studentCount,
  duration
}) => {
  const { translations } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-lg hover:shadow-xl h-full bg-gradient-to-br from-white to-gray-50/50 rounded-xl">
        
        {/* Header Section */}
        <div className="p-6 bg-gradient-to-r from-black to-gray-800 text-white">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-green-500 text-white border-0">
              {translations.freeCoursesTitle}
            </Badge>
            {studentCount && (
              <div className="flex items-center text-sm text-gray-200">
                <Users size={16} className="mr-1" />
                {studentCount}+ دانشجو
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-gray-200 text-sm leading-relaxed">{description}</p>
        </div>
        
        <CardContent className="p-6 flex-grow">
          {/* Course Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {duration && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-2 text-green-500" />
                <span>{duration}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <Award size={16} className="mr-2 text-green-500" />
              <span>گواهی رایگان</span>
            </div>
          </div>
          
          {/* Benefits Section */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{benefits}</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{outcome}</p>
            </div>
          </div>
          
          {/* Features List */}
          {features.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-gray-800">شامل:</h4>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-500 text-sm">•</span>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Testimonial */}
          {testimonial && (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-700 italic">"{testimonial}"</p>
            </div>
          )}
          
          {/* CTA Section */}
          <div className="space-y-3">
            <Link to={`/course/${slug}`} className="block">
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full text-lg py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                <BookOpen className="mr-2" size={20} />
                {translations.startFreeCourse}
              </Button>
            </Link>
            
            <p className="text-xs text-center text-gray-500">
              ✓ دسترسی فوری ✓ بدون نیاز به ثبت‌نام ✓ کاملاً رایگان
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedFreeCourseCard;
