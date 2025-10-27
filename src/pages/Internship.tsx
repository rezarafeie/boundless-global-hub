import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rocket, Users, Award, Globe, Star, TrendingUp, Briefcase, GraduationCap, MessageCircle, Code, Video, Settings } from "lucide-react";

const departments = [
  { value: "sales_marketing", label: "Sales & Marketing", icon: TrendingUp },
  { value: "content_media", label: "Content & Media", icon: Video },
  { value: "education_support", label: "Education & Support", icon: GraduationCap },
  { value: "ai_development", label: "AI & Development", icon: Code },
  { value: "graphic_video", label: "Graphic & Video Production", icon: Video },
  { value: "administration", label: "Administration", icon: Settings },
  { value: "other", label: "Other", icon: Briefcase },
];

const benefits = [
  {
    icon: Briefcase,
    title: "Real Projects Experience",
    description: "Work on actual projects that impact real users and businesses"
  },
  {
    icon: Users,
    title: "Mentorship from Experts",
    description: "Learn directly from industry professionals and experienced mentors"
  },
  {
    icon: TrendingUp,
    title: "Career Opportunities",
    description: "High-performing interns have the chance to join our team full-time"
  },
  {
    icon: Globe,
    title: "Remote & Flexible",
    description: "Work from anywhere with flexible schedules that fit your lifestyle"
  },
  {
    icon: Award,
    title: "Certification",
    description: "Receive an official certificate upon successful completion of the program"
  },
  {
    icon: Star,
    title: "Build Your Portfolio",
    description: "Create impressive portfolio pieces with real-world impact"
  }
];

export default function Internship() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    age: "",
    city: "",
    specialization: "",
    desired_department: "",
    availability: "",
    self_introduction: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.phone || !formData.age || !formData.city || !formData.desired_department || !formData.availability) {
      toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("internship_applications").insert([
        {
          full_name: formData.full_name,
          phone: formData.phone,
          age: parseInt(formData.age),
          city: formData.city,
          specialization: formData.specialization,
          desired_department: formData.desired_department,
          availability: formData.availability,
          self_introduction: formData.self_introduction,
        },
      ]);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("درخواست شما با موفقیت ثبت شد!");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mx-auto flex items-center justify-center mb-6">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-l from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                درخواست شما ثبت شد!
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                با تشکر از ثبت درخواست کارآموزی در آکادمی رفیعی. تیم ما در اسرع وقت با شما تماس خواهد گرفت.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/")} size="lg">
                بازگشت به صفحه اصلی
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" size="lg">
                ثبت درخواست جدید
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">برنامه کارآموزی آکادمی رفیعی</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-l from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              سفر خود را با آکادمی رفیعی آغاز کنید 🚀
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              تجربه واقعی کسب کنید، از متخصصان بیاموزید و حرفه خود را بدون مرز بسازید
            </p>
            
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageCircle className="ml-2" />
              ثبت درخواست کارآموزی
            </Button>
          </div>
        </div>
      </section>

      {/* About the Program */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">درباره برنامه کارآموزی</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              آکادمی رفیعی با هدف آموزش نسل بعدی کارآفرینان جهانی و متخصصان هوش مصنوعی، برنامه کارآموزی جامعی را ارائه می‌دهد. 
              این برنامه 3 ماهه شامل پروژه‌های واقعی، منتورشیپ حرفه‌ای، گواهینامه معتبر و فرصت استخدام برای افراد برتر است.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">دپارتمان‌های موجود</h2>
            <p className="text-lg text-muted-foreground">
              بر اساس علاقه و مهارت‌های خود، یکی از دپارتمان‌های زیر را انتخاب کنید
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {departments.map((dept) => (
              <Card key={dept.value} className="text-center hover:border-primary/50 transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <dept.icon className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold">{dept.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">فرم ثبت درخواست</h2>
              <p className="text-lg text-muted-foreground">
                فرم زیر را با دقت تکمیل کنید تا تیم ما بتواند بهترین دپارتمان را برای شما پیشنهاد دهد
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                        placeholder="نام کامل خود را وارد کنید"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">شماره تماس *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="09123456789"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">سن *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleChange("age", e.target.value)}
                        placeholder="سن خود را وارد کنید"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">شهر *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="شهر محل سکونت"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desired_department">دپارتمان مورد نظر *</Label>
                      <Select value={formData.desired_department} onValueChange={(value) => handleChange("desired_department", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">در دسترس بودن *</Label>
                      <Select value={formData.availability} onValueChange={(value) => handleChange("availability", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">تمام وقت</SelectItem>
                          <SelectItem value="part_time">پاره وقت</SelectItem>
                          <SelectItem value="flexible">انعطاف‌پذیر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">تخصص یا مهارت‌های شما</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleChange("specialization", e.target.value)}
                      placeholder="مثال: طراحی گرافیک، برنامه‌نویسی، بازاریابی دیجیتال"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="self_introduction">معرفی کوتاه از خود و انگیزه شما</Label>
                    <Textarea
                      id="self_introduction"
                      value={formData.self_introduction}
                      onChange={(e) => handleChange("self_introduction", e.target.value)}
                      placeholder="چرا می‌خواهید در آکادمی رفیعی کارآموزی کنید؟ چه چیزی شما را متمایز می‌کند؟"
                      rows={5}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "در حال ارسال..." : "ثبت درخواست"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
