
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import QuickAccess from "@/components/QuickAccess";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import HubBanner from "@/components/HubBanner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Star, Zap } from "lucide-react";

const Index = () => {
  const { translations } = useLanguage();
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .in('slug', ['smart-pack', 'boundless'])
          .eq('is_active', true)
          .order('title');
        
        if (data) {
          setFeaturedCourses(data);
        }
      } catch (error) {
        console.error('Error fetching featured courses:', error);
      }
    };

    fetchFeaturedCourses();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const paidCourses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
    },
  ];

  const freeCourses = [
    {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
    },
    {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
    },
  ];

  return (
    <MainLayout>
      <Hero />
      <QuickAccess />
      <HubBanner />

      {/* Featured Courses Section */}
      {featuredCourses.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-primary/5 to-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          
          <div className="container relative">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Star className="h-4 w-4 ml-1" />
                دوره‌های ویژه
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                بهترین دوره‌های آموزشی
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                دوره‌های منتخب و پرطرفدار ما که بیشترین تاثیر را در زندگی شرکت‌کنندگان داشته‌اند
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {featuredCourses.map((course) => {
                const isOnSale = course.is_sale_enabled && course.sale_price && 
                  (!course.sale_expires_at || new Date(course.sale_expires_at) > new Date());
                const isOnPrelaunch = course.is_pre_launch_enabled && course.pre_launch_price &&
                  (!course.pre_launch_ends_at || new Date(course.pre_launch_ends_at) > new Date());
                
                const currentPrice = isOnPrelaunch ? course.pre_launch_price : 
                  isOnSale ? course.sale_price : course.price;
                
                return (
                  <div key={course.id} className="group">
                    <div className="relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-8 h-full hover:border-primary/30 transition-all duration-500 group-hover:scale-[1.02]">
                        {/* Price Badge */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            {isOnPrelaunch && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                                <Zap className="h-3 w-3 ml-1" />
                                پیش‌فروش
                              </Badge>
                            )}
                            {!isOnPrelaunch && isOnSale && (
                              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                                حراج ویژه
                              </Badge>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-2xl font-bold text-primary">
                              {course.use_dollar_price ? `$${currentPrice}` : formatPrice(currentPrice)}
                            </div>
                            {(isOnSale || isOnPrelaunch) && (
                              <div className="text-sm text-muted-foreground line-through">
                                {course.use_dollar_price ? `$${course.usd_price}` : formatPrice(course.price)}
                              </div>
                            )}
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          {course.description || 'دوره جامع و کاربردی برای پیشرفت در مسیر شغلی و زندگی'}
                        </p>

                        <div className="flex items-center justify-between">
                          <Button 
                            asChild 
                            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white border-0 px-8"
                          >
                            <Link to={`/enroll?course=${course.slug}`}>
                              ثبت‌نام در دوره
                            </Link>
                          </Button>
                          
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/course/${course.slug}`}>
                              مشاهده جزئیات
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Paid Courses */}
      <section className="py-16 bg-background">
        <div className="container">
          <SectionTitle
            title={translations.paidCoursesTitle}
            subtitle={translations.paidCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {paidCourses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link to="/paid-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Free Courses */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <SectionTitle
            title={translations.freeCoursesTitle}
            subtitle={translations.freeCoursesSubtitle}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {freeCourses.map((course, index) => (
              <CourseCard
                key={index}
                title={course.title}
                description={course.description}
                benefits={course.benefits}
                outcome={course.outcome}
                isPaid={course.isPaid}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/free-courses">
                {translations.learnMore}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Assessment Center Promo */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                {translations.assessmentCenterTitle}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {translations.assessmentCenterDesc}
              </p>
              <Button asChild size="lg">
                <Link to="/assessment-center">
                  {translations.learnMore}
                </Link>
              </Button>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.personalityTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.intelligenceTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.careerTests}
                  </h3>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {translations.emotionTests}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
