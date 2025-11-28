import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/Layout/MainLayout";
import SectionTitle from "@/components/SectionTitle";
import DirectEnrollmentForm from "@/components/Course/DirectEnrollmentForm";
import { useBlackFridayContext } from '@/contexts/BlackFridayContext';
import CourseDiscountBanner from '@/components/BlackFriday/CourseDiscountBanner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  TrendingUp, 
  Brain, 
  DollarSign, 
  Globe, 
  Users, 
  Award, 
  CheckCircle,
  AlertTriangle,
  Target,
  Lightbulb,
  ArrowRight,
  Star,
  Play
} from "lucide-react";

interface CrisisProjectEnhancedProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType?: string;
  iframeUrl?: string;
  courseSlug?: string;
}

const CrisisProjectEnhanced = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType = "shield",
  iframeUrl,
  courseSlug = "crisis"
}: CrisisProjectEnhancedProps) => {
  const [courseId, setCourseId] = useState<string | null>(null);
  const { isActive: isBlackFridayActive, getCourseDiscount } = useBlackFridayContext();
  const blackFridayDiscount = courseId ? getCourseDiscount(courseId) : 0;

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

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Black Friday Discount Banner */}
        {isBlackFridayActive && blackFridayDiscount > 0 && courseId && (
          <div className="container mx-auto px-4 pt-8">
            <CourseDiscountBanner 
              discount={blackFridayDiscount} 
              courseName="پروژه بحران"
              originalPrice={10000000}
              courseSlug={courseSlug}
            />
          </div>
        )}
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 text-center overflow-hidden bg-card/50">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
          <div className="container relative z-10">
            <Badge className="mb-6 px-4 py-2 text-lg bg-destructive/10 text-destructive border-destructive/20">
              🚨 پروژه بحران
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              پروژه بحران: از دل بحران تا ساختن آینده بدون مرز
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              مدیریت بحران، سرمایه‌گذاری هوشمند، و ساخت کسب‌وکار بین‌المللی در سخت‌ترین شرایط
            </p>
            <DirectEnrollmentForm 
              courseSlug={courseSlug}
              courseName="پروژه بحران"
              className="max-w-md mx-auto"
            >
              <Shield className="ml-2 h-5 w-5" />
              همین حالا ثبت‌نام کنید
            </DirectEnrollmentForm>
          </div>
        </section>

        {/* Why This Project - Pain Points */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                همه می‌پرسن: حالا باید چیکار کنیم؟
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <Card className="p-6 text-center border-destructive/20 bg-background">
                  <DollarSign className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">دلار در اوج قیمت</p>
                </Card>
                <Card className="p-6 text-center border-destructive/20 bg-background">
                  <TrendingUp className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">طلا در رکورد تاریخی</p>
                </Card>
                <Card className="p-6 text-center border-destructive/20 bg-background">
                  <Target className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">مکانیسم ماشه</p>
                </Card>
                <Card className="p-6 text-center border-destructive/20 bg-background">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">عدم اطمینان از آینده</p>
                </Card>
              </div>
              <Card className="mt-8 p-6 bg-primary/5 border border-primary/20">
                <h3 className="text-xl font-bold text-primary mb-2">راه حل ما:</h3>
                <p className="text-lg">این پروژه بحران را به فرصت تبدیل می‌کند</p>
              </Card>
            </div>
          </div>
        </section>

        {/* What You Will Learn - 5 Pillars */}
        <section className="py-16 px-4 bg-background">
          <div className="container">
            <SectionTitle
              title="آنچه یاد خواهید گرفت"
              subtitle="۵ ستون اصلی برای تبدیل بحران به فرصت"
              isCentered
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/10 hover:border-primary/30">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">درک و مدیریت بحران</h3>
                <p className="text-muted-foreground">مکانیزم ماشه، مدیریت بحران فردی و اقتصادی</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/10 hover:border-primary/30">
                <Brain className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">انگیزه و رشد فردی</h3>
                <p className="text-muted-foreground">تبدیل ترس به فرصت</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/10 hover:border-primary/30">
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">سرمایه‌گذاری هوشمند در بحران</h3>
                <p className="text-muted-foreground">طلا، ارز، تنوع‌سازی، امنیت مالی</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/10 hover:border-primary/30">
                <Globe className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">کسب‌وکارهای بدون مرز</h3>
                <p className="text-muted-foreground">دراپ‌شیپینگ، دراپ‌سرویسینگ، فروش فایل دیجیتال، هوش مصنوعی</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1 border-2 border-primary/10 hover:border-primary/30">
                <ArrowRight className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">نقشه راه آزادی</h3>
                <p className="text-muted-foreground">چک‌لیست خروج از بحران + معرفی دوره بدون مرز</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container">
            <SectionTitle
              title="این پروژه برای چه کسانی است؟"
              isCentered
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center bg-background border-2 border-primary/10 hover:border-primary/30 transition-colors">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">دانشجویان</h3>
                <p className="text-muted-foreground">نگران آینده‌شان</p>
              </Card>
              <Card className="p-6 text-center bg-background border-2 border-primary/10 hover:border-primary/30 transition-colors">
                <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">خانواده‌ها</h3>
                <p className="text-muted-foreground">به دنبال امنیت مالی</p>
              </Card>
              <Card className="p-6 text-center bg-background border-2 border-primary/10 hover:border-primary/30 transition-colors">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">کارمندان</h3>
                <p className="text-muted-foreground">خواهان درآمد جانبی</p>
              </Card>
              <Card className="p-6 text-center bg-background border-2 border-primary/10 hover:border-primary/30 transition-colors">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">کارآفرینان</h3>
                <p className="text-muted-foreground">در جستجوی رشد بین‌المللی</p>
              </Card>
            </div>
          </div>
        </section>

        {/* About Rafiei Academy */}
        <section className="py-16 px-4 bg-background">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">درباره آکادمی رافعی</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  رضا رافعی، مربی، کارآفرین و بنیان‌گذار آکادمی رافعی با بیش از ۳۷۰ هزار دانشجو در سراسر جهان
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>بیش از ۳۷۰ هزار دانشجو</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>تخصص در کسب‌وکار بین‌المللی</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>سال‌ها تجربه در مدیریت بحران</span>
                  </div>
                </div>
              </div>
              <Card className="p-8 bg-primary/5 border-2 border-primary/20">
                <Award className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4">آکادمی رافعی</h3>
                <p className="text-muted-foreground">
                  مرجع آموزش کسب‌وکار بین‌المللی و مدیریت بحران در ایران
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Bonuses & Offers */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container">
            <SectionTitle
              title="جوایز و پیشنهادات ویژه"
              isCentered
            />
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 text-center bg-background border-2 border-primary/20">
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">چک‌لیست رایگان</h3>
                <p className="text-muted-foreground">"۱۰ قدم برای مدیریت بحران مالی"</p>
              </Card>
              <Card className="p-6 text-center bg-background border-2 border-primary/20">
                <Badge className="mb-4 bg-destructive text-destructive-foreground">محدود</Badge>
                <h3 className="text-xl font-bold mb-3">تخفیف ویژه</h3>
                <p className="text-muted-foreground">برای ثبت‌نام‌های زودهنگام</p>
              </Card>
              <Card className="p-6 text-center bg-background border-2 border-primary/20">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">پشتیبانی و Q&A</h3>
                <p className="text-muted-foreground">دسترسی به جلسات پرسش و پاسخ</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Sign-up Form */}
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                ثبت‌نام کنید و آینده خود را از بحران نجات دهید
              </h2>
              <Badge className="bg-destructive text-destructive-foreground">
                ظرفیت محدود - همین امروز ثبت‌نام کنید
              </Badge>
            </div>
            
            <div id="enrollment-form">
              <DirectEnrollmentForm 
                courseSlug={courseSlug}
                courseName="پروژه بحران"
                className="border-2 border-primary/20"
              >
                <Play className="ml-2 h-5 w-5" />
                ثبت‌نام رایگان در پروژه بحران
              </DirectEnrollmentForm>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-3xl">
            <SectionTitle title="سوالات متداول" isCentered />
            <div className="space-y-6">
              <Card className="p-6 bg-background border-2 border-primary/10">
                <h3 className="font-bold mb-2">آیا این برنامه آنلاین است؟</h3>
                <p className="text-muted-foreground">بله، کاملاً آنلاین از طریق پلتفرم آکادمی رافعی</p>
              </Card>
              <Card className="p-6 bg-background border-2 border-primary/10">
                <h3 className="font-bold mb-2">آیا نیاز به تجربه دارم؟</h3>
                <p className="text-muted-foreground">خیر، هر کسی می‌تواند شرکت کند</p>
              </Card>
              <Card className="p-6 bg-background border-2 border-primary/10">
                <h3 className="font-bold mb-2">آیا پشتیبانی دریافت خواهم کرد؟</h3>
                <p className="text-muted-foreground">بله، دسترسی مادام‌العمر + جلسه پرسش و پاسخ</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final Motivational Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground text-center">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <blockquote className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                "یا می‌توانی قربانی بحران باشی، یا برنده‌ی بحران"
              </blockquote>
              <p className="text-lg md:text-xl mb-8 opacity-90">
                انتخاب با توست - امروز قدم اول را بردار
              </p>
              <Button 
                onClick={() => document.querySelector('#enrollment-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90"
              >
                <Lightbulb className="ml-2 h-5 w-5" />
                همین حالا ثبت‌نام کنید
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default CrisisProjectEnhanced;