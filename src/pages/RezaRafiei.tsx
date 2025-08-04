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
      </div>
    </MainLayout>
  );
};

export default RezaRafiei;