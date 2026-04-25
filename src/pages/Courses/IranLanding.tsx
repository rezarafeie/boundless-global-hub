import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/Layout/MainLayout";
import SectionTitle from "@/components/SectionTitle";
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
  Megaphone,
  CreditCard,
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
  Award,
  Star,
  Clock,
  Infinity as InfinityIcon,
  Headphones,
  FileDigit,
  Globe2,
  Zap,
  HeartHandshake,
  GraduationCap,
} from "lucide-react";

const phases = [
  {
    id: "phase-1",
    badge: "فاز ۱",
    title: "درک بازار + استراتژی پایه + بیزینس مدل‌ها",
    icon: <Target className="h-6 w-6" />,
    accent: "from-iran-red/20 via-iran-red/5 to-transparent",
    episodes: [
      { n: "۰۱", title: "مقدمه — استارت ساخت بیزینس در ایران", teacher: "رضا رفیعی", items: ["معرفی دوره و چشم‌انداز", "چرا حالا زمان شروع است"] },
      { n: "۰۲", title: "واقعیت بازار ایران", teacher: "رضا رفیعی", items: ["هرم مازلو در شرایط بحرانی", "تفاوت بازار ایران با بازار بین‌المللی"] },
      { n: "۰۳", title: "مسیر دوره ایران", teacher: "رضا رفیعی", items: ["فاز ۱: درک بازار + استراتژی پایه + مدل‌های کسب‌وکار", "فاز ۲: ساخت زیرساخت + پیاده‌سازی عملی", "فاز ۳: مارکتینگ + جذب مشتری", "فاز ۴: هوش مصنوعی برای بیزینس"] },
      { n: "۰۴", title: "انتقال تجربه از بحران", teacher: "رضا رفیعی", items: ["تورم واقعی، ناامنی شغلی، افزایش هزینه زندگی", "خطرناک‌ترین نگرش: «همه چی درست میشه»", "واقعیت + حرکت = نجات", "شکستن دروغ‌های ذهنی: «از ایران نمیشه / جنگه / اینترنت قطعه»"] },
      { n: "۰۵", title: "انتخاب بیزینس مدل امن در ایران", teacher: "رضا رفیعی", items: ["محصول فیزیکی", "خدمات", "فایل دیجیتال"] },
      { n: "۰۶", title: "بیزینس مدل فروش خدمات", teacher: "رضا رفیعی", items: ["ساخت پکیج درآمدی — مسیر خدمات شخصی", "آربیتراژ خدمات", "مسیر خدمات هوش مصنوعی"] },
      { n: "۰۷", title: "بیزینس مدل فروش محصول فیزیکی", teacher: "رضا رفیعی", items: ["مسیر محصولات خانواده", "مسیر محصولات فیزیکی شخصی"] },
      { n: "۰۸", title: "دراپ‌شیپینگ و تأمین‌کننده", teacher: "رضا رفیعی", items: ["مزایای دراپ‌شیپینگ", "ساخت فروشگاه دراپ‌شیپینگ", "پیدا کردن نیچ و محصولات پردرآمد"] },
      { n: "۰۹", title: "بیزینس مدل فروش فایل دیجیتال", teacher: "رضا رفیعی", items: ["مزایای فروش فایل", "فایل‌های پردرآمد", "پلتفرم‌های فروش فایل دیجیتال", "افزایش فروش فایل + قیمت‌گذاری منطقی"] },
      { n: "۱۰", title: "همه چیز درباره مهارت بیزینس آنلاین", teacher: "متین پورخالقی", items: ["مهارت بیزینس آنلاین چیست و چرا اهمیت دارد", "دستاوردهای کلاس IR", "تجربه ما در بیزینس آنلاین", "این کلاس برای چه کسانی مناسب است"] },
      { n: "۱۱", title: "راهنمای انتخاب مسیر و بیزینس مدل", teacher: "متین پورخالقی", items: ["بیزینس دیجیتال به‌عنوان ساید بیزینس", "معرفی ۴ بیزینس مدل (فایل دیجیتال، آکادمی آنلاین، خدمات دیجیتال، محصول فیزیکی)", "۶ سؤال کلیدی برای انتخاب مسیر", "ذهنیت سیستم‌سازی دیجیتال (چرخه ورودی غیرفعال)"] },
      { n: "۱۲", title: "بیزینس مدل فروشگاه اینترنتی", teacher: "متین پورخالقی", items: ["۲ مدل فعالیت: واسطه‌گری و فروشگاه شخصی", "ساخت سایت فروشگاهی تست سریع", "نقش سوشال مدیا", "استراتژی تک‌محصوله", "۳ مرحله اصلی فروش"] },
      { n: "۱۳", title: "بیزینس مدل فروش فایل دیجیتال", teacher: "متین پورخالقی", items: ["حاشیه سود این بیزینس", "۳ نوع محصول دیجیتال", "استراتژی قرص آبی و قرمز", "روش‌های فروش (مارکت‌پلیس / سایت شخصی)", "پیاده‌سازی تبلیغات"] },
    ],
  },
  {
    id: "phase-2",
    badge: "فاز ۲",
    title: "ساخت زیرساخت + پیاده‌سازی عملی",
    icon: <Layers className="h-6 w-6" />,
    accent: "from-iran-white/40 via-muted to-transparent",
    episodes: [
      { n: "۱۴", title: "معرفی سایت‌سازها و ابزارهای ایرانی", teacher: "رضا رفیعی", items: ["سایت‌های ایرانی کاربردی", "سایت‌های هوش مصنوعی ایرانی", "سایت‌سازهای ایرانی و سایت اختصاصی"] },
      { n: "۱۵", title: "درگاه‌های پرداخت", teacher: "رضا رفیعی", items: ["زرین‌پال", "زیبال", "پی‌پینگ"] },
      { n: "۱۶", title: "مجوزها — اینماد", teacher: "رضا رفیعی", items: ["دریافت اینماد", "الزامات قانونی"] },
      { n: "۱۷", title: "برندسازی پایه", teacher: "متین پورخالقی", items: ["Positioning قبل از انتخاب نام", "آرکتایپ برند و ۱۲ آرکتایپ اصلی", "مدل‌های ساخت نام: توصیفی، استعاری، ترکیبی، ساختگی", "۴ معیار انتخاب نام حرفه‌ای + ساخت نام با AI", "خرید دامنه و معرفی ایران‌سرور"] },
      { n: "۱۸", title: "آموزش کامل پلتفرم باسلام", teacher: "متین پورخالقی", items: ["ساخت اکانت در باسلام", "فریم‌ورک F E E L برای فروش", "صفحه محصول‌نویسی با AI", "قانون ۳ ثانیه و قانون اسکن چشم", "تبدیل ویژگی به تجربه در محصول‌نویسی"] },
      { n: "۱۹", title: "همه چیز درباره درگاه‌های پرداخت", teacher: "متین پورخالقی", items: ["ساخت اکانت زیبال + اینماد + سامانه مودیان", "طراحی تجربه بعد از خرید (۳ قدم)", "استراتژی لحظه پرداخت + قانون ۲ کلیک", "۳ محور قیمت‌گذاری: شدت مشکل، سرعت تبدیل، عمق دسترسی"] },
    ],
  },
  {
    id: "phase-3",
    badge: "فاز ۳",
    title: "مارکتینگ + جذب مشتری",
    icon: <Megaphone className="h-6 w-6" />,
    accent: "from-iran-green/20 via-iran-green/5 to-transparent",
    episodes: [
      { n: "۲۰", title: "مقدمه مارکتینگ + جذب مشتری", teacher: "رضا رفیعی", items: ["استراتژی‌ها و کمپین تبلیغاتی", "فروش در پلتفرم‌های ایرانی", "آموزش مجوزها و زیرساخت‌ها"] },
      { n: "۲۱", title: "کمپین تبلیغاتی", teacher: "رضا رفیعی", items: ["تعیین هدف با روش SMART", "ایجاد محتوا براساس پرسونا", "انتخاب رسانه و ران کردن تبلیغ", "تحلیل و بهبود تبلیغ"] },
      { n: "۲۲", title: "فروش در فضای آنلاین — کمپین ۵ مرحله‌ای", teacher: "رضا رفیعی", items: ["طراحی قیف فروش", "اجرای کمپین ۵ مرحله‌ای"] },
      { n: "۲۳", title: "آموزش پلتفرم یکتانت", teacher: "متین پورخالقی", items: ["ساخت اکانت + ابزار جریان", "تارگت‌گذاری پیشرفته با AI", "تحلیل ۰ تا ۱۰۰ کمپین با AI", "اصطلاحات: impressions, clicks, ctr, cpc, cpm, conversion", "پرامپت‌های آماده تحلیل و پرسونا"] },
      { n: "۲۴", title: "آموزش پلتفرم دیوار", teacher: "متین پورخالقی", items: ["روش‌های استفاده (آگهی + تبلیغات)", "پنل پنجره برای دیوار", "قالب عنوان‌نویسی + ۶ کلمه پر کلیک", "قالب ۶ بخش محتوای آگهی + پرامپت AI"] },
      { n: "۲۵", title: "آموزش پنل‌های پیامکی", teacher: "متین پورخالقی", items: ["انتخاب پنل و خرید خط", "نوشتن پیامک تبدیل‌محور", "ست‌آپ کمپین‌های پیامکی"] },
    ],
  },
  {
    id: "phase-4",
    badge: "فاز ۴",
    title: "هوش مصنوعی فارسی برای بیزینس",
    icon: <Brain className="h-6 w-6" />,
    accent: "from-iran-red/15 via-iran-green/10 to-transparent",
    episodes: [
      { n: "۲۶", title: "ابزارهای AI ایرانی برای بیزینس", teacher: "تیم رفیعی", items: ["اتوماسیون فروش با AI", "تولید محتوای فارسی", "سرویس‌های AI داخلی + پرامپت‌های آماده", "ساخت چت‌بات فارسی برای پشتیبانی"] },
    ],
  },
];

