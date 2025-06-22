
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import HubBanner from "@/components/HubBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Globe, Star } from "lucide-react";
import { Link } from "react-router-dom";

const SolidarityLanding = () => {
  return (
    <MainLayout>
      <Hero
        title="همبستگی و حمایت"
        subtitle="با هم قوی‌تریم، با هم موفق‌تریم"
        ctaText="عضویت در جامعه"
        ctaLink="/hub"
        backgroundType="glow"
        glowTheme="purple"
      />

      <HubBanner />

      {/* Solidarity Values */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              ارزش‌های همبستگی
            </h2>
            <p className="text-lg text-muted-foreground">
              اصول و ارزش‌هایی که جامعه ما را شکل می‌دهند
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>محبت و همدلی</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  با مهر و محبت یکدیگر را یاری می‌کنیم
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>همکاری و تعامل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  در کنار هم، برای موفقیت همه تلاش می‌کنیم
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>شمولیت و برابری</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  فرصت‌های یکسان برای همه اعضای جامعه
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>تعالی و رشد</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  به دنبال بهترین نسخه از خودمان هستیم
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            آماده عضویت در خانواده بزرگ ما هستید؟
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            با پیوستن به هاب بدون مرز، بخشی از جامعه‌ای پرانرژی و حمایتگر شوید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/hub">
                ورود به هاب بدون مرز
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/boundless">
                درباره برنامه بدون مرز
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default SolidarityLanding;
