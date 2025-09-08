import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MainLayout from "@/components/Layout/MainLayout";
import SectionTitle from "@/components/SectionTitle";
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
  Star
} from "lucide-react";
import { toast } from "sonner";

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
  courseSlug = "crisis-project"
}: CrisisProjectEnhancedProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would integrate with your enrollment system
    toast.success("ثبت‌نام شما با موفقیت انجام شد!");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        {/* Hero Section */}
        <section className="relative py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10"></div>
          <div className="container relative z-10">
            <Badge className="mb-6 px-4 py-2 text-lg bg-destructive/10 text-destructive border-destructive/20">
              🚨 پروژه بحران
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              پروژه بحران: از دل بحران تا ساختن آینده بدون مرز
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              مدیریت بحران، سرمایه‌گذاری هوشمند، و ساخت کسب‌وکار بین‌المللی در سخت‌ترین شرایط
            </p>
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
              <Shield className="ml-2 h-5 w-5" />
              همین حالا ثبت‌نام کنید
            </Button>
          </div>
        </section>

        {/* Why This Project - Pain Points */}
        <section className="py-16 px-4 bg-card/50">
          <div className="container">
            <div className="text-center mb-12">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                همه می‌پرسن: حالا باید چیکار کنیم؟
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <Card className="p-6 text-center border-destructive/20">
                  <DollarSign className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">دلار در اوج قیمت</p>
                </Card>
                <Card className="p-6 text-center border-destructive/20">
                  <TrendingUp className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">طلا در رکورد تاریخی</p>
                </Card>
                <Card className="p-6 text-center border-destructive/20">
                  <Target className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">مکانیسم ماشه</p>
                </Card>
                <Card className="p-6 text-center border-destructive/20">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium">عدم اطمینان از آینده</p>
                </Card>
              </div>
              <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="text-xl font-bold text-primary mb-2">راه حل ما:</h3>
                <p className="text-lg">این پروژه بحران را به فرصت تبدیل می‌کند</p>
              </div>
            </div>
          </div>
        </section>

        {/* What You Will Learn - 5 Pillars */}
        <section className="py-16 px-4">
          <div className="container">
            <SectionTitle
              title="آنچه یاد خواهید گرفت"
              subtitle="۵ ستون اصلی برای تبدیل بحران به فرصت"
              isCentered
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">درک و مدیریت بحران</h3>
                <p className="text-muted-foreground">مکانیزم ماشه، مدیریت بحران فردی و اقتصادی</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Brain className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">انگیزه و رشد فردی</h3>
                <p className="text-muted-foreground">تبدیل ترس به فرصت</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">سرمایه‌گذاری هوشمند در بحران</h3>
                <p className="text-muted-foreground">طلا، ارز، تنوع‌سازی، امنیت مالی</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Globe className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">کسب‌وکارهای بدون مرز</h3>
                <p className="text-muted-foreground">دراپ‌شیپینگ، دراپ‌سرویسینگ، فروش فایل دیجیتال، هوش مصنوعی</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
                <ArrowRight className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">نقشه راه آزادی</h3>
                <p className="text-muted-foreground">چک‌لیست خروج از بحران + معرفی دوره بدون مرز</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="py-16 px-4 bg-card/50">
          <div className="container">
            <SectionTitle
              title="این پروژه برای چه کسانی است؟"
              isCentered
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">دانشجویان</h3>
                <p className="text-muted-foreground">نگران آینده‌شان</p>
              </Card>
              <Card className="p-6 text-center">
                <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">خانواده‌ها</h3>
                <p className="text-muted-foreground">به دنبال امنیت مالی</p>
              </Card>
              <Card className="p-6 text-center">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">کارمندان</h3>
                <p className="text-muted-foreground">خواهان درآمد جانبی</p>
              </Card>
              <Card className="p-6 text-center">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">کارآفرینان</h3>
                <p className="text-muted-foreground">در جستجوی رشد بین‌المللی</p>
              </Card>
            </div>
          </div>
        </section>

        {/* About Rafiei Academy */}
        <section className="py-16 px-4">
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
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
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
        <section className="py-16 px-4 bg-primary/5">
          <div className="container">
            <SectionTitle
              title="جوایز و پیشنهادات ویژه"
              isCentered
            />
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 text-center border-primary/20">
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">چک‌لیست رایگان</h3>
                <p className="text-muted-foreground">"۱۰ قدم برای مدیریت بحران مالی"</p>
              </Card>
              <Card className="p-6 text-center border-primary/20">
                <Badge className="mb-4 bg-destructive text-destructive-foreground">محدود</Badge>
                <h3 className="text-xl font-bold mb-3">تخفیف ویژه</h3>
                <p className="text-muted-foreground">برای ثبت‌نام‌های زودهنگام</p>
              </Card>
              <Card className="p-6 text-center border-primary/20">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">پشتیبانی و Q&A</h3>
                <p className="text-muted-foreground">دسترسی به جلسات پرسش و پاسخ</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Sign-up Form */}
        <section className="py-16 px-4 bg-card">
          <div className="container max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                ثبت‌نام کنید و آینده خود را از بحران نجات دهید
              </h2>
              <Badge className="bg-destructive text-destructive-foreground">
                ظرفیت محدود - همین امروز ثبت‌نام کنید
              </Badge>
            </div>
            
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">نام</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">نام خانوادگی</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full text-lg">
                  <Shield className="ml-2 h-5 w-5" />
                  ثبت‌نام در پروژه بحران
                </Button>
              </form>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container max-w-3xl">
            <SectionTitle title="سوالات متداول" isCentered />
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-bold mb-2">آیا این برنامه آنلاین است؟</h3>
                <p className="text-muted-foreground">بله، کاملاً آنلاین از طریق پلتفرم آکادمی رافعی</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold mb-2">آیا نیاز به تجربه دارم؟</h3>
                <p className="text-muted-foreground">خیر، هر کسی می‌تواند شرکت کند</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold mb-2">آیا پشتیبانی دریافت خواهم کرد؟</h3>
                <p className="text-muted-foreground">بله، دسترسی مادام‌العمر + جلسه پرسش و پاسخ</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final Motivational Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary via-primary/90 to-secondary text-white text-center">
          <div className="container">
            <blockquote className="text-2xl md:text-3xl font-bold mb-8 italic">
              "یا می‌توانی قربانی بحران باشی، یا برنده‌ی بحران"
            </blockquote>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              <Lightbulb className="ml-2 h-5 w-5" />
              همین حالا ثبت‌نام کنید
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default CrisisProjectEnhanced;