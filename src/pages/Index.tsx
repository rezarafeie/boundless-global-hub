
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { ServiceGroupSection } from "@/components/Services/ServicesShowcase";
import FounderStory from "@/components/FounderStory";
import PhotoQuote from "@/components/PhotoQuote";
import { courseImage } from "@/lib/academyImagery";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import IRClassBanner from "@/components/IRClassBanner";
import IranCourseBanner from "@/components/IranCourseBanner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Star, Zap, Clock, ArrowLeft } from "lucide-react";
import { TetherlandService } from "@/lib/tetherlandService";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import QuickEnrollPopover from "@/components/Course/QuickEnrollPopover";

const Index = () => {
  const { translations } = useLanguage();
  const { isActive: isBlackFridayActive, getCourseDiscount } = useBlackFridayContext();
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
          <Clock className="h-3 w-3 text-foreground" />
          <span className="text-xs font-medium text-foreground">{label}</span>
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
  const CourseCardWithPrice = ({ course, currentPrice, isOnSale, isOnPrelaunch, isBlackFriday, color }: any) => {
    const [displayPrice, setDisplayPrice] = useState<string>('');
    const [originalPrice, setOriginalPrice] = useState<string>('');
    
    useEffect(() => {
      const convertPrice = async () => {
        if (course.use_dollar_price && course.usd_price) {
          try {
            const irrPrice = await TetherlandService.convertUSDToIRR(currentPrice);
            setDisplayPrice(TetherlandService.formatIRRAmount(irrPrice) + ' تومان');
            
            if (isOnSale || isOnPrelaunch) {
              const originalIrrPrice = await TetherlandService.convertUSDToIRR(course.usd_price);
              setOriginalPrice(TetherlandService.formatIRRAmount(originalIrrPrice) + ' تومان');
            }
          } catch (error) {
            console.error('Failed to convert USD to IRR:', error);
            // Fallback to approximate conversion
            const irrPrice = currentPrice * 60000;
            setDisplayPrice(new Intl.NumberFormat('fa-IR').format(irrPrice) + ' تومان');
            
            if (isOnSale || isOnPrelaunch) {
              const originalIrrPrice = course.use_dollar_price ? course.usd_price * 60000 : course.price;
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
        border: 'border-border/50 dark:border-border/50',
        accent: 'from-foreground to-foreground',
        iconBg: 'from-foreground to-foreground',
        iconShadow: 'shadow-foreground/10',
        textGradient: 'from-foreground to-foreground',
        hover: 'group-hover:text-foreground',
        buttonBg: 'from-foreground to-foreground hover:from-foreground hover:to-foreground',
        buttonShadow: 'shadow-foreground/10 hover:shadow-xl hover:shadow-foreground/10',
        ghostHover: 'text-foreground hover:text-foreground hover:bg-muted dark:hover:bg-card/50',
        shadow: 'group-hover:shadow-foreground/10',
        icon: Zap
      },
      green: {
        border: 'border-border/50 dark:border-border/50',
        accent: 'from-foreground to-foreground',
        iconBg: 'from-foreground to-foreground',
        iconShadow: 'shadow-foreground/10',
        textGradient: 'from-foreground to-foreground',
        hover: 'group-hover:text-foreground',
        buttonBg: 'from-foreground to-foreground hover:from-foreground hover:to-foreground',
        buttonShadow: 'shadow-foreground/10 hover:shadow-xl hover:shadow-foreground/10',
        ghostHover: 'text-foreground hover:text-foreground hover:bg-muted dark:hover:bg-card/50',
        shadow: 'group-hover:shadow-foreground/10',
        icon: Star
      }
    };

    const config = colorConfig[color as keyof typeof colorConfig];
    const IconComponent = config.icon;

    const tag = course.price === 0 ? 'رایگان' : isOnPrelaunch ? 'پیش‌فروش' : isBlackFriday ? 'بلک فرایدی' : isOnSale ? 'تخفیف ویژه' : null;
    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-float">
        <Link to={`/courses/${course.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-photo-shade">
          <img src={courseImage(course.slug, course.title)} alt={course.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-photo-shade via-photo-shade/30 to-transparent" />
          {tag && <span className="absolute right-4 top-4 rounded-full border border-photo-ink/20 bg-photo-shade/40 px-3 py-1 text-xs font-medium text-photo-ink backdrop-blur-md">{tag}</span>}
          <h3 className="absolute inset-x-5 bottom-5 text-2xl font-extrabold leading-snug text-photo-ink md:text-[1.7rem]">{course.title}</h3>
        </Link>
        <div className="flex flex-1 flex-col gap-5 p-5 md:p-6">
          <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">
            {course.description || (color === 'blue' ? 'دوره جامع و کاربردی برای پیشرفت در هوش مصنوعی' : 'سیستم علمی و عملی برای کارآفرینی موفق در سطح بین‌المللی')}
          </p>
          <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-5">
            <div>
              <div className="text-xs text-muted-foreground">{course.price === 0 ? 'هزینه' : 'سرمایه‌گذاری'}</div>
              <div className="mt-1 text-lg font-extrabold text-foreground">{course.price === 0 ? 'رایگان' : (displayPrice || '...')}</div>
              {(isOnSale || isOnPrelaunch) && originalPrice && <div className="text-xs text-muted-foreground line-through">{originalPrice}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/courses/${course.slug}`} className="hidden h-11 items-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex">جزئیات</Link>
              <QuickEnrollPopover courseSlug={course.slug} fallbackHref={`/enroll?course=${course.slug}`}>
                <Button className="h-11 rounded-full px-5">
                  {course.price === 0 ? 'شروع رایگان' : 'ثبت‌نام'}
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </QuickEnrollPopover>
            </div>
          </div>
        </div>
      </article>
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

  const priced = (course: any) => {
    const isOnSale = course.is_sale_enabled && course.sale_price && (!course.sale_expires_at || new Date(course.sale_expires_at) > new Date());
    const isOnPrelaunch = course.is_pre_launch_enabled && course.pre_launch_price && (!course.pre_launch_ends_at || new Date(course.pre_launch_ends_at) > new Date());
    const basePrice = course.use_dollar_price ? course.usd_price : course.price;
    // Same priority as checkout: pre-launch, sale, then Black Friday
    const bf = !isOnPrelaunch && !isOnSale && isBlackFridayActive ? getCourseDiscount(course.id) : 0;
    const currentPrice = isOnPrelaunch ? course.pre_launch_price : isOnSale ? course.sale_price : bf > 0 ? basePrice * (1 - bf / 100) : basePrice;
    return { isOnSale: isOnSale || bf > 0, isOnPrelaunch, currentPrice, isBlackFriday: bf > 0 };
  };

  const CourseRow = ({ eyebrow, title, sub, courses, color }: { eyebrow: string; title: string; sub: string; courses: any[]; color: string }) =>
    courses.length === 0 ? null : (
      <section className="px-4 py-16 md:py-24">
        <div className="container mx-auto">
          <div className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">{eyebrow}</span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-foreground md:text-5xl">{title}</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{sub}</p>
            </div>
            <Link to="/courses" className="group inline-flex items-center gap-2 self-start text-sm font-semibold text-foreground md:self-auto">
              همه دوره‌ها
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-transform group-hover:-translate-x-1"><ArrowLeft className="h-4 w-4" /></span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {courses.map((course) => {
              const p = priced(course);
              return <CourseCardWithPrice key={course.id} course={course} {...p} color={color} />;
            })}
          </div>
        </div>
      </section>
    );

  const stats = [
    { value: displayStudentsCount, label: 'دانشجو در سراسر جهان' },
    { value: displayEnrollmentsCount, label: 'ثبت‌نام موفق' },
    { value: totalCoursesCount, label: 'دوره فعال و به‌روز' },
  ];

  return (
    <MainLayout>

      <Hero ctaText="مشاهده دوره‌ها" ctaLink="/courses" />

      <section className="px-4 pt-10 md:pt-14">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border rounded-[2rem] border border-border bg-card">
            {stats.map((st) => (
              <div key={st.label} className="px-3 py-6 text-center md:py-10">
                <div className="text-2xl font-extrabold tracking-tight text-foreground md:text-5xl">{st.value ? formatNumber(st.value) : '—'}</div>
                <div className="mt-2 text-xs text-muted-foreground md:text-sm">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceGroupSection group="learning" />

      <CourseRow eyebrow="مسیر بدون مرز" title="زندگی و درآمدی که به جغرافیا محدود نیست" sub="از اولین قدم تا ساختن کسب‌وکار بین‌المللی؛ مسیری که هزاران نفر پیش از تو رفته‌اند." courses={boundlessCourses} color="green" />

      <ServiceGroupSection group="ai" />

      <FounderStory />

      <ServiceGroupSection group="business" />

      <CourseRow eyebrow="هوش مصنوعی" title="ابزاری که آینده را می‌سازد، امروز در دست توست" sub="آموزش عملی هوش مصنوعی برای زندگی هوشمندتر و کسب‌وکاری که سریع‌تر رشد می‌کند." courses={featuredCourses} color="blue" />

      <ServiceGroupSection group="finance" />

      <section className="px-4 pb-4">
        <div className="container mx-auto space-y-4">
          <IRClassBanner />
          <IranCourseBanner />
        </div>
      </section>

      <PhotoQuote />
    </MainLayout>
  );
};

export default Index;