const pillars = [
  { icon: <Flag className="h-7 w-7" />, title: "مخصوص بازار ایران", desc: "همه چیز با پلتفرم‌های ایرانی، بدون نیاز به اینترنت بین‌المللی", color: "iran-red" },
  { icon: <Wifi className="h-7 w-7" />, title: "مقاوم در برابر قطعی", desc: "استراتژی‌هایی که حتی در شرایط بحرانی کار می‌کنند", color: "iran-green" },
  { icon: <ShoppingBag className="h-7 w-7" />, title: "۴ بیزینس مدل کاربردی", desc: "خدمات، محصول فیزیکی، فایل دیجیتال، دراپ‌شیپینگ", color: "iran-red" },
  { icon: <Building2 className="h-7 w-7" />, title: "زیرساخت کامل", desc: "درگاه پرداخت، اینماد، سامانه مودیان، باسلام", color: "iran-green" },
  { icon: <BarChart3 className="h-7 w-7" />, title: "مارکتینگ ایرانی", desc: "یکتانت، دیوار، پنل پیامکی + کمپین ۵ مرحله‌ای", color: "iran-red" },
  { icon: <Brain className="h-7 w-7" />, title: "هوش مصنوعی فارسی", desc: "AI ایرانی برای محتوا، فروش و تحلیل", color: "iran-green" },
];

