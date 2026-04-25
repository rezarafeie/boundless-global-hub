import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/Layout/MainLayout";
import SectionTitle from "@/components/SectionTitle";
import DirectEnrollmentForm from "@/components/Course/DirectEnrollmentForm";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import CourseDiscountBanner from "@/components/BlackFriday/CourseDiscountBanner";
import { supabase } from "@/integrations/supabase/client";
import {
  Flag,
  ShieldCheck,
  Wifi,
  TrendingUp,
  Brain,
  Briefcase,
  Package,
  FileDigit,
  Megaphone,
  CreditCard,
  Globe2,
  Users,
  CheckCircle2,
  Sparkles,
  Target,
  Layers,
  Rocket,
  PlayCircle,
  Lightbulb,
  ShoppingBag,
  Building2,
  BarChart3,
  Smartphone,
  MessageSquare,
} from "lucide-react";

const phases = [
  {
    id: "phase-1",
    badge: "فاز ۱",
    title: "درک بازار + استراتژی پایه + بیزینس مدل‌ها",
    icon: <Target className="h-6 w-6" />,
    color: "from-primary/20 to-primary/5",
    episodes: [
      {
        n: "۰۱",
        title: "مقدمه — استارت ساخت بیزینس در ایران",
        teacher: "رضا رفیعی",
        items: ["معرفی دوره و چشم‌انداز", "چرا حالا زمان شروع است"],
      },
      {
        n: "۰۲",
        title: "واقعیت بازار ایران",
        teacher: "رضا رفیعی",
        items: ["هرم مازلو در شرایط بحرانی", "تفاوت بازار ایران با بازار بین‌المللی"],
      },
      {
        n: "۰۳",
        title: "مسیر دوره ایران",
        teacher: "رضا رفیعی",
        items: [
          "فاز ۱: درک بازار + استراتژی پایه + مدل‌های کسب‌وکار",
          "فاز ۲: ساخت زیرساخت + پیاده‌سازی عملی",
          "فاز ۳: مارکتینگ + جذب مشتری",
          "فاز ۴: هوش مصنوعی برای بیزینس",
        ],
      },
      {
        n: "۰۴",
        title: "انتقال تجربه از بحران",
        teacher: "رضا رفیعی",
        items: [
          "تورم واقعی، ناامنی شغلی، افزایش هزینه زندگی",
          "خطرناک‌ترین نگرش: «همه چی درست میشه»",
          "واقعیت + حرکت = نجات",
          "شکستن دروغ‌های ذهنی: «از ایران نمیشه / جنگه / اینترنت قطعه»",
        ],
      },
      {
        n: "۰۵",
        title: "انتخاب بیزینس مدل امن در ایران",
        teacher: "رضا رفیعی",
        items: ["محصول فیزیکی", "خدمات", "فایل دیجیتال"],
      },
      {
        n: "۰۶",
        title: "بیزینس مدل فروش خدمات",
        teacher: "رضا رفیعی",
        items: [
          "ساخت پکیج درآمدی — مسیر خدمات شخصی",
          "آربیتراژ خدمات",
          "مسیر خدمات هوش مصنوعی",
        ],
      },
      {
        n: "۰۷",
        title: "بیزینس مدل فروش محصول فیزیکی",
        teacher: "رضا رفیعی",
        items: ["مسیر محصولات خانواده", "مسیر محصولات فیزیکی شخصی"],
      },
      {
        n: "۰۸",
        title: "دراپ‌شیپینگ و تأمین‌کننده",
        teacher: "رضا رفیعی",
        items: [
          "مزایای دراپ‌شیپینگ",
          "ساخت فروشگاه دراپ‌شیپینگ",
          "پیدا کردن نیچ و محصولات پردرآمد",
        ],
      },
      {
        n: "۰۹",
        title: "بیزینس مدل فروش فایل دیجیتال",
        teacher: "رضا رفیعی",
        items: [
          "مزایای فروش فایل",
          "فایل‌های پردرآمد",
          "پلتفرم‌های فروش فایل دیجیتال",
          "افزایش فروش فایل + قیمت‌گذاری منطقی",
        ],
      },
      {
        n: "۰۱",
        title: "همه چیز درباره مهارت بیزینس آنلاین",
        teacher: "متین پورخالقی",
        items: [
          "مهارت بیزینس آنلاین چیست و چرا اهمیت دارد",
          "دستاوردهای کلاس IR",
          "تجربه ما در بیزینس آنلاین",
          "این کلاس برای چه کسانی مناسب است",
        ],
      },
      {
        n: "۰۲",
        title: "راهنمای انتخاب مسیر و بیزینس مدل",
        teacher: "متین پورخالقی",
        items: [
          "بیزینس دیجیتال به‌عنوان ساید بیزینس",
          "معرفی ۴ بیزینس مدل (فایل دیجیتال، آکادمی آنلاین، خدمات دیجیتال، محصول فیزیکی)",
          "۶ سؤال کلیدی برای انتخاب مسیر",
          "ذهنیت سیستم‌سازی دیجیتال (چرخه ورودی غیرفعال)",
        ],
      },
      {
        n: "۰۳",
        title: "بیزینس مدل فروشگاه اینترنتی",
        teacher: "متین پورخالقی",
        items: [
          "۲ مدل فعالیت: واسطه‌گری و فروشگاه شخصی",
          "ساخت سایت فروشگاهی تست سریع",
          "نقش سوشال مدیا",
          "استراتژی تک‌محصوله",
          "۳ مرحله اصلی فروش",
        ],
      },
      {
        n: "۰۴",
        title: "بیزینس مدل فروش فایل دیجیتال",
        teacher: "متین پورخالقی",
        items: [
          "حاشیه سود این بیزینس",
          "۳ نوع محصول دیجیتال",
          "استراتژی قرص آبی و قرمز",
          "روش‌های فروش (مارکت‌پلیس / سایت شخصی)",
          "پیاده‌سازی تبلیغات",
        ],
      },
    ],
  },
  {
    id: "phase-2",
    badge: "فاز ۲",
    title: "ساخت زیرساخت + پیاده‌سازی عملی",
    icon: <Layers className="h-6 w-6" />,
    color: "from-accent/20 to-accent/5",
    episodes: [
      {
        n: "۱۰",
        title: "معرفی سایت‌سازها و ابزارهای ایرانی",
        teacher: "رضا رفیعی",
        items: [
          "سایت‌های ایرانی کاربردی",
          "سایت‌های هوش مصنوعی ایرانی",
          "سایت‌سازهای ایرانی و سایت اختصاصی",
        ],
      },
      {
        n: "۱۱",
        title: "درگاه‌های پرداخت",
        teacher: "رضا رفیعی",
        items: ["زرین‌پال", "زیبال", "پی‌پینگ"],
      },
      {
        n: "۱۲",
        title: "مجوزها — اینماد",
        teacher: "رضا رفیعی",
        items: ["دریافت اینماد", "الزامات قانونی"],
      },
      {
        n: "۱۳",
        title: "برندسازی پایه",
        teacher: "متین پورخالقی",
        items: [
          "Positioning قبل از انتخاب نام",
          "آرکتایپ برند و ۱۲ آرکتایپ اصلی",
          "مدل‌های ساخت نام: توصیفی، استعاری، ترکیبی، ساختگی",
          "۴ معیار انتخاب نام حرفه‌ای + ساخت نام با AI",
          "خرید دامنه و معرفی ایران‌سرور",
        ],
      },
      {
        n: "۱۴",
        title: "آموزش کامل پلتفرم باسلام",
        teacher: "متین پورخالقی",
        items: [
          "ساخت اکانت در باسلام",
          "فریم‌ورک F E E L برای فروش",
          "صفحه محصول‌نویسی با AI",
          "قانون ۳ ثانیه و قانون اسکن چشم",
          "تبدیل ویژگی به تجربه در محصول‌نویسی",
        ],
      },
      {
        n: "۱۵",
        title: "همه چیز درباره درگاه‌های پرداخت",
        teacher: "متین پورخالقی",
        items: [
          "ساخت اکانت زیبال + اینماد + سامانه مودیان",
          "طراحی تجربه بعد از خرید (۳ قدم)",
          "استراتژی لحظه پرداخت + قانون ۲ کلیک",
          "۳ محور قیمت‌گذاری: شدت مشکل، سرعت تبدیل، عمق دسترسی",
        ],
      },
    ],
  },
  {
    id: "phase-3",
    badge: "فاز ۳",
    title: "مارکتینگ + جذب مشتری",
    icon: <Megaphone className="h-6 w-6" />,
    color: "from-secondary/30 to-secondary/5",
    episodes: [
      {
        n: "۱۳",
        title: "مقدمه مارکتینگ + جذب مشتری",
        teacher: "رضا رفیعی",
        items: [
          "استراتژی‌ها و کمپین تبلیغاتی",
          "فروش در پلتفرم‌های ایرانی",
          "آموزش مجوزها و زیرساخت‌ها",
        ],
      },
      {
        n: "۱۴",
        title: "کمپین تبلیغاتی",
        teacher: "رضا رفیعی",
        items: [
          "تعیین هدف با روش SMART",
          "ایجاد محتوا براساس پرسونا",
          "انتخاب رسانه و ران کردن تبلیغ",
          "تحلیل و بهبود تبلیغ",
        ],
      },
      {
        n: "۱۵",
        title: "فروش در فضای آنلاین — کمپین ۵ مرحله‌ای",
        teacher: "رضا رفیعی",
        items: ["طراحی قیف فروش", "اجرای کمپین ۵ مرحله‌ای"],
      },
      {
        n: "۱۶",
        title: "آموزش پلتفرم یکتانت",
        teacher: "متین پورخالقی",
        items: [
          "ساخت اکانت + ابزار جریان",
          "تارگت‌گذاری پیشرفته با AI",
          "تحلیل ۰ تا ۱۰۰ کمپین با AI",
          "اصطلاحات: impressions, clicks, ctr, cpc, cpm, conversion",
          "پرامپت‌های آماده تحلیل و پرسونا",
        ],
      },
      {
        n: "۱۷",
        title: "آموزش پلتفرم دیوار",
        teacher: "متین پورخالقی",
        items: [
          "روش‌های استفاده (آگهی + تبلیغات)",
          "پنل پنجره برای دیوار",
          "قالب عنوان‌نویسی + ۶ کلمه پر کلیک",
          "قالب ۶ بخش محتوای آگهی + پرامپت AI",
        ],
      },
      {
        n: "۱۸",
        title: "آموزش پنل‌های پیامکی",
        teacher: "متین پورخالقی",
        items: [
          "انتخاب پنل و خرید خط",
          "نوشتن پیامک تبدیل‌محور",
          "ست‌آپ کمپین‌های پیامکی",
        ],
      },
    ],
  },
  {
    id: "phase-4",
    badge: "فاز ۴",
    title: "هوش مصنوعی برای بیزینس",
    icon: <Brain className="h-6 w-6" />,
    color: "from-primary/30 to-accent/10",
    episodes: [
      {
        n: "AI",
        title: "ابزارهای AI ایرانی برای بیزینس",
        teacher: "تیم رفیعی",
        items: [
          "اتوماسیون فروش با AI",
          "تولید محتوای فارسی",
          "سرویس‌های AI داخلی + پرامپت‌های آماده",
        ],
      },
    ],
  },
];

