
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
  const [boundlessCourses, setBoundlessCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch AI courses
        const { data: aiData } = await supabase
          .from('courses')
          .select('*')
          .in('slug', ['smart-pack', 'smart-life'])
          .eq('is_active', true)
          .order('title');
        
        if (aiData) {
          setFeaturedCourses(aiData);
        }

        // Fetch Boundless courses
        const { data: boundlessData } = await supabase
          .from('courses')
          .select('*')
          .in('slug', ['boundless-taste', 'boundless'])
          .eq('is_active', true)
          .order('title');
        
        if (boundlessData) {
          setBoundlessCourses(boundlessData);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
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

      {/* AI Courses Section */}
      {featuredCourses.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-primary/5 to-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          
          <div className="container relative">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                <Star className="h-4 w-4 ml-1" />
                دوره‌های هوش مصنوعی
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                دوره‌های هوش مصنوعی
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                آموزش‌های پیشرفته و کاربردی هوش مصنوعی برای تغییر زندگی و کسب‌وکار شما
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
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-8 h-full hover:border-blue-500/30 transition-all duration-500 group-hover:scale-[1.02]">
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
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-500/90 hover:to-purple-600/90 text-white border-0 px-8"
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

      {/* Boundless Courses Section */}
      {boundlessCourses.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-green-500/5 to-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          
          <div className="container relative">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                <Star className="h-4 w-4 ml-1" />
                دوره‌های بدون مرز
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                دوره‌های بدون مرز
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                سیستم علمی و انقلابی تبدیل شدن به یک کارآفرین بین‌المللی موفق
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {boundlessCourses.map((course) => {
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
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-8 h-full hover:border-green-500/30 transition-all duration-500 group-hover:scale-[1.02]">
                        {/* Price Badge */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            {course.price === 0 && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                                رایگان
                              </Badge>
                            )}
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
                          {course.price > 0 && (
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
                          )}
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
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-500/90 hover:to-emerald-600/90 text-white border-0 px-8"
                          >
                            <Link to={`/enroll?course=${course.slug}`}>
                              {course.price === 0 ? 'شروع دوره رایگان' : 'ثبت‌نام در دوره'}
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