const audience = [
  { icon: <Briefcase />, title: "صاحبان کسب‌وکار سنتی", desc: "که می‌خواهند آنلاین شوند" },
  { icon: <Smartphone />, title: "فریلنسرها و خدمات‌دهندگان", desc: "که قطعی اینترنت متوقفشان کرده" },
  { icon: <Package />, title: "فروشندگان محصول", desc: "که دنبال کانال‌های جدیدند" },
  { icon: <Rocket />, title: "افراد در ابتدای مسیر", desc: "که می‌خواهند از صفر داخل ایران شروع کنند" },
  { icon: <GraduationCap />, title: "دانشجویان و فارغ‌التحصیلان", desc: "که دنبال درآمد دلاری داخل ایران‌اند" },
  { icon: <HeartHandshake />, title: "خانم‌های خانه‌دار", desc: "که می‌خواهند از خانه کسب درآمد کنند" },
];

const includes = [
  { icon: <PlayCircle />, title: "۲۶+ اپیزود ویدیویی", desc: "محتوای کاملاً عملی و قابل اجرا" },
  { icon: <FileDigit />, title: "فایل‌ها و چک‌لیست‌های آماده", desc: "تمپلیت کمپین، آرکتایپ برند، چک‌لیست اینماد" },
  { icon: <Sparkles />, title: "پرامپت‌های AI آماده", desc: "برای محتوا، تبلیغ، تحلیل و پرسونا" },
  { icon: <InfinityIcon />, title: "دسترسی مادام‌العمر", desc: "هر زمان که خواستید مرور کنید" },
  { icon: <Headphones />, title: "پشتیبانی تخصصی", desc: "پاسخ سوالات شما توسط تیم رفیعی" },
  { icon: <Award />, title: "گواهی پایان دوره", desc: "گواهی رسمی آکادمی رفیعی" },
];

