
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, BookOpen, Users, Target, Heart, Star } from "lucide-react";

const About = () => {
  const achievements = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "بیش از 10000 دانشجو",
      description: "در دوره‌های مختلف آموزشی"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "50+ دوره آموزشی",
      description: "در حوزه‌های کسب و کار و توسعه شخصی"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "10 سال تجربه",
      description: "در آموزش و مشاوره کسب و کار"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "98% رضایت",
      description: "از کیفیت دوره‌ها و خدمات"
    }
  ];

  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "تعالی و کیفیت",
      description: "تلاش برای ارائه بهترین کیفیت در تمام خدمات"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "تعهد به دانشجو",
      description: "قرار دادن موفقیت دانشجویان در اولویت"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "یادگیری مادام‌العمر",
      description: "ترویج فرهنگ یادگیری مستمر و به‌روزرسانی دانش"
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">درباره آکادمی رفیعی</Badge>
              <h1 className="text-4xl font-bold mb-6">
                پیشگام در آموزش کسب و کار و توسعه شخصی
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                آکادمی رفیعی با بیش از یک دهه تجربه در حوزه آموزش، مشاوره و توسعه کسب و کار، 
                رهبری فکری در حوزه کارآفرینی و نوآوری محسوب می‌شود. ما با ارائه دوره‌های کاربردی 
                و مشاوره‌های تخصصی، افراد را برای موفقیت در دنیای کسب و کار آماده می‌کنیم.
              </p>
              <Button asChild size="lg" className="bg-black hover:bg-black/90 text-white">
                <a href="/contact">تماس با ما</a>
              </Button>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80" 
                alt="آکادمی رفیعی"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80" 
                alt="رضا رفیعی"
                className="rounded-2xl shadow-xl w-full max-w-md mx-auto"
              />
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-4">بنیانگذار و مدیرعامل</Badge>
              <h2 className="text-3xl font-bold mb-4">رضا رفیعی</h2>
              <p className="text-lg text-muted-foreground mb-6">
                کارآفرین، نویسنده و مربی کسب و کار با بیش از 15 سال تجربه در حوزه کسب و کار 
                و سرمایه‌گذاری. رضا رفیعی بنیانگذار چندین شرکت موفق و نویسنده کتاب‌های پرفروش 
                در حوزه کارآفرینی است.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>نویسنده 5 کتاب پرفروش در حوزه کسب و کار</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>بنیانگذار 3 شرکت موفق تکنولوژی</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>مشاور بیش از 100 استارتاپ و شرکت</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>سخنران TEDx و کنفرانس‌های بین‌المللی</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">ماموریت و چشم‌انداز</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              ما معتقدیم که هر فردی قابلیت تبدیل شدن به یک کارآفرین موفق را دارد. 
              ماموریت ما ارائه ابزارها، دانش و مهارت‌های لازم برای این تحول است.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                ماموریت ما
              </h3>
              <p className="text-muted-foreground">
                توانمندسازی افراد و کسب و کارها از طریق ارائه آموزش‌های کاربردی، 
                مشاوره‌های تخصصی و ابزارهای نوین کسب و کار برای ایجاد تحول مثبت 
                در جامعه و اقتصاد کشور.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-primary" />
                چشم‌انداز ما
              </h3>
              <p className="text-muted-foreground">
                تبدیل شدن به پیشرو و مرجع آموزش کسب و کار در منطقه و ایجاد اکوسیستمی 
                که در آن هر فرد بتواند به بالاترین پتانسیل خود دست یابد و در مسیر 
                موفقیت قدم بردارد.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">ارزش‌های ما</h2>
            <p className="text-lg text-muted-foreground">
              اصول و باورهایی که راهنمای کار ما هستند
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">دستاوردهای ما</h2>
            <p className="text-lg text-muted-foreground">
              نتایج و موفقیت‌هایی که افتخار داریم
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {achievement.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
                <p className="text-muted-foreground text-sm">{achievement.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">آماده شروع هستید؟</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            با ما همراه شوید و سفر خود به سوی موفقیت را آغاز کنید. 
            دوره‌های ما را کشف کنید و مهارت‌های جدید بیاموزید.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100">
              <a href="/courses">مشاهده دوره‌ها</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
              <a href="/contact">تماس با ما</a>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