const pillars = [
  { icon: <Flag className="h-8 w-8" />, title: "مخصوص بازار ایران", desc: "همه چیز با پلتفرم‌های ایرانی، بدون نیاز به اینترنت بین‌المللی" },
  { icon: <Wifi className="h-8 w-8" />, title: "مقاوم در برابر قطعی", desc: "استراتژی‌هایی که حتی در شرایط بحرانی کار می‌کنند" },
  { icon: <ShoppingBag className="h-8 w-8" />, title: "۴ بیزینس مدل کاربردی", desc: "خدمات، محصول فیزیکی، فایل دیجیتال، دراپ‌شیپینگ" },
  { icon: <Building2 className="h-8 w-8" />, title: "زیرساخت کامل", desc: "درگاه پرداخت، اینماد، سامانه مودیان، باسلام" },
  { icon: <BarChart3 className="h-8 w-8" />, title: "مارکتینگ ایرانی", desc: "یکتانت، دیوار، پنل پیامکی + کمپین ۵ مرحله‌ای" },
  { icon: <Brain className="h-8 w-8" />, title: "هوش مصنوعی فارسی", desc: "AI ایرانی برای محتوا، فروش و تحلیل" },
];

const audience = [
  { icon: <Briefcase />, title: "صاحبان کسب‌وکار سنتی", desc: "که می‌خواهند آنلاین شوند" },
  { icon: <Smartphone />, title: "فریلنسرها و خدمات‌دهندگان", desc: "که قطعی اینترنت متوقفشان کرده" },
  { icon: <Package />, title: "فروشندگان محصول", desc: "که دنبال کانال‌های جدیدند" },
  { icon: <Rocket />, title: "افراد در ابتدای مسیر", desc: "که می‌خواهند از صفر داخل ایران شروع کنند" },
];

