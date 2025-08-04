import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/Layout/MainLayout';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Star, 
  Zap, 
  Brain, 
  Globe, 
  ShieldCheck, 
  MessageCircle,
  Play,
  CheckCircle,
  ArrowRight,
  Instagram,
  Youtube,
  Linkedin
} from 'lucide-react';

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const CounterAnimation = ({ end, suffix = "", duration = 2 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const RezaRafiei = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const projects = [
    {
      name: "Rafiei Academy",
      description: "آکادمی آنلاین، مرکز آزمون، CRM، پشتیبانی و پلیر ویدیو",
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-blue-500"
    },
    {
      name: "Rafiei Exchange",
      description: "صرافی آنلاین و خدمات درآمد دلاری",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-green-500"
    },
    {
      name: "KYC Service",
      description: "احراز هویت برای Stripe، Upwork، Wise و سایر پلتفرم‌ها",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "bg-purple-500"
    },
    {
      name: "Synapse Platform",
      description: "ساخت هوش مصنوعی شخصی با n8n + Supabase",
      icon: <Brain className="w-6 h-6" />,
      color: "bg-orange-500"
    },
    {
      name: "BNETS VPN",
      description: "فیلترشکن اختصاصی برای کاربران ایرانی",
      icon: <Globe className="w-6 h-6" />,
      color: "bg-red-500"
    },
    {
      name: "AI Newsroom",
      description: "خبرخوان هوشمند مبتنی بر هوش مصنوعی",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-yellow-500"
    },
    {
      name: "Boundless Global Hub",
      description: "پلتفرم فرانت‌اند با Vite + Lovable",
      icon: <Users className="w-6 h-6" />,
      color: "bg-indigo-500"
    },
    {
      name: "Vetamerse",
      description: "آکادمی و آژانس Web3 با خدمات NFT و متاورس",
      icon: <Trophy className="w-6 h-6" />,
      color: "bg-pink-500"
    },
    {
      name: "3ocialc Platform",
      description: "آکادمی شبکه‌های اجتماعی و بازاریابی دیجیتال",
      icon: <MessageCircle className="w-6 h-6" />,
      color: "bg-cyan-500"
    }
  ];

  const courses = [
    {
      title: "شروع بدون مرز",
      students: "50,000+",
      description: "کورس جامع کسب درآمد آنلاین و کارآفرینی دیجیتال",
      featured: true
    },
    {
      title: "پکیج مهارت AI + سیستم زندگی AI",
      students: "25,000+",
      description: "یادگیری کامل هوش مصنوعی و پیاده‌سازی در زندگی"
    },
    {
      title: "پروژه درآمد غیرفعال",
      students: "30,000+",
      description: "فروش فایل، دراپ شیپینگ و ایجاد منابع درآمد پایدار"
    },
    {
      title: "پروژه تغییر",
      students: "40,000+",
      description: "تغییر سبک زندگی و تحول ذهنیت برای موفقیت"
    },
    {
      title: "امپراطوری متاورس",
      students: "15,000+",
      description: "Web3، NFT، متاورس و ارزهای دیجیتال"
    },
    {
      title: "امپراطوری اینستاگرام",
      students: "20,000+",
      description: "استراتژی‌های پیشرفته اینستاگرام و درآمدزایی"
    },
    {
      title: "سیستم تست‌های روانشناسی",
      students: "25,000+",
      description: "21 تست تخصصی روانشناسی و شخصیت‌شناسی"
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                      کارآفرین و کوچ بین‌المللی کسب‌وکار
                    </Badge>
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-5xl lg:text-6xl font-bold text-foreground leading-tight"
                  >
                    رضا رفیعی
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-xl text-muted-foreground leading-relaxed"
                  >
                    کوچ بین‌المللی کسب‌وکار، کارآفرین دیجیتال و استراتژیست هوش مصنوعی با بیش از 12 سال تجربه در ساخت آکادمی‌های آنلاین، پلتفرم‌های مالی و راه‌حل‌های تجاری مبتنی بر AI
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button size="lg" className="px-8 py-3 text-lg">
                    <MessageCircle className="w-5 h-5 ml-2" />
                    تماس با رضا رفیعی
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                    <Play className="w-5 h-5 ml-2" />
                    مشاهده معرفی
                  </Button>
                </motion.div>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="flex gap-4"
                >
                  <Button variant="ghost" size="icon">
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Youtube className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Linkedin className="w-5 h-5" />
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/lovable-uploads/58eb2194-26f5-44c6-bcbb-9ca46bc31591.png"
                    alt="رضا رفیعی"
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Floating achievement cards */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute -top-6 -right-6 bg-background/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      <CounterAnimation end={100} suffix="+" />K
                    </div>
                    <div className="text-sm text-muted-foreground">دانشجو</div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="absolute -bottom-6 -left-6 bg-background/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      <CounterAnimation end={250} suffix="K" />
                    </div>
                    <div className="text-sm text-muted-foreground">فالوور</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Biography Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl font-bold mb-8">داستان موفقیت</h2>
                <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    رضا رفیعی در سال ۱۳۹۰ با یک ایده ساده شروع کرد: کمک به افراد برای رسیدن به آزادی مالی و موفقیت در کسب‌وکار آنلاین. آنچه به عنوان یک پروژه کوچک آغاز شد، امروز به بزرگترین اکوسیستم آموزشی و تجاری در ایران تبدیل شده است.
                  </p>
                  <p>
                    با تکیه بر تجربه‌های بین‌المللی و درک عمیق از نیازهای بازار ایران، او موفق شد پلتفرم‌هایی ایجاد کند که نه تنها مشکلات موجود را حل می‌کنند، بلکه فرصت‌های جدیدی را نیز خلق می‌کنند.
                  </p>
                  <p>
                    امروز، رضا رفیعی نه تنها یک کارآفرین موفق است، بلکه الهام‌بخش هزاران نفر در سراسر جهان محسوب می‌شود که از آموزه‌ها و راه‌حل‌های او برای تغییر زندگی خود استفاده کرده‌اند.
                  </p>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <div className="text-2xl font-bold text-primary mb-2">2011</div>
                    <div className="text-sm text-muted-foreground">سال شروع فعالیت</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-xl">
                    <div className="text-2xl font-bold text-primary mb-2">185K+</div>
                    <div className="text-sm text-muted-foreground">تعداد دانشجویان</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/lovable-uploads/614a3597-7eaa-4c60-8779-4fcf45d2c5a0.png"
                    alt="رضا رفیعی در حال تفکر"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-8 -right-8 bg-primary/10 backdrop-blur-sm rounded-xl p-6 border">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">12+</div>
                    <div className="text-sm text-muted-foreground">سال تجربه</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* Skills & Expertise Section */}
        <AnimatedSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">تخصص‌ها و مهارت‌ها</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                حوزه‌های تخصصی که رضا رفیعی در آن‌ها صاحب‌نظر و پیشرو است
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { skill: "هوش مصنوعی و اتوماسیون", level: 95, icon: <Brain className="w-6 h-6" /> },
                { skill: "کسب‌وکار آنلاین", level: 98, icon: <TrendingUp className="w-6 h-6" /> },
                { skill: "آموزش و کوچینگ", level: 92, icon: <BookOpen className="w-6 h-6" /> },
                { skill: "توسعه پلتفرم", level: 88, icon: <Zap className="w-6 h-6" /> },
                { skill: "استراتژی بازاریابی", level: 90, icon: <MessageCircle className="w-6 h-6" /> },
                { skill: "مدیریت پروژه", level: 94, icon: <CheckCircle className="w-6 h-6" /> },
                { skill: "تحلیل داده", level: 85, icon: <Trophy className="w-6 h-6" /> },
                { skill: "رهبری تیم", level: 96, icon: <Users className="w-6 h-6" /> }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-background rounded-xl p-6 shadow-sm border"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {item.icon}
                    </div>
                    <div className="text-sm font-medium">{item.skill}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>تسلط</span>
                      <span>{item.level}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.level}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                        className="bg-primary h-2 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Timeline Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">مسیر موفقیت</h2>
              <p className="text-xl text-muted-foreground">
                نگاهی به مهم‌ترین نقاط عطف در مسیر حرفه‌ای رضا رفیعی
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-primary/20"></div>
                
                {[
                  { year: "2011", title: "شروع فعالیت", desc: "آغاز کار در حوزه کسب‌وکار آنلاین", image: "/lovable-uploads/c3031500-e046-4713-8ad7-d71ec299ba3a.png" },
                  { year: "2015", title: "راه‌اندازی آکادمی رفیعی", desc: "ایجاد اولین پلتفرم آموزشی جامع", image: "/lovable-uploads/1446e6ad-f2c2-4466-9508-8326d60a44d3.png" },
                  { year: "2018", title: "گسترش بین‌المللی", desc: "حضور در بازارهای بین‌المللی و کنفرانس‌ها", image: "/lovable-uploads/dfe27f49-6775-47e3-be1e-78c133be4b47.png" },
                  { year: "2020", title: "انقلاب دیجیتال", desc: "راه‌اندازی پلتفرم‌های هوش مصنوعی", image: "/lovable-uploads/f3ccf762-5b2a-4b10-bd9c-c03d041733c0.png" },
                  { year: "2022", title: "رهبری در صنعت", desc: "تبدیل شدن به یکی از بزرگترین آکادمی‌های ایران", image: "/lovable-uploads/8c694d79-102b-4384-8079-27f21653bf22.png" },
                  { year: "2024", title: "نوآوری مداوم", desc: "معرفی جدیدترین فناوری‌ها و خدمات", image: "/lovable-uploads/467f6d9c-6efc-4b2c-9ef6-6b90f9a8c223.png" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                    className="relative flex items-center gap-8 mb-12"
                  >
                    <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold relative z-10">
                      {item.year.slice(-2)}
                    </div>
                    
                    <div className="flex-1 bg-background rounded-xl p-6 shadow-sm border">
                      <div className="grid lg:grid-cols-3 gap-6 items-center">
                        <div className="lg:col-span-2">
                          <div className="text-2xl font-bold mb-2">{item.title}</div>
                          <div className="text-primary font-semibold mb-2">{item.year}</div>
                          <p className="text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="rounded-lg overflow-hidden">
                          <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Media & Recognition Section */}
        <AnimatedSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">حضور رسانه‌ای و بازتاب</h2>
              <p className="text-xl text-muted-foreground">
                سخنرانی‌ها، مصاحبه‌ها و حضور در رسانه‌های معتبر
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  type: "سخنرانی اصلی",
                  title: "کنفرانس بین‌المللی کسب‌وکار",
                  audience: "2000+ شرکت‌کننده",
                  image: "/lovable-uploads/8c694d79-102b-4384-8079-27f21653bf22.png"
                },
                {
                  type: "پادکست",
                  title: "آینده هوش مصنوعی در ایران",
                  audience: "500K+ بازدید",
                  image: "/lovable-uploads/1446e6ad-f2c2-4466-9508-8326d60a44d3.png"
                },
                {
                  type: "وبینار",
                  title: "استراتژی‌های اینستاگرام 2024",
                  audience: "10K+ شرکت‌کننده زنده",
                  image: "/lovable-uploads/467f6d9c-6efc-4b2c-9ef6-6b90f9a8c223.png"
                },
                {
                  type: "مصاحبه تلویزیونی",
                  title: "تحول دیجیتال در ایران",
                  audience: "1M+ بیننده",
                  image: "/lovable-uploads/63ba8c2b-2d68-40ca-8b64-fcc18e358c69.png"
                },
                {
                  type: "کارگاه آموزشی",
                  title: "ساخت کسب‌وکار با 3Social",
                  audience: "300+ شرکت‌کننده",
                  image: "/lovable-uploads/41e5c5a4-c76e-4503-b7ea-8a5499daf1d7.png"
                },
                {
                  type: "نشست خبری",
                  title: "معرفی پلتفرم‌های جدید 2024",
                  audience: "50+ رسانه",
                  image: "/lovable-uploads/c8034ca1-dce4-43d1-bbb2-978c218e7e7c.png"
                }
              ].map((media, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-background rounded-xl overflow-hidden shadow-sm border"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img src={media.image} alt={media.title} className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary">{media.type}</Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2">{media.title}</h3>
                    <p className="text-primary font-semibold">{media.audience}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Success Stories & Testimonials */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">داستان‌های موفقیت</h2>
              <p className="text-xl text-muted-foreground">
                تجربیات واقعی دانشجویان و مشتریان موفق
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "محمد احمدی",
                  role: "کارآفرین دیجیتال",
                  story: "با کمک دوره شروع بدون مرز، توانستم کسب‌وکار آنلاین خودم را راه‌اندازی کنم و در عرض 6 ماه به درآمد ماهانه 50 میلیون تومان برسم.",
                  revenue: "50M تومان/ماه",
                  course: "شروع بدون مرز"
                },
                {
                  name: "فاطمه کریمی",
                  role: "متخصص هوش مصنوعی",
                  story: "پکیج AI Life System زندگی من را کاملاً تغییر داد. حالا با ابزارهای هوش مصنوعی، کارم را 10 برابر سریع‌تر انجام می‌دهم.",
                  revenue: "300% افزایش بهره‌وری",
                  course: "AI Life System"
                },
                {
                  name: "علی رضایی",
                  role: "کسب‌وکار اینستاگرام",
                  story: "امپراطوری اینستاگرام به من کمک کرد فالوورهایم را از 2 هزار به 100 هزار نفر برسانم و درآمد ثابت ماهانه داشته باشم.",
                  revenue: "100K فالوور",
                  course: "امپراطوری اینستاگرام"
                },
                {
                  name: "سارا موسوی",
                  role: "فریلنسر",
                  story: "با آموزش‌های پروژه درآمد غیرفعال، چندین منبع درآمد ایجاد کردم که حتی در خواب هم برایم پول درمی‌آورد.",
                  revenue: "5 منبع درآمد غیرفعال",
                  course: "پروژه درآمد غیرفعال"
                },
                {
                  name: "امیرحسین نوری",
                  role: "توسعه‌دهنده وب",
                  story: "دوره متاورس و Web3 به من کمک کرد تا در این حوزه نوپا پیشرو باشم و پروژه‌های بزرگی را مدیریت کنم.",
                  revenue: "پیشرو در Web3",
                  course: "امپراطوری متاورس"
                },
                {
                  name: "مریم زارعی",
                  role: "مشاور کسب‌وکار",
                  story: "پروژه تغییر نه تنها کسب‌وکارم را تغییر داد، بلکه نگرش من به زندگی را نیز متحول کرد. حالا با اعتماد به نفس بیشتری کار می‌کنم.",
                  revenue: "تحول کامل شخصیت",
                  course: "پروژه تغییر"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-background rounded-xl p-6 shadow-sm border"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "{testimonial.story}"
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{testimonial.course}</Badge>
                    <div className="text-primary font-semibold text-sm">{testimonial.revenue}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* International Presence */}
        <AnimatedSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">حضور بین‌المللی</h2>
              <p className="text-xl text-muted-foreground">
                فعالیت و تأثیرگذاری در سطح جهانی
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { country: "مالزی", events: "15+ رویداد", icon: "🇲🇾" },
                      { country: "ترکیه", events: "10+ کنفرانس", icon: "🇹🇷" },
                      { country: "امارات", events: "8+ سخنرانی", icon: "🇦🇪" },
                      { country: "کانادا", events: "5+ وبینار", icon: "🇨🇦" }
                    ].map((location, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className="text-center p-4 bg-background rounded-xl shadow-sm border"
                      >
                        <div className="text-3xl mb-2">{location.icon}</div>
                        <div className="font-bold mb-1">{location.country}</div>
                        <div className="text-sm text-muted-foreground">{location.events}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">دستاورد‌های بین‌المللی</h3>
                    <ul className="space-y-3">
                      {[
                        "سخنران کنفرانس‌های معتبر در 4 کشور",
                        "همکاری با شرکت‌های بین‌المللی",
                        "مشاوره برای استارتاپ‌های خارجی",
                        "عضویت در انجمن‌های جهانی کارآفرینی"
                      ].map((achievement, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.6 }}
                          className="flex items-center gap-3"
                        >
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span>{achievement}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/lovable-uploads/dfe27f49-6775-47e3-be1e-78c133be4b47.png"
                    alt="رضا رفیعی در مالزی"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -top-8 -left-8 bg-background/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">30+</div>
                    <div className="text-sm text-muted-foreground">کشور تأثیرگذاری</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* FAQ Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">سوالات متداول</h2>
              <p className="text-xl text-muted-foreground">
                پاسخ به سوالات رایج درباره رضا رفیعی و خدماتش
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  question: "چگونه می‌توانم با رضا رفیعی در ارتباط باشم؟",
                  answer: "می‌توانید از طریق تلگرام، واتساپ یا ایمیل با تیم پشتیبانی رضا رفیعی در ارتباط باشید. همچنین امکان رزرو جلسه مشاوره نیز فراهم است."
                },
                {
                  question: "آیا دوره‌های رضا رفیعی برای مبتدیان مناسب است؟",
                  answer: "بله، دوره‌ها به گونه‌ای طراحی شده‌اند که از سطح مبتدی شروع شده و به تدریج پیشرفته می‌شوند. هر دوره دارای پیش‌نیازهای مشخصی است که در توضیحات دوره ذکر شده است."
                },
                {
                  question: "چه تضمینی برای موفقیت در دوره‌ها وجود دارد؟",
                  answer: "تمام دوره‌ها دارای ضمانت بازگشت وجه 30 روزه هستند. همچنین پشتیبانی مادام‌العمر و به‌روزرسانی‌های رایگان ارائه می‌شود."
                },
                {
                  question: "آیا امکان پرداخت اقساطی وجود دارد؟",
                  answer: "بله، برای اکثر دوره‌ها امکان پرداخت اقساطی فراهم است. شرایط و نحوه پرداخت در صفحه مربوط به هر دوره توضیح داده شده است."
                },
                {
                  question: "مدت زمان دسترسی به دوره‌ها چقدر است؟",
                  answer: "تمام دوره‌ها دارای دسترسی مادام‌العمر هستند و می‌توانید تا ابد از محتویات استفاده کنید. همچنین به‌روزرسانی‌ها نیز به‌طور رایگان در اختیار شما قرار می‌گیرد."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-background rounded-xl border"
                >
                  <details className="group">
                    <summary className="flex items-center justify-between p-6 cursor-pointer">
                      <h3 className="font-bold text-lg">{faq.question}</h3>
                      <ArrowRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Projects Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">پروژه‌ها و محصولات</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                مجموعه‌ای از پلتفرم‌ها و سرویس‌های نوآورانه که زندگی هزاران نفر را متحول کرده‌است
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full border-2 hover:border-primary/20 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${project.color} text-white`}>
                          {project.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{project.name}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {project.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Courses Section */}
        <AnimatedSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">دوره‌های پرفروش</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                دوره‌های آموزشی که بیش از 185 هزار نفر را در مسیر موفقیت قرار داده‌است
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <Card className={`h-full transition-all duration-300 ${course.featured ? 'border-primary shadow-lg' : 'border-2 hover:border-primary/20'}`}>
                    <CardContent className="p-6">
                      {course.featured && (
                        <Badge className="mb-4">پرفروش‌ترین</Badge>
                      )}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-primary font-semibold">{course.students} دانشجو</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {course.description}
                          </p>
                        </div>
                        <Button variant="outline" className="w-full">
                          مشاهده دوره
                          <ArrowRight className="w-4 h-4 mr-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Video Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">ویدیوهای معرفی</h2>
              <p className="text-xl text-muted-foreground">
                با رضا رفیعی و دوره‌هایش بیشتر آشنا شوید
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Intro Video */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <h3 className="text-2xl font-bold text-center">معرفی دوره شروع بدون مرز</h3>
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">ویدیو معرفی دوره</p>
                  </div>
                </div>
              </motion.div>

              {/* Reviews Video */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-2xl font-bold text-center">نظرات دانشجویان</h3>
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center">
                    <Star className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">نظرات واقعی مشتریان</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* Conference Images Section */}
        <AnimatedSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">حضور در رویدادها</h2>
              <p className="text-xl text-muted-foreground">
                سخنرانی و حضور فعال در کنفرانس‌ها و رویدادهای معتبر
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "/lovable-uploads/80dd462f-1248-4998-81ac-82f524d6b4ba.png",
                "/lovable-uploads/98db84f7-4b37-4181-af2c-cce0ae6b5d32.png",
                "/lovable-uploads/2a44f9dc-d5dd-4ce3-a28d-1ff0cae2d26d.png",
                "/lovable-uploads/94ff2a09-d046-48df-9e4c-3d77a17a1b5c.png",
                "/lovable-uploads/429308ee-65b6-4971-bab1-f35e6d340531.png",
                "/lovable-uploads/6eb7c2fa-8dba-4aa6-8632-7efd7a70a465.png"
              ].map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="rounded-xl overflow-hidden shadow-lg"
                >
                  <img
                    src={image}
                    alt={`رویداد ${index + 1}`}
                    className="w-full h-64 object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-12 border">
                <h2 className="text-4xl font-bold mb-6">آماده شروع هستید؟</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  با رضا رفیعی در ارتباط باشید و مسیر موفقیت خود را آغاز کنید
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="px-8 py-4 text-lg">
                    <MessageCircle className="w-5 h-5 ml-2" />
                    تماس با رضا رفیعی
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    <BookOpen className="w-5 h-5 ml-2" />
                    مشاهده دوره‌ها
                  </Button>
                </div>
                
                <div className="mt-8 flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">185K+</div>
                    <div className="text-sm text-muted-foreground">دانشجوی موفق</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">12+</div>
                    <div className="text-sm text-muted-foreground">سال تجربه</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">50+</div>
                    <div className="text-sm text-muted-foreground">پروژه موفق</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
        {/* Statistics Section */}
        <AnimatedSection className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-center mb-12"
            >
              آمار و دستاورد‌ها
            </motion.h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: 185000, suffix: "+", label: "اعضای جامعه آکادمی", icon: Users },
                { value: 25000, suffix: "+", label: "پاسخ تست", icon: CheckCircle },
                { value: 50000, suffix: "+", label: "درخواست پشتیبانی", icon: MessageCircle },
                { value: 50, suffix: "+", label: "ایجنت AI ساخته شده", icon: Brain }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="text-center p-6 bg-background rounded-xl shadow-sm border"
                >
                  <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    <CounterAnimation end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Behind the Scenes Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">پشت صحنه</h2>
              <p className="text-xl text-muted-foreground">
                نگاهی به زندگی شخصی و کاری رضا رفیعی
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "لحظات الهام",
                  description: "تفکر و برنامه‌ریزی برای آینده",
                  image: "/lovable-uploads/614a3597-7eaa-4c60-8779-4fcf45d2c5a0.png"
                },
                {
                  title: "کار تیمی",
                  description: "همکاری نزدیک با تیم توسعه",
                  image: "/lovable-uploads/63ba8c2b-2d68-40ca-8b64-fcc18e358c69.png"
                },
                {
                  title: "آموزش مستقیم",
                  description: "انتقال تجربه به دانشجویان",
                  image: "/lovable-uploads/c8034ca1-dce4-43d1-bbb2-978c218e7e7c.png"
                },
                {
                  title: "آرامش در کار",
                  description: "ایجاد تعادل بین کار و زندگی",
                  image: "/lovable-uploads/c3031500-e046-4713-8ad7-d71ec299ba3a.png"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-4 relative">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Awards & Recognition */}
        <AnimatedSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">جوایز و افتخارات</h2>
              <p className="text-xl text-muted-foreground">
                تقدیرات و جوایز دریافتی در طول مسیر حرفه‌ای
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  award: "کارآفرین برتر سال",
                  year: "2023",
                  organization: "انجمن کارآفرینان ایران",
                  description: "به دلیل تأثیرگذاری در حوزه آموزش آنلاین"
                },
                {
                  award: "پیشگام نوآوری دیجیتال",
                  year: "2022",
                  organization: "وزارت ارتباطات",
                  description: "برای توسعه پلتفرم‌های هوش مصنوعی"
                },
                {
                  award: "مربی برتر آنلاین",
                  year: "2021",
                  organization: "اتحادیه مراکز آموزشی",
                  description: "بر اساس نظرسنجی از دانشجویان"
                },
                {
                  award: "رهبر تحول دیجیتال",
                  year: "2020",
                  organization: "اتاق بازرگانی ایران",
                  description: "برای کمک به کسب‌وکارهای آنلاین"
                },
                {
                  award: "سفیر کارآفرینی جوانان",
                  year: "2019",
                  organization: "سازمان ملی جوانان",
                  description: "تشویق جوانان به ورود به عرصه کسب‌وکار"
                },
                {
                  award: "برند تأثیرگذار شبکه‌های اجتماعی",
                  year: "2018",
                  organization: "انجمن بازاریابی دیجیتال",
                  description: "بیش از 250 هزار فالوور در اینستاگرام"
                }
              ].map((award, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-background rounded-xl p-6 shadow-sm border relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-primary font-bold text-lg">{award.year}</div>
                    </div>
                    <h3 className="font-bold text-xl mb-2">{award.award}</h3>
                    <p className="text-primary font-semibold mb-3">{award.organization}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{award.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Blog & Content Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">محتوا و مقالات</h2>
              <p className="text-xl text-muted-foreground">
                آخرین مطالب و بینش‌های رضا رفیعی
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "آینده هوش مصنوعی در کسب‌وکار ایرانی",
                  excerpt: "بررسی تأثیرات AI در تحول کسب‌وکارهای ایرانی و راهکارهای پیاده‌سازی موثر",
                  readTime: "8 دقیقه",
                  category: "هوش مصنوعی",
                  date: "3 روز پیش"
                },
                {
                  title: "راز موفقیت در بازاریابی اینستاگرام 2024",
                  excerpt: "استراتژی‌های جدید و کاربردی برای رشد ارگانیک و درآمدزایی از اینستاگرام",
                  readTime: "12 دقیقه",
                  category: "بازاریابی",
                  date: "1 هفته پیش"
                },
                {
                  title: "چگونه در عصر اتوماسیون، شغل امن داشته باشیم؟",
                  excerpt: "راهنمای کاملی برای تطبیق با تحولات فناوری و حفظ جایگاه شغلی",
                  readTime: "15 دقیقه",
                  category: "آینده شغل",
                  date: "2 هفته پیش"
                },
                {
                  title: "پلتفرم‌سازی؛ کلید موفقیت در اقتصاد دیجیتال",
                  excerpt: "چرا هر کسب‌وکاری باید به فکر ساخت پلتفرم باشد و چگونه شروع کند",
                  readTime: "10 دقیقه",
                  category: "کسب‌وکار",
                  date: "3 هفته پیش"
                },
                {
                  title: "Web3 و متاورس: فرصت یا تهدید؟",
                  excerpt: "تحلیل جامع از آینده اینترنت و تأثیر آن بر کسب‌وکارهای سنتی",
                  readTime: "20 دقیقه",
                  category: "Web3",
                  date: "1 ماه پیش"
                },
                {
                  title: "سیکولوژی موفقیت در کارآفرینی",
                  excerpt: "چگونه ذهنیت خود را برای رسیدن به موفقیت بزرگ آماده کنیم",
                  readTime: "18 دقیقه",
                  category: "موفقیت",
                  date: "1 ماه پیش"
                }
              ].map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -5 }}
                  className="bg-background rounded-xl p-6 shadow-sm border cursor-pointer group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{article.category}</Badge>
                      <span className="text-sm text-muted-foreground">{article.date}</span>
                    </div>
                    
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-200">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        زمان مطالعه: {article.readTime}
                      </span>
                      <Button variant="ghost" size="sm">
                        مطالعه بیشتر
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Contact Information */}
        <AnimatedSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">راه‌های ارتباط</h2>
              <p className="text-xl text-muted-foreground">
                برای مشاوره، همکاری یا سوالات خود با ما در تماس باشید
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                {
                  title: "مشاوره شخصی",
                  description: "رزرو جلسه مشاوره 1:1",
                  contact: "راه‌اندازی کسب‌وکار",
                  action: "رزرو جلسه",
                  icon: <Users className="w-6 h-6" />
                },
                {
                  title: "پشتیبانی دوره‌ها",
                  description: "سوالات فنی و آموزشی",
                  contact: "@RafieiAcademy",
                  action: "ارسال پیام",
                  icon: <MessageCircle className="w-6 h-6" />
                },
                {
                  title: "همکاری تجاری",
                  description: "پیشنهادات همکاری",
                  contact: "business@rafiei.com",
                  action: "ارسال ایمیل",
                  icon: <Star className="w-6 h-6" />
                },
                {
                  title: "رسانه و مطبوعات",
                  description: "درخواست مصاحبه",
                  contact: "media@rafiei.com",
                  action: "تماس بگیرید",
                  icon: <Globe className="w-6 h-6" />
                }
              ].map((contact, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-background rounded-xl p-6 shadow-sm border text-center"
                >
                  <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                    <div className="text-primary">{contact.icon}</div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{contact.title}</h3>
                  <p className="text-muted-foreground mb-3">{contact.description}</p>
                  <p className="text-primary font-semibold mb-4">{contact.contact}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    {contact.action}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </MainLayout>
  );
};

export default RezaRafiei;