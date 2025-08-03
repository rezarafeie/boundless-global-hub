
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
import { Star, Zap, Clock } from "lucide-react";

const Index = () => {
  const { translations } = useLanguage();
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [boundlessCourses, setBoundlessCourses] = useState<any[]>([]);

  // Countdown component
  const CountdownTimer = ({ endDate, label }: { endDate: string, label: string }) => {
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(endDate).getTime();
        const difference = end - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
          });
        } else {
          setTimeLeft(null);
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [endDate]);

    if (!timeLeft) return null;

    return (
      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">{label}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-background rounded p-2">
            <div className="text-lg font-bold text-foreground">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">روز</div>
          </div>
          <div className="bg-background rounded p-2">
            <div className="text-lg font-bold text-foreground">{timeLeft.hours}</div>
            <div className="text-xs text-muted-foreground">ساعت</div>
          </div>
          <div className="bg-background rounded p-2">
            <div className="text-lg font-bold text-foreground">{timeLeft.minutes}</div>
            <div className="text-xs text-muted-foreground">دقیقه</div>
          </div>
          <div className="bg-background rounded p-2">
            <div className="text-lg font-bold text-foreground">{timeLeft.seconds}</div>
            <div className="text-xs text-muted-foreground">ثانیه</div>
          </div>
        </div>
      </div>
    );
  };

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
        <section className="py-16 md:py-24 bg-background">
          <div className="container px-4">
            <div className="text-center mb-12 md:mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">هوش مصنوعی</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-foreground">
                دوره‌های هوش مصنوعی
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                آموزش عملی و کاربردی هوش مصنوعی برای تغییر زندگی و کسب‌وکار
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
              {featuredCourses.map((course) => {
                const isOnSale = course.is_sale_enabled && course.sale_price && 
                  (!course.sale_expires_at || new Date(course.sale_expires_at) > new Date());
                const isOnPrelaunch = course.is_pre_launch_enabled && course.pre_launch_price &&
                  (!course.pre_launch_ends_at || new Date(course.pre_launch_ends_at) > new Date());
                
                const currentPrice = isOnPrelaunch ? course.pre_launch_price : 
                  isOnSale ? course.sale_price : course.price;
                
                return (
                  <div key={course.id} className="group">
                    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden hover:border-border/80 hover:shadow-sm transition-all duration-300">
                      {/* Course Header */}
                      <div className="p-6 md:p-8">
                        {/* Course Info & Price */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
                              </div>
                              <h3 className="text-lg md:text-xl font-bold text-foreground truncate">
                                {course.title}
                              </h3>
                            </div>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              {course.price === 0 && (
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-md font-medium">
                                  رایگان
                                </span>
                              )}
                              {isOnPrelaunch && (
                                <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-md font-medium">
                                  پیش‌فروش
                                </span>
                              )}
                              {!isOnPrelaunch && isOnSale && (
                                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-md font-medium">
                                  تخفیف ویژه
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Price */}
                          {course.price > 0 && (
                            <div className="text-right ml-4">
                              <div className="text-xl md:text-2xl font-bold text-foreground">
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

                        {/* Countdown Timer - Show only one at a time */}
                        {isOnPrelaunch && course.pre_launch_ends_at ? (
                          <div className="mb-6">
                            <CountdownTimer endDate={course.pre_launch_ends_at} label="پایان پیش‌فروش" />
                          </div>
                        ) : isOnSale && course.sale_expires_at ? (
                          <div className="mb-6">
                            <CountdownTimer endDate={course.sale_expires_at} label="پایان تخفیف ویژه" />
                          </div>
                        ) : null}
                        
                        {/* Description */}
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 line-clamp-3">
                          {course.description || 'دوره جامع و کاربردی برای پیشرفت در هوش مصنوعی'}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <Button 
                            asChild 
                            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          >
                            <Link to={`/enroll?course=${course.slug}`}>
                              {course.price === 0 ? 'شروع دوره رایگان' : 'ثبت‌نام در دوره'}
                            </Link>
                          </Button>
                          
                          <Button asChild variant="outline" size="default" className="px-6 h-11 font-medium">
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
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container px-4">
            <div className="text-center mb-12 md:mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">بدون مرز</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-foreground">
                دوره‌های بدون مرز
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                سیستم علمی و عملی برای کارآفرینی موفق در سطح بین‌المللی
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
              {boundlessCourses.map((course) => {
                const isOnSale = course.is_sale_enabled && course.sale_price && 
                  (!course.sale_expires_at || new Date(course.sale_expires_at) > new Date());
                const isOnPrelaunch = course.is_pre_launch_enabled && course.pre_launch_price &&
                  (!course.pre_launch_ends_at || new Date(course.pre_launch_ends_at) > new Date());
                
                const currentPrice = isOnPrelaunch ? course.pre_launch_price : 
                  isOnSale ? course.sale_price : course.price;
                
                return (
                  <div key={course.id} className="group">
                    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden hover:border-border/80 hover:shadow-sm transition-all duration-300">
                      {/* Course Header */}
                      <div className="p-6 md:p-8">
                        {/* Course Info & Price */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
                              </div>
                              <h3 className="text-lg md:text-xl font-bold text-foreground truncate">
                                {course.title}
                              </h3>
                            </div>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              {course.price === 0 && (
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-md font-medium">
                                  رایگان
                                </span>
                              )}
                              {isOnPrelaunch && (
                                <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-md font-medium">
                                  پیش‌فروش
                                </span>
                              )}
                              {!isOnPrelaunch && isOnSale && (
                                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-md font-medium">
                                  تخفیف ویژه
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Price */}
                          {course.price > 0 && (
                            <div className="text-right ml-4">
                              <div className="text-xl md:text-2xl font-bold text-foreground">
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

                        {/* Countdown Timer - Show only one at a time */}
                        {isOnPrelaunch && course.pre_launch_ends_at ? (
                          <div className="mb-6">
                            <CountdownTimer endDate={course.pre_launch_ends_at} label="پایان پیش‌فروش" />
                          </div>
                        ) : isOnSale && course.sale_expires_at ? (
                          <div className="mb-6">
                            <CountdownTimer endDate={course.sale_expires_at} label="پایان تخفیف ویژه" />
                          </div>
                        ) : null}
                        
                        {/* Description */}
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 line-clamp-3">
                          {course.description || 'دوره جامع و کاربردی برای پیشرفت در کسب‌وکار'}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <Button 
                            asChild 
                            className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-medium"
                          >
                            <Link to={`/enroll?course=${course.slug}`}>
                              {course.price === 0 ? 'شروع دوره رایگان' : 'ثبت‌نام در دوره'}
                            </Link>
                          </Button>
                          
                          <Button asChild variant="outline" size="default" className="px-6 h-11 font-medium">
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
      <section className="py-16 md:py-20 bg-background border-y border-border/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 text-foreground">
                مجموعه کامل دوره‌های آموزشی
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                دسترسی به کلیه دوره‌های تخصصی آکادمی رفیعی
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 bg-foreground text-background hover:bg-foreground/90 font-medium">
                <Link to="/courses">
                  مشاهده همه دوره‌ها
                </Link>
              </Button>
              <div className="text-xs md:text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
                ۳۰+ دوره تخصصی
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Magazine CTA Section */}
      <section className="py-16 md:py-20 bg-muted/10">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 text-foreground">
                مجله آکادمی رفیعی
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                مقالات و تحلیل‌های تخصصی کسب‌وکار و فناوری
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-border hover:bg-muted/50 font-medium">
                <Link to="/magazine">
                  مطالعه مجله
                </Link>
              </Button>
              <div className="text-xs md:text-sm text-muted-foreground bg-background/80 px-3 py-2 rounded-full border border-border/20">
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
