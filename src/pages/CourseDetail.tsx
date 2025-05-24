
import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Clock, Users, Award, CheckCircle, Star } from "lucide-react";
import { useState } from "react";
import AuthModal from "@/components/Auth/AuthModal";

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { translations } = useLanguage();
  const { user, activateCourse } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Mock course data - in a real app, this would come from an API
  const getCourseBySlug = (slug: string) => {
    const courses = {
      "boundless": {
        title: translations.boundlessProgram,
        description: translations.boundlessProgramDesc,
        benefits: translations.boundlessBenefits,
        outcome: translations.boundlessOutcome,
        isPaid: true,
        price: "$299",
        originalPrice: "$499",
        duration: "6 months",
        modules: 12,
        students: 450,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
        features: [
          "100+ hours of content",
          "180 daily tasks", 
          "Business coaching",
          "Psychological coaching",
          "Live sessions",
          "Private community",
          "Lifetime access"
        ],
        learningOutcomes: [
          "Master the boundless mindset",
          "Build scalable business systems",
          "Develop leadership skills",
          "Create multiple income streams"
        ]
      },
      "instagram": {
        title: translations.instagramEssentials,
        description: translations.instagramEssentialsDesc,
        benefits: translations.instagramBenefits,
        outcome: translations.instagramOutcome,
        isPaid: true,
        price: "$199",
        originalPrice: "$299",
        duration: "4 weeks",
        modules: 6,
        students: 850,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        features: [
          "Content creation strategies",
          "Ad campaign setup",
          "Branding essentials",
          "Sales techniques",
          "Analytics mastery",
          "Case studies",
          "Templates included"
        ],
        learningOutcomes: [
          "Create engaging Instagram content",
          "Set up profitable ad campaigns",
          "Build a strong brand presence",
          "Convert followers to customers"
        ]
      }
    };
    
    return courses[slug as keyof typeof courses] || null;
  };

  const course = getCourseBySlug(slug || "");

  const handleEnrollClick = async () => {
    if (user) {
      await activateCourse(slug || "", course?.title || "", course?.isPaid || false);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  if (!course) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-8">The course you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge variant={course.isPaid ? "default" : "outline"} className="text-sm">
                  {course.isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{course.rating}</span>
                  <span className="text-sm text-muted-foreground">({course.students}+ students)</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight">{course.title}</h1>
              <p className="text-lg text-muted-foreground">{course.description}</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{course.duration}</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{course.modules} modules</p>
                    <p className="text-xs text-muted-foreground">Content</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{course.students}+</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
              </div>

              {course.isPaid && (
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-primary">{course.price}</span>
                  <span className="text-lg text-muted-foreground line-through">{course.originalPrice}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Save 40%</Badge>
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full sm:w-auto" 
                onClick={handleEnrollClick}
              >
                {course.isPaid ? translations.enrollNow : translations.startFreeCourse}
              </Button>
            </div>

            <div className="relative">
              <img 
                src={course.image} 
                alt={course.title}
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">{translations.whatYouWillLearn}</h2>
              <div className="space-y-4">
                {course.learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <p className="text-lg">{outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">{translations.courseIncludes}</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Benefits */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose This Course?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Benefits
              </h3>
              <p className="text-muted-foreground">{course.benefits}</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                Outcome
              </h3>
              <p className="text-muted-foreground">{course.outcome}</p>
            </Card>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        courseTitle={course.title}
        isPaid={course.isPaid}
        courseId={slug}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </MainLayout>
  );
};

export default CourseDetail;
