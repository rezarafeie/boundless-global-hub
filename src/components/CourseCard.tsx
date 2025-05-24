
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCourseActivation } from "@/hooks/useCourseActivation";
import AuthenticationModal from "@/components/Auth/AuthenticationModal";

interface CourseCardProps {
  title: string;
  description: string;
  benefits: string | string[];
  outcome: string;
  isPaid: boolean;
  slug?: string;
}

const CourseCard = ({ title, description, benefits, outcome, isPaid, slug }: CourseCardProps) => {
  const { user } = useAuth();
  const { activateCourse, loading } = useCourseActivation();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const benefitsList = Array.isArray(benefits) ? benefits : benefits.split('\n').filter(b => b.trim());

  const handleStartLearning = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (slug) {
      const result = await activateCourse(slug, isPaid ? 'paid' : 'free');
      // Activation result is handled in the hook
    }
  };

  const getRedirectPath = () => {
    if (!slug) return '/';
    return isPaid ? `/start/paid-course?course=${slug}` : `/start/free-course?course=${slug}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Card className="h-full bg-gradient-to-br from-background to-secondary/30 border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                {title}
              </CardTitle>
              <Badge variant={isPaid ? "default" : "secondary"}>
                {isPaid ? "پولی" : "رایگان"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-0">
            <p className="text-muted-foreground leading-relaxed">{description}</p>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">مزایای این دوره:</h3>
              <ul className="space-y-2">
                {benefitsList.map((benefit, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-primary mr-2 flex-shrink-0">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">نتیجه دوره:</h4>
              <p className="text-sm">{outcome}</p>
            </div>
            
            <Button 
              onClick={handleStartLearning}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-primary/20"
              size="lg"
            >
              {loading ? "در حال پردازش..." : (isPaid ? "ثبت نام در دوره" : "شروع یادگیری رایگان")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <AuthenticationModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={getRedirectPath()}
      />
    </>
  );
};

export default CourseCard;
