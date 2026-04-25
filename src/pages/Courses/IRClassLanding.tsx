import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/Layout/MainLayout";
import DirectEnrollmentForm from "@/components/Course/DirectEnrollmentForm";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowDown,
  Check,
  Target,
  TrendingUp,
  Briefcase,
  Users,
  Clock,
  ShieldCheck,
  Zap,
  Award,
  BookOpen,
  MessageCircle,
  ChevronLeft,
  Megaphone,
  ShoppingBag,
  CreditCard,
  FileText,
  Sparkles,
  Calendar,
  Gift,
} from "lucide-react";

const IRAN_GREEN = "142 71% 35%";
const IRAN_RED = "356 75% 48%";

const IRClassLanding = () => {
  const [, setCourseId] = useState<string | null>(null);
  const courseSlug = "ir";

  useEffect(() => {
    document.title = "کلاس رایگان ایران ۱۴۰۵ | راه‌اندازی بیزینس در ایران";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "کلاس رایگان راه‌اندازی بیزینس در ایران ۱۴۰۵ - دستورالعمل قدم‌به‌قدم، فرصت‌های پولساز پلتفرم‌های داخلی، تبلیغات بله، باسلام، ترب، پنل‌های پیامکی و درگاه پرداخت."
      );
    }
  }, []);

  useEffect(() => {
    const fetchCourseId = async () => {
      try {
        const { data } = await supabase
          .from("courses")
          .select("id")
          .eq("slug", courseSlug)
          .single();
        if (data) setCourseId(data.id);
      } catch (e) {
        console.error("Error fetching course:", e);
      }
    };
    fetchCourseId();
  }, [courseSlug]);

  const scrollToEnrollment = () =>
    document
      .querySelector("#enrollment-section")
      ?.scrollIntoView({ behavior: "smooth" });

  const features = [
    {
      icon: Target,
      title: "دستورالعمل قدم‌به‌قدم",
      description:
        "نقشه راه عملی برای راه‌اندازی بیزینس در شرایط فعلی ایران ۱۴۰۵",
    },
    {
      icon: TrendingUp,
      title: "فرصت‌های پولساز ۱۴۰۵",
      description:
        "بهترین فرصت‌های درآمدزایی در پلتفرم‌های داخلی برای سال جدید",
    },
    {
      icon: Megaphone,
      title: "کمپین تبلیغاتی و فروش",
      description:
        "آموزش طراحی و اجرای کمپین در بله، باسلام، ترب و پنل‌های پیامکی",
    },
    {
      icon: FileText,
      title: "چک‌لیست و فایل اجرایی",
      description:
        "فایل چک‌لیست و دستورالعمل متنی برای تمام اقدام‌های کلاس",
    },
  ];

  const platforms = [
    { icon: Megaphone, name: "تبلیغات بله", color: IRAN_GREEN },
    { icon: ShoppingBag, name: "باسلام", color: IRAN_RED },
    { icon: TrendingUp, name: "ترب", color: IRAN_GREEN },
    { icon: MessageCircle, name: "پنل‌های پیامکی", color: IRAN_RED },
    { icon: CreditCard, name: "درگاه پرداخت", color: IRAN_GREEN },
    { icon: Sparkles, name: "و ابزارهای داخلی دیگر", color: IRAN_RED },
  ];

  const benefits = [
    "دسترسی کامل به ویدیو کلاس رایگان",
    "فایل چک‌لیست و دستورالعمل متنی تمام اقدامات",
    "آموزش کمپین تبلیغاتی و فروش در پلتفرم‌های داخلی",
    "معرفی فرصت‌های پولساز سال ۱۴۰۵",
    "پشتیبانی و مشاوره بررسی روند رایگان در طول کلاس",
  ];

  const targetAudience = [
    {
      icon: Users,
      text: "کسانی که می‌خواهند در شرایط فعلی ایران بیزینس راه‌اندازی کنند",
    },
    {
      icon: Briefcase,
      text: "صاحبان کسب‌وکارهای کوچک که به دنبال رشد در پلتفرم‌های داخلی هستند",
    },
    {
      icon: Clock,
      text: "افرادی که نیاز به نقشه راه روشن و سریع دارند",
    },
    {
      icon: Zap,
      text: "علاقه‌مندان به یادگیری تبلیغات و فروش در ابزارهای داخلی",
    },
  ];

  const stats = [
    { value: "۱۰۰٪", label: "رایگان" },
    { value: "۱۴۰۵", label: "به‌روز و جدید" },
    { value: "+۵", label: "پلتفرم داخلی" },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Hero */}
        <section className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, hsl(${IRAN_GREEN} / 0.06), hsl(var(--background)), hsl(${IRAN_RED} / 0.06))`,
            }}
          />
          <div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-40"
            style={{ background: `hsl(${IRAN_GREEN} / 0.25)` }}
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{ background: `hsl(${IRAN_RED} / 0.2)` }}
          />

          <div className="container relative z-10 max-w-5xl mx-auto">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 mb-6">
                  <Badge
                    className="px-4 py-2 text-sm font-medium border-0 text-white"
                    style={{ background: `hsl(${IRAN_GREEN})` }}
                  >
                    <Gift className="h-3.5 w-3.5 ml-1" />
                    کلاس کاملاً رایگان
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 text-sm">
                    آکادمی رفیعی
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-4 leading-tight">
                  کلاس رایگان{" "}
                  <span
                    className="inline-block"
                    style={{
                      background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    ایران ۱۴۰۵
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-foreground/90 mb-3 max-w-3xl mx-auto font-semibold">
                  راه‌اندازی بیزینس در شرایط فعلی ایران
                </p>

                <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  دستورالعمل قدم‌به‌قدم، فرصت‌های پولساز پلتفرم‌های داخلی،
                  آموزش کمپین تبلیغاتی و فروش — همه در یک کلاس رایگان.
                </p>

                <div className="flex flex-wrap justify-center gap-8 mb-10">
                  {stats.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                      className="text-center"
                    >
                      <div
                        className="text-3xl md:text-4xl font-black"
                        style={{
                          color:
                            i % 2 === 0
                              ? `hsl(${IRAN_GREEN})`
                              : `hsl(${IRAN_RED})`,
                        }}
                      >
                        {s.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {s.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Registration Form */}
                <div className="max-w-md mx-auto mb-6">
                  <Card className="border-border/50 shadow-2xl overflow-hidden bg-card/95 backdrop-blur">
                    <div
                      className="h-1.5"
                      style={{
                        background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                      }}
                    />
                    <CardContent className="p-5 md:p-6">
                      <div className="text-center mb-4">
                        <Badge
                          className="mb-2 text-white border-0"
                          style={{ background: `hsl(${IRAN_GREEN})` }}
                        >
                          <Gift className="h-3 w-3 ml-1" />
                          ثبت‌نام سریع
                        </Badge>
                        <h3 className="text-base md:text-lg font-bold text-foreground">
                          همین الان دسترسی رایگان بگیرید
                        </h3>
                      </div>
                      <DirectEnrollmentForm
                        courseSlug={courseSlug}
                        courseName="کلاس دستورالعمل ایران"
                      >
                        دریافت دسترسی رایگان
                      </DirectEnrollmentForm>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      document
                        .querySelector("#features")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="h-12 px-8 rounded-xl"
                  >
                    مشاهده سرفصل‌های کلاس
                    <ArrowDown className="mr-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* What you'll learn */}
        <section id="features" className="py-20 px-4 bg-muted/30">
          <div className="container max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <Badge variant="outline" className="mb-4">
                محتوای کلاس
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                در این کلاس رایگان چه یاد می‌گیرید؟
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ۴ بخش کلیدی برای شروع بیزینس در ایران ۱۴۰۵
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors overflow-hidden">
                    <div
                      className="h-1"
                      style={{
                        background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                      }}
                    />
                    <CardContent className="p-6 flex gap-5">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            i % 2 === 0
                              ? `hsl(${IRAN_GREEN} / 0.1)`
                              : `hsl(${IRAN_RED} / 0.1)`,
                        }}
                      >
                        <f.icon
                          className="h-7 w-7"
                          style={{
                            color:
                              i % 2 === 0
                                ? `hsl(${IRAN_GREEN})`
                                : `hsl(${IRAN_RED})`,
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {f.title}
                        </h3>
                        <p className="text-muted-foreground">{f.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="py-20 px-4 bg-background">
          <div className="container max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge variant="outline" className="mb-4">
                پلتفرم‌های داخلی
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                ابزارهایی که در این کلاس بررسی می‌کنیم
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                تمرکز کامل روی پلتفرم‌های داخلی ایران که حتی در شرایط قطعی
                اینترنت بین‌المللی هم کار می‌کنند.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {platforms.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Card className="border-border/50 hover:shadow-lg transition-all h-full">
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `hsl(${p.color} / 0.1)` }}
                      >
                        <p.icon
                          className="h-6 w-6"
                          style={{ color: `hsl(${p.color})` }}
                        />
                      </div>
                      <span className="font-semibold text-foreground text-sm md:text-base">
                        {p.name}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
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
                  هدایای کلاس
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  با ثبت‌نام رایگان چه دریافت می‌کنید؟
                </h2>
                <ul className="space-y-4">
                  {benefits.map((b, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background:
                            i % 2 === 0
                              ? `hsl(${IRAN_GREEN} / 0.15)`
                              : `hsl(${IRAN_RED} / 0.15)`,
                        }}
                      >
                        <Check
                          className="h-4 w-4"
                          style={{
                            color:
                              i % 2 === 0
                                ? `hsl(${IRAN_GREEN})`
                                : `hsl(${IRAN_RED})`,
                          }}
                        />
                      </div>
                      <span className="text-foreground">{b}</span>
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
                    <BookOpen
                      className="h-8 w-8 mx-auto mb-3"
                      style={{ color: `hsl(${IRAN_GREEN})` }}
                    />
                    <h4 className="font-semibold mb-1">ویدیو کلاس</h4>
                    <p className="text-sm text-muted-foreground">
                      دسترسی کامل و رایگان
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-background border-border/50">
                  <CardContent className="p-5 text-center">
                    <FileText
                      className="h-8 w-8 mx-auto mb-3"
                      style={{ color: `hsl(${IRAN_RED})` }}
                    />
                    <h4 className="font-semibold mb-1">چک‌لیست</h4>
                    <p className="text-sm text-muted-foreground">
                      فایل اجرایی متنی
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-background border-border/50">
                  <CardContent className="p-5 text-center">
                    <MessageCircle
                      className="h-8 w-8 mx-auto mb-3"
                      style={{ color: `hsl(${IRAN_GREEN})` }}
                    />
                    <h4 className="font-semibold mb-1">پشتیبانی</h4>
                    <p className="text-sm text-muted-foreground">
                      مشاوره رایگان در کلاس
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-background border-border/50">
                  <CardContent className="p-5 text-center">
                    <Calendar
                      className="h-8 w-8 mx-auto mb-3"
                      style={{ color: `hsl(${IRAN_RED})` }}
                    />
                    <h4 className="font-semibold mb-1">به‌روز ۱۴۰۵</h4>
                    <p className="text-sm text-muted-foreground">
                      مخصوص شرایط فعلی
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Audience */}
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
                مخاطبان کلاس
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                این کلاس برای چه کسانی است؟
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {targetAudience.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="border-border/50 hover:border-primary/30 transition-colors h-full">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            i % 2 === 0
                              ? `hsl(${IRAN_GREEN} / 0.1)`
                              : `hsl(${IRAN_RED} / 0.1)`,
                        }}
                      >
                        <item.icon
                          className="h-6 w-6"
                          style={{
                            color:
                              i % 2 === 0
                                ? `hsl(${IRAN_GREEN})`
                                : `hsl(${IRAN_RED})`,
                          }}
                        />
                      </div>
                      <p className="text-foreground font-medium">{item.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Upsell to Iran course */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="overflow-hidden border-0 shadow-2xl relative">
                <div
                  className="h-2"
                  style={{
                    background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                  }}
                />
                <CardContent className="p-8 md:p-12 text-center">
                  <Badge
                    className="mb-4 text-white border-0"
                    style={{ background: `hsl(${IRAN_RED})` }}
                  >
                    پس از کلاس رایگان
                  </Badge>
                  <h2 className="text-2xl md:text-4xl font-black mb-4">
                    دوره جامع{" "}
                    <span
                      style={{
                        background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      ایران
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                    اگر می‌خواهید عمیق‌تر یاد بگیرید، دوره کامل «ایران» با ۴
                    فاز و ۲۶ اپیزود تخصصی، تمام جزئیات راه‌اندازی و توسعه
                    بیزینس در پلتفرم‌های داخلی ایران را آموزش می‌دهد.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg rounded-xl border-2"
                    style={{ borderColor: `hsl(${IRAN_GREEN})` }}
                  >
                    <a href="/courses/iran">
                      مشاهده دوره جامع ایران
                      <ChevronLeft className="mr-2 h-5 w-5" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Trust */}
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap justify-center gap-8 md:gap-16"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className="h-6 w-6"
                  style={{ color: `hsl(${IRAN_GREEN})` }}
                />
                <span className="text-foreground font-medium">
                  ۱۰۰٪ رایگان
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Award
                  className="h-6 w-6"
                  style={{ color: `hsl(${IRAN_RED})` }}
                />
                <span className="text-foreground font-medium">
                  مدرس رضا رفیعی
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Users
                  className="h-6 w-6"
                  style={{ color: `hsl(${IRAN_GREEN})` }}
                />
                <span className="text-foreground font-medium">
                  پشتیبانی در کلاس
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Enrollment */}
        <section
          id="enrollment-section"
          className="py-20 px-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(${IRAN_GREEN} / 0.05), hsl(var(--background)), hsl(${IRAN_RED} / 0.05))`,
          }}
        >
          <div className="container max-w-lg mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <Badge
                className="mb-4 text-white border-0"
                style={{ background: `hsl(${IRAN_GREEN})` }}
              >
                ثبت‌نام رایگان
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                ثبت‌نام در کلاس رایگان ایران ۱۴۰۵
              </h2>
              <p className="text-muted-foreground">
                اطلاعات خود را وارد کنید تا دسترسی به کلاس و چک‌لیست‌ها را
                دریافت کنید
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-border/50 shadow-2xl overflow-hidden">
                <div
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))`,
                  }}
                />
                <CardContent className="p-6">
                  <DirectEnrollmentForm
                    courseSlug={courseSlug}
                    courseName="کلاس رایگان ایران ۱۴۰۵"
                  >
                    دریافت دسترسی رایگان
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
              کلاس رایگان ایران ۱۴۰۵ بخشی از مجموعه آموزشی{" "}
              <strong>آکادمی رفیعی</strong> است.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              تمامی حقوق محفوظ است © ۱۴۰۵
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default IRClassLanding;