const IranLanding = () => {
  const [courseId, setCourseId] = useState<string | null>(null);
  const { isActive: isBlackFridayActive, getCourseDiscount } = useBlackFridayContext();
  const courseSlug = "iran";
  const blackFridayDiscount = courseId ? getCourseDiscount(courseId) : 0;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("courses")
          .select("id")
          .eq("slug", courseSlug)
          .maybeSingle();
        if (data) setCourseId(data.id);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <MainLayout>
      {/* SEO */}
      <head>
        <title>دوره ایران | کسب‌وکار آنلاین در شرایط بحرانی</title>
        <meta name="description" content="دوره جامع ایران: راه‌اندازی و توسعه کسب‌وکار آنلاین با پلتفرم‌های ایرانی، حتی بدون اینترنت بین‌المللی." />
      </head>

      <div className="min-h-screen bg-background">
        {isBlackFridayActive && blackFridayDiscount > 0 && courseId && (
          <div className="container mx-auto px-4 pt-8">
            <CourseDiscountBanner
              discount={blackFridayDiscount}
              courseName="دوره ایران"
              originalPrice={12000000}
              courseSlug={courseSlug}
            />
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="container relative z-10 py-20 md:py-28 px-4 text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <Badge className="px-5 py-2 text-base bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20">
                <Flag className="h-4 w-4 ml-2" />
                دوره‌ای جدید از آکادمی رفیعی
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-l from-primary via-foreground to-accent bg-clip-text text-transparent leading-tight">
              ایران
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              کسب‌وکار آنلاین، در دل بحران
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              وقتی اینترنت بین‌المللی قطع است، وقتی همه می‌گویند نمی‌شود — ما به شما نشان می‌دهیم چطور با پلتفرم‌های ایرانی، یک کسب‌وکار دیجیتال واقعی، پایدار و سودده بسازید.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>۴ فاز کامل</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>۲ مدرس متخصص</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>+۲۰ اپیزود عملی</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>پلتفرم‌های ایرانی</span>
              </div>
            </div>

            <DirectEnrollmentForm
              courseSlug={courseSlug}
              courseName="دوره ایران"
              className="max-w-md mx-auto"
            >
              <Rocket className="ml-2 h-5 w-5" />
              همین حالا ثبت‌نام کنید
            </DirectEnrollmentForm>
          </div>
        </section>

        {/* Why this course */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/30">
                واقعیت تلخ امروز
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                اینترنت بین‌المللی قطعه. حالا چی؟
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                خیلی‌ها فلج شدند. خیلی‌ها بهانه آوردند. ولی بازار ایران، هنوز میلیون‌ها مشتری دارد که منتظر محصول و خدمت شما هستند — فقط باید بدانید کجا و چطور.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((p, i) => (
                <Card
                  key={i}
                  className="p-6 bg-card border-2 border-border hover:border-primary/40 hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {p.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                  <p className="text-muted-foreground">{p.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-5xl">
            <SectionTitle
              title="سرفصل کامل دوره"
              subtitle="۴ فاز پیوسته که شما را از صفر به یک کسب‌وکار سودده می‌رسانند"
              isCentered
            />

            <div className="space-y-8">
              {phases.map((phase) => (
                <div key={phase.id}>
                  <div className={`rounded-2xl bg-gradient-to-l ${phase.color} p-6 mb-4 border-2 border-border`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center text-primary shadow-md">
                        {phase.icon}
                      </div>
                      <div>
                        <Badge className="mb-2 bg-primary text-primary-foreground">{phase.badge}</Badge>
                        <h3 className="text-2xl font-bold">{phase.title}</h3>
                      </div>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-3">
                    {phase.episodes.map((ep, idx) => (
                      <AccordionItem
                        key={`${phase.id}-${idx}`}
                        value={`${phase.id}-${idx}`}
                        className="border-2 border-border rounded-xl px-4 bg-card hover:border-primary/30 transition-colors"
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-4 text-right flex-1">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-sm">
                              {ep.n}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-base md:text-lg">{ep.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                مدرس: {ep.teacher}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 pr-16 pb-2">
                            {ep.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructors */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-5xl">
            <SectionTitle title="مدرسان دوره" isCentered />
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-2xl font-black">
                    ر
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">رضا رفیعی</h3>
                    <p className="text-muted-foreground">بنیان‌گذار آکادمی رفیعی</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  مربی، کارآفرین و بنیان‌گذار آکادمی رفیعی با بیش از ۳۷۰ هزار دانشجو در سراسر جهان. متخصص استراتژی، مدیریت بحران و کسب‌وکار بین‌المللی.
                </p>
              </Card>
              <Card className="p-8 bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground flex items-center justify-center text-2xl font-black">
                    م
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">متین پورخالقی</h3>
                    <p className="text-muted-foreground">متخصص بیزینس آنلاین ایرانی</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  متخصص فروش در پلتفرم‌های ایرانی (باسلام، دیوار، یکتانت)، برندسازی، فروش فایل دیجیتال و راه‌اندازی فروشگاه اینترنتی.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Audience */}
        <section className="py-16 px-4 bg-background">
          <div className="container">
            <SectionTitle title="این دوره برای چه کسانی است؟" isCentered />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {audience.map((a, i) => (
                <Card
                  key={i}
                  className="p-6 text-center bg-card border-2 border-border hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    {a.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-5xl">
            <SectionTitle
              title="پس از این دوره چه چیزی به دست می‌آورید؟"
              isCentered
            />
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "انتخاب یک بیزینس مدل امن و سودده مخصوص بازار ایران",
                "راه‌اندازی فروشگاه در باسلام و سایت اختصاصی",
                "دریافت اینماد و راه‌اندازی درگاه پرداخت ایرانی",
                "اجرای کمپین‌های تبلیغاتی در یکتانت و دیوار",
                "ساخت برند با آرکتایپ و تولید محتوا با AI",
                "نوشتن آگهی و صفحه محصول حرفه‌ای با فریم‌ورک FEEL",
                "کمپین فروش ۵ مرحله‌ای + قیف فروش پیامکی",
                "استفاده از هوش مصنوعی فارسی برای بیزینس",
              ].map((o, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-medium pt-1">{o}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,white,transparent_60%)]" />
          <div className="container relative z-10 max-w-3xl">
            <Lightbulb className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              ایران، سرزمین فرصت‌هاست — برای کسانی که حرکت می‌کنند
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              منتظر «همه چی درست شدن» نباشید. همین امروز بیزینس‌تان را داخل ایران بسازید.
            </p>
            <DirectEnrollmentForm
              courseSlug={courseSlug}
              courseName="دوره ایران"
              className="max-w-md mx-auto bg-background/10 backdrop-blur p-6 rounded-2xl"
            >
              <PlayCircle className="ml-2 h-5 w-5" />
              ثبت‌نام در دوره ایران
            </DirectEnrollmentForm>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default IranLanding;
