
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
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50/50 via-background to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20 relative overflow-hidden">
          {/* Glowing background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container px-4 relative">
            <div className="text-center mb-12 md:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full mb-6 border border-blue-200/20 dark:border-blue-800/20">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">هوش مصنوعی</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  دوره‌های هوش مصنوعی
                </span>
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
                    <div className="relative">
                      {/* Glowing background effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"></div>
                      
                      <div className="relative bg-gradient-to-br from-white/80 via-white/60 to-blue-50/80 dark:from-gray-900/80 dark:via-gray-800/60 dark:to-blue-950/80 backdrop-blur-xl border border-blue-200/30 dark:border-blue-800/30 rounded-2xl overflow-hidden hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group-hover:scale-[1.02]">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        
                        {/* Course Header */}
                        <div className="p-6 md:p-8">
                          {/* Course Info & Price */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                  <div className="w-6 h-6 text-white">🤖</div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                                    {course.title}
                                  </h3>
                                  
                                  {/* Badges */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {course.price === 0 && (
                                      <span className="text-xs px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium shadow-sm">
                                        رایگان
                                      </span>
                                    )}
                                    {isOnPrelaunch && (
                                      <span className="text-xs px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-medium shadow-sm animate-pulse">
                                        پیش‌فروش
                                      </span>
                                    )}
                                    {!isOnPrelaunch && isOnSale && (
                                      <span className="text-xs px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium shadow-sm animate-pulse">
                                        تخفیف ویژه
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Price */}
                            {course.price > 0 && (
                              <div className="text-right ml-4">
                                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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

                          {/* Countdown Timer */}
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
                              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                            >
                              <Link to={`/enroll?course=${course.slug}`}>
                                {course.price === 0 ? '🚀 شروع دوره رایگان' : '🎯 ثبت‌نام در دوره'}
                              </Link>
                            </Button>
                            
                            <Button asChild variant="outline" size="default" className="px-6 h-12 font-medium border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/50">
                              <Link to={`/course/${course.slug}`}>
                                📋 جزئیات
                              </Link>
                            </Button>
                          </div>
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
        <section className="py-16 md:py-24 bg-gradient-to-br from-green-50/50 via-background to-emerald-50/30 dark:from-green-950/20 dark:via-background dark:to-emerald-950/20 relative overflow-hidden">
          {/* Glowing background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/5 to-emerald-400/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container px-4 relative">
            <div className="text-center mb-12 md:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-full mb-6 border border-green-200/20 dark:border-green-800/20">
                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">بدون مرز</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                  دوره‌های بدون مرز
                </span>
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
                    <div className="relative">
                      {/* Glowing background effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"></div>
                      
                      <div className="relative bg-gradient-to-br from-white/80 via-white/60 to-green-50/80 dark:from-gray-900/80 dark:via-gray-800/60 dark:to-green-950/80 backdrop-blur-xl border border-green-200/30 dark:border-green-800/30 rounded-2xl overflow-hidden hover:border-green-300/50 dark:hover:border-green-700/50 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 group-hover:scale-[1.02]">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        
                        {/* Course Header */}
                        <div className="p-6 md:p-8">
                          {/* Course Info & Price */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                                  <div className="w-6 h-6 text-white">🌍</div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-1 group-hover:text-green-600 transition-colors">
                                    {course.title}
                                  </h3>
                                  
                                  {/* Badges */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {course.price === 0 && (
                                      <span className="text-xs px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium shadow-sm">
                                        رایگان
                                      </span>
                                    )}
                                    {isOnPrelaunch && (
                                      <span className="text-xs px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-medium shadow-sm animate-pulse">
                                        پیش‌فروش
                                      </span>
                                    )}
                                    {!isOnPrelaunch && isOnSale && (
                                      <span className="text-xs px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium shadow-sm animate-pulse">
                                        تخفیف ویژه
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Price */}
                            {course.price > 0 && (
                              <div className="text-right ml-4">
                                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
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

                          {/* Countdown Timer */}
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
                              className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                            >
                              <Link to={`/enroll?course=${course.slug}`}>
                                {course.price === 0 ? '🚀 شروع دوره رایگان' : '🎯 ثبت‌نام در دوره'}
                              </Link>
                            </Button>
                            
                            <Button asChild variant="outline" size="default" className="px-6 h-12 font-medium border-green-200 hover:border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/50">
                              <Link to={`/course/${course.slug}`}>
                                📋 جزئیات
                              </Link>
                            </Button>
                          </div>
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
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-50/50 via-background to-gray-50/30 dark:from-slate-950/20 dark:via-background dark:to-gray-950/20 relative overflow-hidden border-y border-border/20">
        {/* Glowing background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue-500/10 backdrop-blur-sm rounded-full mb-6 border border-primary/20">
                <div className="w-2 h-2 bg-gradient-to-r from-primary to-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">مجموعه کامل</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                  همه دوره‌های آموزشی
                </span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                دسترسی به کلیه دوره‌های تخصصی، جامع و به‌روز آکادمی رفیعی در یک مکان
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto h-14 px-10 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 group"
              >
                <Link to="/courses" className="flex items-center gap-2">
                  <span>📚 مشاهده همه دوره‌ها</span>
                </Link>
              </Button>
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>۳۰+ دوره تخصصی فعال</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Magazine CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-purple-50/50 via-background to-pink-50/30 dark:from-purple-950/20 dark:via-background dark:to-pink-950/20 relative overflow-hidden">
        {/* Glowing background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-32 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-full mb-6 border border-purple-200/20 dark:border-purple-800/20">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">مطالب ویژه</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  مجله آکادمی رفیعی
                </span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                مقالات تخصصی، تحلیل‌های عمیق و آخرین اخبار دنیای کسب‌وکار و فناوری
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-14 px-10 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/50 font-medium transition-all duration-300 group backdrop-blur-sm"
              >
                <Link to="/magazine" className="flex items-center gap-2">
                  <span>📖 مطالعه مجله</span>
                </Link>
              </Button>
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200/30 dark:border-purple-800/30">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>مطالب هفتگی جدید</span>
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
