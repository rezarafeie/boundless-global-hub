import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/Layout/MainLayout";
import DirectEnrollmentForm from "@/components/Course/DirectEnrollmentForm";
import { supabase } from '@/integrations/supabase/client';
import { motion } from "framer-motion";
import { 
  Heart,
  Compass,
  Shield,
  ArrowDown,
  Check,
  Quote,
  Clock,
  Users,
  MapPin
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-background" dir="rtl">
        
        {/* Hero Section - Deeply Human, Minimal */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background"></div>
          
          <div className="container relative z-10 max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <p className="text-muted-foreground text-lg mb-6">
                پروژه نجات | بدون مرز
              </p>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
                این دوره انگیزشی نیست.
                <br />
                <span className="text-muted-foreground font-normal">
                  یک چالش کوتاه و جدی است.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
                برای کسانی که زیر فشار اقتصادی هستند و بی‌صدا دنبال راه خروج می‌گردند.
              </p>

              <Button 
                onClick={scrollToEnrollment}
                size="lg"
                className="h-14 px-10 text-lg rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all"
              >
                می‌خوام شروع کنم
                <ArrowDown className="mr-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* The Truth Section */}
        <section className="py-24 px-4 bg-muted/20">
          <div className="container max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <p className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed">
                شاید تو هم مثل خیلی‌ها،
              </p>
              
              <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
                <p>
                  هر شب با فکر فردا می‌خوابی.
                </p>
                <p>
                  هر روز با خستگی از دیروز بیدار می‌شی.
                </p>
                <p>
                  حقوقت کم‌تر از خرجت شده.
                </p>
                <p>
                  ذخیره‌ات داره آب می‌ره.
                </p>
                <p>
                  و آینده... مبهم‌تر از همیشه.
                </p>
              </div>

              <div className="pt-8 border-t border-border">
                <p className="text-xl md:text-2xl text-foreground font-medium">
                  این پروژه قرار نیست کشور رو نجات بده.
                  <br />
                  <span className="text-primary">
                    قراره تو رو نجات بده.
                  </span>
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What This Is Section */}
        <section className="py-24 px-4 bg-background">
          <div className="container max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                پروژه نجات چیست؟
              </h2>
              <p className="text-lg text-muted-foreground">
                یک چالش کوتاه‌مدت، بدون وعده‌های دروغین
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Compass className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">شفافیت</h3>
                <p className="text-muted-foreground">
                  یک نقشه ساده و واقعی برای شروع.
                  <br />
                  نه پیچیده، نه رویایی.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">همدلی</h3>
                <p className="text-muted-foreground">
                  می‌دونیم چقدر سخته.
                  <br />
                  این پروژه از جای درد نوشته شده.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">صداقت</h3>
                <p className="text-muted-foreground">
                  بدون هایپ.
                  <br />
                  بدون وعده پول‌دار شدن سریع.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="container max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Quote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-8" />
              
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed mb-8">
                «من خسته شدم از همه‌چی. فقط می‌خوام یه راهی پیدا کنم که بتونم نفس بکشم.»
              </blockquote>
              
              <p className="text-muted-foreground">
                — اگه این حرف آشناست، این پروژه برای توئه.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What You'll Get Section */}
        <section className="py-24 px-4 bg-background">
          <div className="container max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                چی بهت می‌دیم؟
              </h2>
              <p className="text-lg text-muted-foreground">
                نه کتاب ۵۰۰ صفحه‌ای. نه ویدیوی ۱۰ ساعته.
              </p>
            </motion.div>

            <div className="space-y-6">
              {[
                "یک نگاه واقع‌بینانه به وضعیت اقتصادی",
                "راه‌های عملی برای شروع درآمدزایی بدون سرمایه زیاد",
                "یک چک‌لیست کوتاه برای قدم اول",
                "مسیرهای کسب‌وکار بین‌المللی که از ایران قابل انجامن",
                "دسترسی به پشتیبانی و سوالات"
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-5 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-lg text-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="py-24 px-4 bg-muted/20">
          <div className="container max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-12 text-center">
                این پروژه برای کیه؟
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Users, text: "کسی که خسته شده از وضعیت مالیش" },
                  { icon: Clock, text: "کسی که وقت زیادی برای دوره‌های طولانی نداره" },
                  { icon: MapPin, text: "کسی که می‌خواد از ایران کار بین‌المللی کنه" },
                  { icon: Heart, text: "کسی که دنبال یه امید واقعی می‌گرده" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-5 bg-background rounded-xl border border-border/50"
                  >
                    <item.icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    <p className="text-foreground">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Message Section */}
        <section className="py-24 px-4 bg-background">
          <div className="container max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                یه حرف آخر
              </h2>
              
              <div className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-6">
                <p>
                  ما قول نمی‌دیم زندگیت یک‌شبه عوض بشه.
                </p>
                <p>
                  قول نمی‌دیم میلیاردر بشی.
                </p>
                <p>
                  فقط قول می‌دیم یه مسیر واضح و قابل فهم بهت نشون بدیم
                  <br />
                  که اگه بخوای، می‌تونی ازش شروع کنی.
                </p>
              </div>

              <div className="pt-8">
                <p className="text-xl md:text-2xl font-medium text-foreground">
                  بقیه‌اش دست خودته.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Enrollment Section */}
        <section id="enrollment-section" className="py-24 px-4 bg-muted/30">
          <div className="container max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                آماده‌ای شروع کنی؟
              </h2>
              <p className="text-muted-foreground">
                ثبت‌نام رایگانه. تعهدی نداری. فقط شروع کن.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <DirectEnrollmentForm 
                courseSlug={courseSlug}
                courseName="پروژه نجات"
                className="border border-border/50 shadow-lg"
              >
                <Heart className="ml-2 h-5 w-5" />
                شروع پروژه نجات
              </DirectEnrollmentForm>
            </motion.div>
          </div>
        </section>

        {/* Footer Note */}
        <section className="py-16 px-4 bg-background border-t border-border/30">
          <div className="container max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">
              پروژه نجات بخشی از آکادمی بدون مرز است.
              <br />
              این پروژه با هدف کمک به افرادی طراحی شده که در شرایط اقتصادی سخت هستند و به دنبال راه‌حل‌های واقعی می‌گردند.
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default RescueProjectLanding;