const stats = [
  { icon: Users, num: "۳۷۰K+", label: "دانشجوی آکادمی" },
  { icon: Star, num: "۴.۹", label: "میانگین رضایت" },
  { icon: Clock, num: "+۲۵", label: "اپیزود عملی" },
  { icon: Award, num: "۲", label: "مدرس متخصص" },
];

const outcomes = [
  "انتخاب یک بیزینس مدل امن و سودده مخصوص بازار ایران",
  "راه‌اندازی فروشگاه در باسلام و سایت اختصاصی",
  "دریافت اینماد و راه‌اندازی درگاه پرداخت ایرانی",
  "اجرای کمپین‌های تبلیغاتی در یکتانت و دیوار",
  "ساخت برند با آرکتایپ و تولید محتوا با AI",
  "نوشتن آگهی و صفحه محصول حرفه‌ای با فریم‌ورک FEEL",
  "کمپین فروش ۵ مرحله‌ای + قیف فروش پیامکی",
  "استفاده از هوش مصنوعی فارسی برای بیزینس",
  "پیاده‌سازی سامانه مودیان و قانونمند کردن کسب‌وکار",
  "طراحی تجربه پرداخت با قانون ۲ کلیک",
];

const faqs = [
  { q: "این دوره برای چه کسانی مناسب است؟", a: "هر کسی که می‌خواهد در شرایط فعلی ایران، یک کسب‌وکار آنلاین واقعی و سودده راه‌اندازی کند — از مبتدی کامل تا صاحب کسب‌وکار سنتی." },
  { q: "آیا به اینترنت بین‌المللی نیاز دارم؟", a: "خیر. تمام پلتفرم‌ها، ابزارها و درگاه‌های پرداختی که آموزش می‌دهیم ایرانی هستند و با اینترنت داخلی کار می‌کنند." },
  { q: "چقدر طول می‌کشد دوره را تمام کنم؟", a: "بسته به سرعت شما، بین ۳ تا ۶ هفته. ولی دسترسی شما مادام‌العمر است و هر زمان می‌توانید مرور کنید." },
  { q: "بعد از خرید چقدر زمان می‌برد دسترسی پیدا کنم؟", a: "بلافاصله پس از پرداخت، دسترسی کامل به پنل دانشجو و تمام محتوا فعال می‌شود." },
  { q: "آیا پشتیبانی دارد؟", a: "بله. تیم پشتیبانی آکادمی رفیعی به سوالات شما پاسخ می‌دهد و در صورت نیاز با مدرس ارتباط برقرار می‌کنید." },
  { q: "آیا گواهی پایان دوره می‌دهید؟", a: "بله، گواهی رسمی پایان دوره از طرف آکادمی رفیعی صادر می‌شود." },
];

