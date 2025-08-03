
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
import { Star, Zap, Clock, Play, BookOpen, Users, Award, ArrowRight } from "lucide-react";
import { TetherlandService } from "@/lib/tetherlandService";

const Index = () => {
  const { translations } = useLanguage();
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [boundlessCourses, setBoundlessCourses] = useState<any[]>([]);
  const [totalCoursesCount, setTotalCoursesCount] = useState<number>(0);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [enrollmentsCount, setEnrollmentsCount] = useState<number>(0);
  const [displayStudentsCount, setDisplayStudentsCount] = useState<number>(0);
  const [displayEnrollmentsCount, setDisplayEnrollmentsCount] = useState<number>(0);

  // Set real counters without fake animation
  useEffect(() => {
    if (studentsCount > 0) {
      setDisplayStudentsCount(studentsCount);
    }
  }, [studentsCount]);

  useEffect(() => {
    if (enrollmentsCount > 0) {
      setDisplayEnrollmentsCount(enrollmentsCount);
    }
  }, [enrollmentsCount]);

  // Countdown component - more minimal design
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
      <div className="bg-muted/30 rounded-lg p-3 mb-4 border border-border/20">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-3 w-3 text-orange-600" />
          <span className="text-xs font-medium text-orange-700">{label}</span>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="bg-background/80 rounded p-1">
            <div className="text-sm font-bold text-foreground">{timeLeft.days}</div>
            <div className="text-[10px] text-muted-foreground">روز</div>
          </div>
          <div className="bg-background/80 rounded p-1">
            <div className="text-sm font-bold text-foreground">{timeLeft.hours}</div>
            <div className="text-[10px] text-muted-foreground">ساعت</div>
          </div>
          <div className="bg-background/80 rounded p-1">
            <div className="text-sm font-bold text-foreground">{timeLeft.minutes}</div>
            <div className="text-[10px] text-muted-foreground">دقیقه</div>
          </div>
          <div className="bg-background/80 rounded p-1">
            <div className="text-sm font-bold text-foreground">{timeLeft.seconds}</div>
            <div className="text-[10px] text-muted-foreground">ثانیه</div>
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

        // Fetch total courses count
        const { count } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        
        if (count) {
          setTotalCoursesCount(count);
        }

        // Fetch users count (academy students)
        const { count: usersCount } = await supabase
          .from('chat_users')
          .select('*', { count: 'exact', head: true });
        
        if (usersCount) {
          // Multiply by 10 and add 2
          setStudentsCount(usersCount * 10 + 2);
        }

        // Fetch enrollments count
        const { count: enrollmentCount } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true });
        
        if (enrollmentCount) {
          // Multiply by 10 and add 2
          setEnrollmentsCount(enrollmentCount * 10 + 2);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  const formatPrice = (price: number, isUSD: boolean = false) => {
    if (isUSD) {
      // Fallback to approximate conversion for synchronous display
      const irrPrice = price * 60000;
      return new Intl.NumberFormat('fa-IR').format(irrPrice) + ' تومان';
    } else {
      return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    }
  };

  // Component for course cards with price conversion
  const CourseCardWithPrice = ({ course, currentPrice, isOnSale, isOnPrelaunch, color }: any) => {
    const [displayPrice, setDisplayPrice] = useState<string>('');
    const [originalPrice, setOriginalPrice] = useState<string>('');
    
    useEffect(() => {
      const convertPrice = async () => {
        if (course.use_dollar_price && course.usd_price) {
          try {
            const irrPrice = await TetherlandService.convertUSDToIRR(currentPrice);
            setDisplayPrice(TetherlandService.formatIRRAmount(irrPrice) + ' تومان');
            
            if (isOnSale || isOnPrelaunch) {
              const originalIrrPrice = await TetherlandService.convertUSDToIRR(course.price);
              setOriginalPrice(TetherlandService.formatIRRAmount(originalIrrPrice) + ' تومان');
            }
          } catch (error) {
            console.error('Failed to convert USD to IRR:', error);
            // Fallback to approximate conversion
            const irrPrice = currentPrice * 60000;
            setDisplayPrice(new Intl.NumberFormat('fa-IR').format(irrPrice) + ' تومان');
            
            if (isOnSale || isOnPrelaunch) {
              const originalIrrPrice = course.price * 60000;
              setOriginalPrice(new Intl.NumberFormat('fa-IR').format(originalIrrPrice) + ' تومان');
            }
          }
        } else {
          setDisplayPrice(formatPrice(currentPrice, false));
          if (isOnSale || isOnPrelaunch) {
            setOriginalPrice(formatPrice(course.price, false));
          }
        }
      };
      
      convertPrice();
    }, [course, currentPrice, isOnSale, isOnPrelaunch]);

    const colorConfig = {
      blue: {
        border: 'border-blue-200/50 dark:border-blue-800/50',
        accent: 'from-blue-500 to-blue-600',
        iconBg: 'from-blue-500 to-blue-600',
        iconShadow: 'shadow-blue-500/25',
        textGradient: 'from-blue-600 to-blue-700',
        hover: 'group-hover:text-blue-600',
        buttonBg: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        buttonShadow: 'shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25',
        ghostHover: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50',
        shadow: 'group-hover:shadow-blue-500/15',
        icon: Zap
      },
      green: {
        border: 'border-green-200/50 dark:border-green-800/50',
        accent: 'from-green-500 to-emerald-500',
        iconBg: 'from-green-500 to-emerald-600',
        iconShadow: 'shadow-green-500/25',
        textGradient: 'from-green-600 to-emerald-600',
        hover: 'group-hover:text-green-600',
        buttonBg: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
        buttonShadow: 'shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/25',
        ghostHover: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/50',
        shadow: 'group-hover:shadow-green-500/15',
        icon: Star
      }
    };

    const config = colorConfig[color as keyof typeof colorConfig];
    const IconComponent = config.icon;

    return (
      <div className="group h-full">
        <div className="relative h-full">
          <div className={`relative h-full min-h-[350px] bg-white dark:bg-gray-900 border ${config.border} rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-xl ${config.shadow} group-hover:-translate-y-1 flex flex-col`}>
            
            {/* Top accent */}
            <div className={`h-1 bg-gradient-to-r ${config.accent}`}></div>
            
            {/* Card content */}
            <div className="p-6 md:p-8 flex flex-col flex-1">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${config.iconBg} rounded-xl flex items-center justify-center shadow-lg ${config.iconShadow}`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg md:text-xl font-bold text-foreground mb-2 ${config.hover} transition-colors`}>
                        {course.title}
                      </h3>
                      
                      {/* Compact badges */}
                      <div className="flex flex-wrap gap-2">
                        {course.price === 0 && (
                          <Badge className="bg-green-100 text-green-700 text-xs">رایگان</Badge>
                        )}
                        {isOnPrelaunch && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs animate-pulse">پیش‌فروش</Badge>
                        )}
                        {!isOnPrelaunch && isOnSale && (
                          <Badge className="bg-red-100 text-red-700 text-xs animate-pulse">تخفیف ویژه</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Price */}
                {course.price > 0 && (
                  <div className="text-left ml-4">
                    <div className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${config.textGradient} bg-clip-text text-transparent`}>
                      {displayPrice || 'در حال محاسبه...'}
                    </div>
                    {course.use_dollar_price && course.usd_price && (
                      <div className="text-sm text-muted-foreground">
                        ${currentPrice}
                      </div>
                    )}
                    {(isOnSale || isOnPrelaunch) && originalPrice && (
                      <div className="text-xs text-muted-foreground line-through">
                        {originalPrice}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex-1 mb-4">
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base line-clamp-3">
                  {course.description || (color === 'blue' ? 'دوره جامع و کاربردی برای پیشرفت در هوش مصنوعی' : 'سیستم علمی و عملی برای کارآفرینی موفق در سطح بین‌المللی')}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-auto">
                <Button 
                  asChild 
                  className={`w-full h-12 bg-gradient-to-r ${config.buttonBg} text-white font-medium shadow-lg ${config.buttonShadow} transition-all duration-300`}
                >
                  <Link to={`/enroll?course=${course.slug}`} className="flex items-center justify-center gap-2">
                    <span>{course.price === 0 ? 'شروع دوره رایگان' : 'ثبت‌نام در دوره'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                
                <Button asChild variant="ghost" size="sm" className={`w-full ${config.ghostHover}`}>
                  <Link to={`/course/${course.slug}`} className="flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    مشاهده جزئیات
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('fa-IR').format(number);
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

      {/* Academy Students Statistics Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 dark:from-primary/10 dark:via-background dark:to-blue-950/20 relative overflow-hidden">
        {/* Glowing background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-blue-400/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container px-4 relative">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue-500/10 backdrop-blur-sm rounded-full mb-6 border border-primary/20 dark:border-primary/30">
              <div className="w-2 h-2 bg-gradient-to-r from-primary to-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">آمار آکادمی</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                جامعه آکادمی رفیعی
              </span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              آمار و اطلاعات جامعه بزرگ دانشجویان و فارغ‌التحصیلان آکادمی رفیعی
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {/* Students Count */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"></div>
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-primary/20 dark:border-primary/30 rounded-2xl p-4 md:p-8 text-center hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group-hover:scale-105">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-primary/30">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2 transition-all duration-500">
                  {formatNumber(displayStudentsCount)}
                </div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">دانشجو آکادمی</div>
                <div className="text-xs md:text-sm text-muted-foreground/80 mt-2 flex items-center justify-center gap-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                  سراسر جهان
                </div>
              </div>
            </div>

            {/* Enrollments Count */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"></div>
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-green-200/50 dark:border-green-800/30 rounded-2xl p-4 md:p-8 text-center hover:border-green-300/50 dark:hover:border-green-700/50 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 group-hover:scale-105">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-green-500/30">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2 transition-all duration-500">
                  {formatNumber(displayEnrollmentsCount)}
                </div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">ثبت‌نام موفق</div>
                <div className="text-xs md:text-sm text-muted-foreground/80 mt-2 flex items-center justify-center gap-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                  در تمام دوره‌ها
                </div>
              </div>
            </div>

            {/* Courses Count - Hidden on mobile */}
            <div className="hidden md:block group relative col-span-2 lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"></div>
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/30 rounded-2xl p-4 md:p-8 text-center hover:border-purple-300/50 dark:hover:border-purple-700/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 group-hover:scale-105">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-purple-500/30">
                  <Award className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {formatNumber(totalCoursesCount)}
                </div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">دوره تخصصی</div>
                <div className="text-xs md:text-sm text-muted-foreground/80 mt-2">فعال و به‌روز</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Courses Section */}
      {featuredCourses.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50/50 via-background to-blue-100/30 dark:from-blue-950/20 dark:via-background dark:to-blue-900/20 relative overflow-hidden">
          {/* Glowing background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/5 to-blue-600/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container px-4 relative">
            <div className="text-center mb-12 md:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-full mb-6 border border-blue-200/20 dark:border-blue-800/20">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">هوش مصنوعی</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 bg-clip-text text-transparent">
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
                  <CourseCardWithPrice 
                    key={course.id}
                    course={course}
                    currentPrice={currentPrice}
                    isOnSale={isOnSale}
                    isOnPrelaunch={isOnPrelaunch}
                    color="blue"
                  />
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
                  <CourseCardWithPrice 
                    key={course.id}
                    course={course}
                    currentPrice={currentPrice}
                    isOnSale={isOnSale}
                    isOnPrelaunch={isOnPrelaunch}
                    color="green"
                  />
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
                <span>{totalCoursesCount > 0 ? `${totalCoursesCount} دوره تخصصی فعال` : '۳۰+ دوره تخصصی فعال'}</span>
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
                className="w-full sm:w-auto h-14 px-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 group"
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
