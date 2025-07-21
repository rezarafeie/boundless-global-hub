
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Clock, BookOpen, Trophy, Target, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/Layout/MainLayout';
import Hero from '@/components/Hero';
import { useCourseSettings } from '@/hooks/useCourseSettings';
import { supabase } from '@/integrations/supabase/client';
import SaleBadge from '@/components/SaleBadge';
import SaleCountdownTimer from '@/components/SaleCountdownTimer';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  is_sale_enabled: boolean;
  sale_price: number | null;
  sale_expires_at: string | null;
  use_landing_page_merge: boolean;
}

const BoundlessLanding: React.FC = () => {
  const { courseSettings, courseSettingsLoading } = useCourseSettings();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, description, price, is_sale_enabled, sale_price, sale_expires_at, use_landing_page_merge')
          .eq('slug', 'boundless')
          .single();

        if (error) throw error;
        setCourseData(data);
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, []);

  const enrollmentUrl = useMemo(() => {
    if (courseSettingsLoading || !courseData) return '#';
    
    if (courseSettings?.use_landing_page_merge || courseData.use_landing_page_merge) {
      return '/enroll?course=boundless';
    }
    
    return 'https://auth.rafiei.co/?add-to-cart=5311';
  }, [courseSettings, courseSettingsLoading, courseData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const isSaleActive = courseData?.is_sale_enabled && 
                      courseData?.sale_price && 
                      courseData?.sale_expires_at && 
                      new Date(courseData.sale_expires_at) > new Date();

  const effectivePrice = isSaleActive ? courseData!.sale_price! : courseData?.price || 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Hero
        title="دوره بدون مرز"
        subtitle="یک سفر کاملاً متفاوت برای ایجاد کسب و کار و زندگی بدون مرز"
        ctaText="همین الان ثبت نام کن"
        ctaLink={enrollmentUrl}
        showSale={isSaleActive}
        originalPrice={courseData?.price}
        salePrice={courseData?.sale_price || undefined}
        saleExpiresAt={courseData?.sale_expires_at || undefined}
      />

      {/* Course Overview */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  راهی برای ایجاد زندگی و کسب و کار بدون مرز
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  دوره بدون مرز یک سفر کاملاً متفاوت برای کسانی است که می‌خواهند زندگی و کسب و کار خود را از محدودیت‌های جغرافیایی، مالی و ذهنی رها کنند.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  {isSaleActive && (
                    <div className="flex flex-col items-start gap-2">
                      <SaleBadge originalPrice={courseData!.price} salePrice={courseData!.sale_price!} />
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(courseData!.sale_price!)}
                        </span>
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(courseData!.price)}
                        </span>
                      </div>
                      <SaleCountdownTimer expiresAt={courseData!.sale_expires_at!} />
                    </div>
                  )}
                  {!isSaleActive && (
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(courseData!.price)}
                    </span>
                  )}
                </div>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  asChild
                >
                  <a href={enrollmentUrl}>
                    همین الان ثبت نام کن
                  </a>
                </Button>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌍</div>
                    <h3 className="text-xl font-bold mb-2">بدون مرز</h3>
                    <p className="text-muted-foreground">آزادی کامل در زندگی و کسب و کار</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">چی یاد می‌گیری؟</h2>
              <p className="text-lg text-muted-foreground">
                تمام مهارت‌های لازم برای ایجاد زندگی و کسب و کار بدون مرز
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Target className="h-8 w-8" />,
                  title: 'تعریف اهداف بدون مرز',
                  description: 'یاد بگیر چطور اهداف بلندپروازانه‌ای تعریف کنی که محدود به مکان و زمان نباشند'
                },
                {
                  icon: <Zap className="h-8 w-8" />,
                  title: 'کسب و کار دیجیتال',
                  description: 'راه‌اندازی کسب و کار آنلاین که از هر نقطه دنیا قابل مدیریت باشد'
                },
                {
                  icon: <Users className="h-8 w-8" />,
                  title: 'شبکه‌سازی جهانی',
                  description: 'ایجاد شبکه‌ای از روابط تجاری و شخصی در سراسر جهان'
                },
                {
                  icon: <BookOpen className="h-8 w-8" />,
                  title: 'یادگیری مداوم',
                  description: 'تکنیک‌های یادگیری سریع و مؤثر برای تطبیق با تغییرات دنیا'
                },
                {
                  icon: <Trophy className="h-8 w-8" />,
                  title: 'موفقیت پایدار',
                  description: 'استراتژی‌های ایجاد موفقیت بلندمدت بدون وابستگی به موقعیت جغرافیایی'
                },
                {
                  icon: <Clock className="h-8 w-8" />,
                  title: 'مدیریت زمان',
                  description: 'تکنیک‌های مدیریت زمان برای کار با تیم‌های بین‌المللی'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="text-primary mb-4">{item.icon}</div>
                      <h3 className="font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">ویژگی‌های دوره</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'محتوای کاملاً عملی',
                  description: 'تمام محتوای دوره براساس تجربیات واقعی و قابل اجرا است',
                  badge: 'عملی'
                },
                {
                  title: 'پشتیبانی مادام‌العمر',
                  description: 'پس از خرید دوره، تا ابد از پشتیبانی ما بهره‌مند خواهید بود',
                  badge: 'مادام‌العمر'
                },
                {
                  title: 'کمیونیتی اختصاصی',
                  description: 'عضویت در کمیونیتی بدون مرز با سایر افراد هم‌فکر',
                  badge: 'انحصاری'
                },
                {
                  title: 'بروزرسانی مداوم',
                  description: 'محتوای دوره مرتب بروزرسانی می‌شود تا همیشه به‌روز باشد',
                  badge: 'جدید'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold">{feature.title}</h3>
                      <Badge variant="secondary">{feature.badge}</Badge>
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              آماده‌ای برای شروع سفر بدون مرز؟
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              امروز اولین قدم رو برای ایجاد زندگی و کسب و کار بدون مرز بردار
            </p>
            
            {isSaleActive && (
              <div className="mb-8">
                <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex justify-center mb-4">
                    <SaleBadge originalPrice={courseData!.price} salePrice={courseData!.sale_price!} />
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-3xl font-bold text-green-300">
                      {formatPrice(courseData!.sale_price!)}
                    </span>
                    <span className="text-xl text-blue-200 line-through">
                      {formatPrice(courseData!.price)}
                    </span>
                  </div>
                  <SaleCountdownTimer expiresAt={courseData!.sale_expires_at!} className="text-white" />
                </div>
              </div>
            )}
            
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-4"
              asChild
            >
              <a href={enrollmentUrl}>
                همین الان ثبت نام کن
                <ArrowLeft className="mr-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BoundlessLanding;
