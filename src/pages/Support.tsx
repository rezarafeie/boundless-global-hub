
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, Clock, Headphones, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Support = () => {
  return (
    <MainLayout>
      <Hero
        title="مرکز پشتیبانی"
        subtitle="ما اینجا هستیم تا به شما کمک کنیم"
        ctaText="شروع گفتگو"
        ctaLink="/hub/messenger"
        backgroundType="glow"
        glowTheme="blue"
      />

      {/* Support Options */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              راه‌های ارتباط با پشتیبانی
            </h2>
            <p className="text-lg text-muted-foreground">
              بهترین روش برای دریافت کمک را انتخاب کنید
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>پیام‌رسان هاب</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  سریع‌ترین راه برای دریافت پاسخ از تیم پشتیبانی
                </p>
                <Button asChild className="w-full">
                  <Link to="/hub/messenger">
                    شروع گفتگو
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>تماس تلفنی</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  برای مسائل فوری و پیچیده با ما تماس بگیرید
                </p>
                <Button variant="outline" className="w-full">
                  ۰۲۱-۱۲۳۴۵۶۷۸
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>ایمیل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  برای سوالات تفصیلی ایمیل ارسال کنید
                </p>
                <Button variant="outline" className="w-full">
                  support@rafiei.co
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Support Hours */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                ساعات کاری پشتیبانی
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>شنبه تا چهارشنبه: ۹:۰۰ تا ۱۸:۰۰</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>پنج‌شنبه: ۹:۰۰ تا ۱۴:۰۰</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>جمعه: تعطیل</span>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="w-5 h-5" />
                  پشتیبانی ویژه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  دانشجویان دوره بدون مرز از پشتیبانی ۲۴ ساعته برخوردار هستند
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/boundless">
                    اطلاعات بیشتر
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              سوالات متداول
            </h2>
            <p className="text-lg text-muted-foreground">
              شاید پاسخ سوال شما اینجا باشد
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>چگونه می‌توانم دوره‌ای را خریداری کنم؟</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  برای خرید دوره، ابتدا وارد صفحه دوره مورد نظر شوید و روی دکمه "ثبت نام" کلیک کنید.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>آیا امکان استرداد وجه وجود دارد؟</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  بله، تا ۷۲ ساعت پس از خرید امکان استرداد وجه با شرایط خاص وجود دارد.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>چگونه به دوره‌های خریداری شده دسترسی پیدا کنم؟</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  پس از خرید، لینک دسترسی به دوره از طریق ایمیل و پیامک برای شما ارسال می‌شود.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>آیا گواهی برای دوره‌ها صادر می‌شود؟</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  بله، پس از تکمیل موفقیت‌آمیز دوره، گواهی معتبر برای شما صادر می‌شود.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link to="/hub/messenger">
                <Users className="w-4 h-4 mr-2" />
                سوال خاص دارید؟ با ما صحبت کنید
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Support;