const IranLanding = () => {
  const [courseId, setCourseId] = useState<string | null>(null);
  const [coursePrice, setCoursePrice] = useState<number>(18700000);
  const { isActive: isBlackFridayActive, getCourseDiscount } = useBlackFridayContext();
  const courseSlug = "iran";
  const blackFridayDiscount = courseId ? getCourseDiscount(courseId) : 0;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("courses")
          .select("id, price")
          .eq("slug", courseSlug)
          .maybeSingle();
        if (data) {
          setCourseId(data.id);
          if (data.price) setCoursePrice(Number(data.price));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const goEnroll = () => {
    window.location.href = "/enroll/?course=iran";
  };

  const formatPrice = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  const finalPrice = blackFridayDiscount > 0 ? Math.round(coursePrice * (1 - blackFridayDiscount / 100)) : coursePrice;

  return (
    <MainLayout>
      <head>
        <title>دوره جامع ایران | کسب‌وکار آنلاین در شرایط بحرانی</title>
        <meta name="description" content="دوره پرمیوم ایران: راه‌اندازی و توسعه کسب‌وکار آنلاین با پلتفرم‌های ایرانی، حتی بدون اینترنت بین‌المللی. ۲۶+ اپیزود، ۲ مدرس متخصص، دسترسی مادام‌العمر." />
      </head>

      <div className="min-h-screen bg-background" dir="rtl">
        {isBlackFridayActive && blackFridayDiscount > 0 && courseId && (
          <div className="container mx-auto px-4 pt-8">
            <CourseDiscountBanner
              discount={blackFridayDiscount}
              courseName="دوره ایران"
              originalPrice={coursePrice}
              courseSlug={courseSlug}
            />
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Iranian flag-inspired stripes background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(120_60%_35%/0.08)] via-background to-[hsl(0_75%_45%/0.08)]" />
            <div className="absolute top-0 left-0 right-0 h-2 bg-[hsl(120_60%_35%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[hsl(0_75%_45%)]" />
          </div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-[hsl(0_75%_45%/0.15)] rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-[hsl(120_60%_35%/0.15)] rounded-full blur-3xl" />

          <div className="container relative z-10 py-20 md:py-28 px-4 text-center">
            <Badge className="mb-6 px-5 py-2 text-base bg-[hsl(0_75%_45%/0.1)] text-[hsl(0_75%_40%)] border border-[hsl(0_75%_45%/0.3)] hover:bg-[hsl(0_75%_45%/0.15)]">
              <Flag className="h-4 w-4 ml-2" />
              دوره جدید پرمیوم آکادمی رفیعی
            </Badge>

            <h1 className="text-6xl md:text-8xl font-black mb-4 leading-tight">
              <span className="bg-gradient-to-l from-[hsl(120_60%_35%)] via-foreground to-[hsl(0_75%_45%)] bg-clip-text text-transparent">
                ایران
              </span>
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              کسب‌وکار آنلاین، در دل بحران
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              وقتی اینترنت بین‌المللی قطع است، وقتی همه می‌گویند نمی‌شود — ما نشان می‌دهیم چطور با پلتفرم‌های ایرانی، یک کسب‌وکار دیجیتال واقعی، پایدار و سودده بسازید.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              {["۴ فاز کامل", "۲ مدرس متخصص", "۲۶+ اپیزود عملی", "پلتفرم‌های ایرانی", "دسترسی مادام‌العمر"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-full px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(120_60%_35%)]" />
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {/* Pricing card */}
            <Card className="max-w-md mx-auto p-6 border-2 border-[hsl(0_75%_45%/0.3)] bg-card/80 backdrop-blur shadow-2xl">
              <div className="text-center space-y-4">
                <Badge className="bg-[hsl(120_60%_35%)] text-white">دوره پرمیوم</Badge>
                <div>
                  {blackFridayDiscount > 0 && (
                    <div className="text-sm text-muted-foreground line-through">
                      {formatPrice(coursePrice)} تومان
                    </div>
                  )}
                  <div className="text-4xl font-black text-foreground">
                    {formatPrice(finalPrice)} <span className="text-lg font-bold">تومان</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={goEnroll}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-l from-[hsl(0_75%_45%)] to-[hsl(120_60%_35%)] text-white hover:opacity-90 shadow-lg"
                >
                  <Rocket className="ml-2 h-5 w-5" />
                  ثبت‌نام در دوره ایران
                </Button>
                <p className="text-xs text-muted-foreground">🔒 پرداخت امن • دسترسی فوری</p>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-12">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <s.icon className="w-8 h-8 mx-auto mb-2 text-[hsl(0_75%_45%)]" />
                  <div className="text-2xl font-bold text-foreground">{s.num}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pain / Why */}
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
              {pillars.map((p, i) => {
                const colorClass = p.color === "iran-red" ? "hsl(0_75%_45%)" : "hsl(120_60%_35%)";
                return (
                  <Card
                    key={i}
                    className="p-6 bg-card border-2 hover:shadow-xl transition-all group"
                    style={{ borderColor: `hsl(var(--border))` }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${colorClass.replace(")", "/0.1)")}`, color: colorClass }}
                    >
                      {p.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                    <p className="text-muted-foreground">{p.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-6xl">
            <SectionTitle title="چی دریافت می‌کنید؟" subtitle="یک پکیج کامل برای راه‌اندازی کسب‌وکار آنلاین در ایران" isCentered />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {includes.map((it, i) => (
                <Card key={i} className="p-6 border-2 border-border hover:border-[hsl(0_75%_45%/0.4)] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(0_75%_45%/0.1)] to-[hsl(120_60%_35%/0.1)] text-[hsl(0_75%_45%)] flex items-center justify-center shrink-0">
                      {it.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{it.title}</h3>
                      <p className="text-sm text-muted-foreground">{it.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-5xl">
            <SectionTitle
              title="سرفصل کامل دوره"
              subtitle="۴ فاز پیوسته که شما را از صفر به یک کسب‌وکار سودده می‌رسانند"
              isCentered
            />

            <div className="space-y-8">
              {phases.map((phase) => (
                <div key={phase.id}>
                  <div className={`rounded-2xl bg-gradient-to-l ${phase.accent} p-6 mb-4 border-2 border-border`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center text-[hsl(0_75%_45%)] shadow-md">
                        {phase.icon}
                      </div>
                      <div>
                        <Badge className="mb-2 bg-[hsl(0_75%_45%)] text-white">{phase.badge}</Badge>
                        <h3 className="text-2xl font-bold">{phase.title}</h3>
                      </div>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-3">
                    {phase.episodes.map((ep, idx) => (
                      <AccordionItem
                        key={`${phase.id}-${idx}`}
                        value={`${phase.id}-${idx}`}
                        className="border-2 border-border rounded-xl px-4 bg-card hover:border-[hsl(120_60%_35%/0.3)] transition-colors"
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-4 text-right flex-1">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(0_75%_45%/0.1)] to-[hsl(120_60%_35%/0.1)] text-[hsl(0_75%_45%)] font-black flex items-center justify-center shrink-0 text-sm">
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
                                <CheckCircle2 className="h-4 w-4 text-[hsl(120_60%_35%)] mt-1 shrink-0" />
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
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-6xl">
            <SectionTitle title="مدرسان دوره" subtitle="۲ متخصص با تجربه که ترکیب استراتژی و اجرای ایرانی را به شما یاد می‌دهند" isCentered />
            <div className="grid md:grid-cols-2 gap-8">
              {/* Reza */}
              <Card className="overflow-hidden border-2 border-[hsl(0_75%_45%/0.2)] hover:border-[hsl(0_75%_45%/0.5)] transition-all hover:shadow-2xl group">
                <div className="relative">
                  <img
                    src="/lovable-uploads/6eccb7da-2d9d-4f23-bda8-fb9072b17465.png"
                    alt="رضا رفیعی"
                    className="w-full h-72 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: "center 20%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-[hsl(0_75%_45%)] text-white">
                    <Award className="h-3 w-3 ml-1" /> بنیان‌گذار
                  </Badge>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">رضا رفیعی</h3>
                    <p className="text-muted-foreground">بنیان‌گذار آکادمی رفیعی</p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    مربی، کارآفرین و بنیان‌گذار آکادمی رفیعی با بیش از ۳۷۰ هزار دانشجو در سراسر جهان. متخصص استراتژی، مدیریت بحران و کسب‌وکار بین‌المللی.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[hsl(0_75%_45%/0.05)] border border-[hsl(0_75%_45%/0.2)] p-3 rounded-lg text-center">
                      <div className="font-bold text-xl text-[hsl(0_75%_45%)]">+۳۷۰K</div>
                      <div className="text-xs text-muted-foreground">دانشجو</div>
                    </div>
                    <div className="bg-[hsl(0_75%_45%/0.05)] border border-[hsl(0_75%_45%/0.2)] p-3 rounded-lg text-center">
                      <div className="font-bold text-xl text-[hsl(0_75%_45%)]">۱۲+</div>
                      <div className="text-xs text-muted-foreground">سال تجربه</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Matin */}
              <Card className="overflow-hidden border-2 border-[hsl(120_60%_35%/0.2)] hover:border-[hsl(120_60%_35%/0.5)] transition-all hover:shadow-2xl group">
                <div className="relative">
                  <img
                    src="/lovable-uploads/724e94ed-8140-4749-af7a-f025b21a6d33.png"
                    alt="متین پورخالقی"
                    className="w-full h-72 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-[hsl(120_60%_35%)] text-white">
                    <Award className="h-3 w-3 ml-1" /> متخصص بازار ایران
                  </Badge>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">متین پورخالقی</h3>
                    <p className="text-muted-foreground">بنیان‌گذار آژانس دیجیتال «دیان»</p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    متخصص فروش در پلتفرم‌های ایرانی (باسلام، دیوار، یکتانت)، برندسازی، فروش فایل دیجیتال و راه‌اندازی فروشگاه اینترنتی. مشاور رشد بیش از ۵۰ برند.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[hsl(120_60%_35%/0.05)] border border-[hsl(120_60%_35%/0.2)] p-3 rounded-lg text-center">
                      <div className="font-bold text-xl text-[hsl(120_60%_35%)]">+۴۵K</div>
                      <div className="text-xs text-muted-foreground">دانش‌پذیر</div>
                    </div>
                    <div className="bg-[hsl(120_60%_35%/0.05)] border border-[hsl(120_60%_35%/0.2)] p-3 rounded-lg text-center">
                      <div className="font-bold text-xl text-[hsl(120_60%_35%)]">+۵۰</div>
                      <div className="text-xs text-muted-foreground">برند مشاوره</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Audience */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container">
            <SectionTitle title="این دوره برای چه کسانی است؟" isCentered />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {audience.map((a, i) => (
                <Card
                  key={i}
                  className="p-6 text-center bg-card border-2 border-border hover:border-[hsl(0_75%_45%/0.4)] hover:shadow-md transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(0_75%_45%/0.1)] to-[hsl(120_60%_35%/0.1)] text-[hsl(0_75%_45%)] flex items-center justify-center mx-auto mb-4">
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
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-5xl">
            <SectionTitle title="پس از این دوره چه چیزی به دست می‌آورید؟" isCentered />
            <div className="grid md:grid-cols-2 gap-4">
              {outcomes.map((o, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-card rounded-xl border-2 border-border hover:border-[hsl(120_60%_35%/0.4)] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(0_75%_45%)] to-[hsl(120_60%_35%)] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-medium pt-1">{o}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-3xl">
            <SectionTitle title="سوالات متداول" isCentered />
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-2 border-border rounded-xl px-5 bg-card"
                >
                  <AccordionTrigger className="font-bold text-right hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(120_60%_35%)] via-[hsl(0_0%_98%)] to-[hsl(0_75%_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,white,transparent_60%)] opacity-30" />
          <div className="container relative z-10 max-w-3xl text-center">
            <Lightbulb className="h-16 w-16 mx-auto mb-6 text-foreground" />
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight text-foreground">
              ایران، سرزمین فرصت‌هاست — برای کسانی که حرکت می‌کنند
            </h2>
            <p className="text-lg md:text-xl mb-8 text-foreground/80">
              منتظر «همه چی درست شدن» نباشید. همین امروز بیزینس‌تان را داخل ایران بسازید.
            </p>
            <Card className="max-w-md mx-auto p-6 bg-background/95 backdrop-blur border-2 border-foreground/20 shadow-2xl">
              <div className="space-y-4">
                {blackFridayDiscount > 0 && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatPrice(coursePrice)} تومان
                  </div>
                )}
                <div className="text-4xl font-black">
                  {formatPrice(finalPrice)} <span className="text-lg">تومان</span>
                </div>
                <Button
                  size="lg"
                  onClick={goEnroll}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-l from-[hsl(0_75%_45%)] to-[hsl(120_60%_35%)] text-white hover:opacity-90"
                >
                  <PlayCircle className="ml-2 h-5 w-5" />
                  ثبت‌نام در دوره ایران
                </Button>
                <p className="text-xs text-muted-foreground">دسترسی فوری • مادام‌العمر • گواهی پایان دوره</p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default IranLanding;
