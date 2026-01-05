import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/Layout/MainLayout";
import DirectEnrollmentForm from "@/components/Course/DirectEnrollmentForm";
import { supabase } from '@/integrations/supabase/client';
import { motion } from "framer-motion";
import { 
  ArrowDown,
  Check,
  Target,
  TrendingUp,
  Globe,
  Briefcase,
  Users,
  Clock,
  ShieldCheck,
  Zap,
  Award,
  BookOpen,
  MessageCircle,
  ChevronLeft
} from "lucide-react";

const RescueProjectLanding = () => {
  const [courseId, setCourseId] = useState<string | null>(null);
  const courseSlug = "rescue";

  useEffect(() => {
    const fetchCourseId = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', courseSlug)
          .single();
        
        if (data && !error) {
          setCourseId(data.id);
        }
      } catch (error) {
        console.error('Error fetching course ID:', error);
      }
    };
    
    fetchCourseId();
  }, [courseSlug]);

  const scrollToEnrollment = () => {
    document.querySelector('#enrollment-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: Target,
      title: "تحلیل واقع‌بینانه بازار",
      description: "بررسی فرصت‌های واقعی کسب درآمد در شرایط اقتصادی فعلی"
    },
    {
      icon: Globe,
      title: "مسیرهای بین‌المللی",
      description: "راه‌های عملی برای کسب درآمد دلاری از ایران"
    },
    {
      icon: Briefcase,
      title: "کسب‌وکار بدون سرمایه",
      description: "مدل‌های کسب‌وکاری که نیاز به سرمایه اولیه زیاد ندارند"
    },
    {
      icon: TrendingUp,
      title: "برنامه عملی گام به گام",
      description: "چک‌لیست‌های کاربردی برای شروع سریع و موثر"
    }
  ];

  const benefits = [
    "دسترسی کامل به محتوای آموزشی پروژه نجات",
    "راهنمای جامع فرصت‌های کاری بین‌المللی",
    "چک‌لیست‌های عملی برای شروع کسب‌وکار",
    "دسترسی به جامعه همراهان پروژه نجات",
    "پشتیبانی و پاسخگویی به سوالات"
  ];

  const targetAudience = [
    {
      icon: Users,
      text: "افرادی که به دنبال راه‌های جدید کسب درآمد هستند"
    },
    {
      icon: Clock,
      text: "کسانی که وقت محدودی دارند و به برنامه مشخص نیاز دارند"
    },
    {
      icon: Globe,
      text: "علاقه‌مندان به کار با بازار بین‌المللی"
    },
    {
      icon: Zap,
      text: "افرادی که آماده تغییر و اقدام عملی هستند"
    }
  ];

  const stats = [
    { value: "+۵۰۰", label: "شرکت‌کننده فعال" },
    { value: "۹۸٪", label: "رضایت کاربران" },
    { value: "+۲۰", label: "ساعت محتوا" }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background" dir="rtl">
        
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="container relative z-10 max-w-5xl mx-auto">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
                  آکادمی بدون مرز
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  پروژه نجات
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
                  برنامه جامع کسب درآمد بین‌المللی
                </p>
                
                <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                  مسیر عملی برای ایجاد درآمد پایدار از بازارهای جهانی
                </p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-8 mb-10">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={scrollToEnrollment}
                    size="lg"
                    className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-primary/20"
                  >
                    ثبت‌نام در پروژه نجات
                    <ChevronLeft className="mr-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="h-14 px-8 text-lg rounded-xl"
                  >
                    اطلاعات بیشتر
                    <ArrowDown className="mr-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                چالش‌های اقتصادی امروز
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
                در شرایط اقتصادی فعلی، بسیاری از افراد به دنبال راه‌حل‌های عملی برای ایجاد 
                درآمد پایدار هستند. پروژه نجات با ارائه یک برنامه ساختارمند، مسیر روشنی 
                را پیش روی شما قرار می‌دهد.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-border/50 bg-background">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-destructive" />
                    </div>
                    <h3 className="font-semibold mb-2">کاهش ارزش درآمد</h3>
                    <p className="text-sm text-muted-foreground">
                      حقوق و درآمد ریالی دیگر پاسخگوی نیازها نیست
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-border/50 bg-background">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-amber-500" />
                    </div>
                    <h3 className="font-semibold mb-2">نبود مسیر مشخص</h3>
                    <p className="text-sm text-muted-foreground">
                      اطلاعات پراکنده و بدون برنامه عملی
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-border/50 bg-background">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">دسترسی به بازار جهانی</h3>
                    <p className="text-sm text-muted-foreground">
                      نیاز به راهنمای عملی برای ورود به بازارهای بین‌المللی
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-background">
          <div className="container max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <Badge variant="outline" className="mb-4">
                ویژگی‌های پروژه
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                چه چیزی در پروژه نجات یاد می‌گیرید؟
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                یک برنامه کامل و ساختارمند برای شروع کسب درآمد بین‌المللی
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6 flex gap-5">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="outline" className="mb-4">
                  محتوای پروژه
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  با ثبت‌نام چه چیزهایی دریافت می‌کنید؟
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  پروژه نجات شامل تمام ابزارها و راهنماهای لازم برای شروع مسیر 
                  کسب درآمد بین‌المللی است.
                </p>
                
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-2 gap-4"
              >
                <Card className="bg-background border-border/50">
                  <CardContent className="p-5 text-center">
                    <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">محتوای آموزشی</h4>
                    <p className="text-sm text-muted-foreground">ویدیو و مستندات کامل</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-background border-border/50">
                  <CardContent className="p-5 text-center">
                    <Award className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">گواهینامه</h4>
                    <p className="text-sm text-muted-foreground">پس از تکمیل دوره</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-background border-border/50">
                  <CardContent className="p-5 text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">جامعه همراهان</h4>
                    <p className="text-sm text-muted-foreground">دسترسی به گروه خصوصی</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-background border-border/50">
                  <CardContent className="p-5 text-center">
                    <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold mb-1">پشتیبانی</h4>
                    <p className="text-sm text-muted-foreground">پاسخگویی به سوالات</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="py-20 px-4 bg-background">
          <div className="container max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <Badge variant="outline" className="mb-4">
                مخاطبان پروژه
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                این پروژه برای چه کسانی مناسب است؟
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {targetAudience.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-foreground font-medium">{item.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap justify-center gap-8 md:gap-16"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span className="text-foreground font-medium">ضمانت بازگشت وجه</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-primary" />
                <span className="text-foreground font-medium">پشتیبانی ۲۴ ساعته</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-foreground font-medium">جامعه فعال</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary/5">
          <div className="container max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                آماده شروع هستید؟
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                همین امروز به جمع شرکت‌کنندگان پروژه نجات بپیوندید و مسیر 
                جدید کسب درآمد خود را آغاز کنید.
              </p>
              <Button 
                onClick={scrollToEnrollment}
                size="lg"
                className="h-14 px-10 text-lg rounded-xl shadow-lg shadow-primary/20"
              >
                ثبت‌نام در پروژه نجات
                <ChevronLeft className="mr-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Enrollment Section */}
        <section id="enrollment-section" className="py-20 px-4 bg-background">
          <div className="container max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <Badge variant="secondary" className="mb-4">
                فرم ثبت‌نام
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                ثبت‌نام در پروژه نجات
              </h2>
              <p className="text-muted-foreground">
                اطلاعات خود را وارد کنید تا دسترسی دریافت کنید
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <DirectEnrollmentForm 
                    courseSlug={courseSlug}
                    courseName="پروژه نجات"
                  >
                    ثبت‌نام و دریافت دسترسی
                  </DirectEnrollmentForm>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <section className="py-12 px-4 bg-muted/30 border-t border-border/30">
          <div className="container max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              پروژه نجات بخشی از مجموعه آموزشی <strong>آکادمی بدون مرز</strong> است.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              تمامی حقوق محفوظ است © ۱۴۰۳
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default RescueProjectLanding;
