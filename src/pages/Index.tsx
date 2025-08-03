
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
        <section className="py-24 bg-background">
          <div className="container">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">دوره‌های هوش مصنوعی</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                آموزش هوش مصنوعی
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                دوره‌های تخصصی و کاربردی برای یادگیری هوش مصنوعی در زندگی و کسب‌وکار
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {featuredCourses.map((course) => {
                const isOnSale = course.is_sale_enabled && course.sale_price && 
                  (!course.sale_expires_at || new Date(course.sale_expires_at) > new Date());
                const isOnPrelaunch = course.is_pre_launch_enabled && course.pre_launch_price &&
                  (!course.pre_launch_ends_at || new Date(course.pre_launch_ends_at) > new Date());
                
                const currentPrice = isOnPrelaunch ? course.pre_launch_price : 
                  isOnSale ? course.sale_price : course.price;
                
                return (
                  <div key={course.id} className="group">
                    <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-border transition-all duration-300 hover:shadow-lg">
                      {/* Header */}
                      <div className="p-8 pb-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-blue-500 rounded-sm"></div>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-1">
                                {course.title}
                              </h3>
                              {(isOnPrelaunch || isOnSale) && (
                                <div className="flex items-center gap-2">
                                  {isOnPrelaunch && (
                                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-md">
                                      پیش‌فروش
                                    </span>
                                  )}
                                  {!isOnPrelaunch && isOnSale && (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md">
                                      تخفیف ویژه
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-foreground">
                              {course.use_dollar_price ? `$${currentPrice}` : formatPrice(currentPrice)}
                            </div>
                            {(isOnSale || isOnPrelaunch) && (
                              <div className="text-sm text-muted-foreground line-through">
                                {course.use_dollar_price ? `$${course.usd_price}` : formatPrice(course.price)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground leading-relaxed mb-8">
                          {course.description || 'دوره جامع و کاربردی برای پیشرفت در هوش مصنوعی'}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Button 
                            asChild 
                            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Link to={`/enroll?course=${course.slug}`}>
                              ثبت‌نام در دوره
                            </Link>
                          </Button>
                          
                          <Button asChild variant="outline" size="default" className="px-6">
                            <Link to={`/course/${course.slug}`}>
                              جزئیات
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
        <section className="py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 rounded-full mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">دوره‌های بدون مرز</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                آموزش کارآفرینی بین‌المللی
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                سیستم علمی و عملی برای تبدیل شدن به کارآفرین موفق در سطح بین‌المللی
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {boundlessCourses.map((course) => {
                const isOnSale = course.is_sale_enabled && course.sale_price && 
                  (!course.sale_expires_at || new Date(course.sale_expires_at) > new Date());
                const isOnPrelaunch = course.is_pre_launch_enabled && course.pre_launch_price &&
                  (!course.pre_launch_ends_at || new Date(course.pre_launch_ends_at) > new Date());
                
                const currentPrice = isOnPrelaunch ? course.pre_launch_price : 
                  isOnSale ? course.sale_price : course.price;
                
                return (
                  <div key={course.id} className="group">
                    <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-border transition-all duration-300 hover:shadow-lg">
                      {/* Header */}
                      <div className="p-8 pb-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-green-500 rounded-sm"></div>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-1">
                                {course.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                {course.price === 0 && (
                                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-md">
                                    رایگان
                                  </span>
                                )}
                                {isOnPrelaunch && (
                                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-md">
                                    پیش‌فروش
                                  </span>
                                )}
                                {!isOnPrelaunch && isOnSale && (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md">
                                    تخفیف ویژه
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {course.price > 0 && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-foreground">
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
                        
                        <p className="text-muted-foreground leading-relaxed mb-8">
                          {course.description || 'دوره جامع و کاربردی برای پیشرفت در کسب‌وکار'}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Button 
                            asChild 
                            className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Link to={`/enroll?course=${course.slug}`}>
                              {course.price === 0 ? 'شروع دوره رایگان' : 'ثبت‌نام در دوره'}
                            </Link>
                          </Button>
                          
                          <Button asChild variant="outline" size="default" className="px-6">
                            <Link to={`/course/${course.slug}`}>
                              جزئیات
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

      {/* Courses CTA Section */}
      <section className="py-20 bg-background border-y border-border/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
                مجموعه کامل دوره‌های آموزشی
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                دسترسی به کلیه دوره‌های آموزشی آکادمی رفیعی در یک مکان
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90">
                <Link to="/courses">
                  مشاهده همه دوره‌ها
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                ۳۰+ دوره تخصصی
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Magazine CTA Section */}
      <section className="py-20 bg-muted/20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
                مجله آکادمی رفیعی
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                مقالات و تحلیل‌های تخصصی در حوزه کسب‌وکار و فناوری
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border hover:bg-muted">
                <Link to="/magazine">
                  مطالعه مجله
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                مقالات هفتگی
              </div>
            </div>
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
