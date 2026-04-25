import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Flag, ShieldCheck, Wifi, Brain, Briefcase, Package, Megaphone, Users,
  CheckCircle2, Sparkles, Target, Layers, Rocket, PlayCircle, Lightbulb,
  ShoppingBag, Building2, BarChart3, Smartphone, Award, Star, Clock,
  Infinity as InfinityIcon, Headphones, FileDigit, Zap, HeartHandshake,
  GraduationCap, X, Check, ArrowLeft, TrendingUp, MessageCircle,
} from "lucide-react";

// Iran flag colors (HSL)
const IRAN_GREEN = "142 71% 35%";
const IRAN_RED = "356 75% 48%";

const phases = [
  {
    id: "phase-1", badge: "فاز ۱",
    title: "درک بازار + استراتژی پایه + بیزینس مدل‌ها",
    icon: <Target className="h-5 w-5" />,
    episodes: [
      { n: "۰۱", title: "مقدمه — استارت ساخت بیزینس در ایران", teacher: "رضا رفیعی", items: ["معرفی دوره و چشم‌انداز", "چرا حالا زمان شروع است"] },
      { n: "۰۲", title: "واقعیت بازار ایران", teacher: "رضا رفیعی", items: ["هرم مازلو در شرایط بحرانی", "تفاوت بازار ایران با بازار بین‌المللی"] },
      { n: "۰۳", title: "مسیر دوره ایران", teacher: "رضا رفیعی", items: ["فاز ۱ تا ۴: درک بازار، زیرساخت، مارکتینگ، AI"] },
      { n: "۰۴", title: "انتقال تجربه از بحران", teacher: "رضا رفیعی", items: ["تورم واقعی، ناامنی شغلی", "خطرناک‌ترین نگرش: «همه چی درست میشه»", "واقعیت + حرکت = نجات"] },
      { n: "۰۵", title: "انتخاب بیزینس مدل امن در ایران", teacher: "رضا رفیعی", items: ["محصول فیزیکی", "خدمات", "فایل دیجیتال"] },
      { n: "۰۶", title: "بیزینس مدل فروش خدمات", teacher: "رضا رفیعی", items: ["ساخت پکیج درآمدی", "آربیتراژ خدمات", "خدمات هوش مصنوعی"] },
      { n: "۰۷", title: "بیزینس مدل فروش محصول فیزیکی", teacher: "رضا رفیعی", items: ["محصولات خانواده", "محصولات فیزیکی شخصی"] },
      { n: "۰۸", title: "دراپ‌شیپینگ و تأمین‌کننده", teacher: "رضا رفیعی", items: ["مزایای دراپ‌شیپینگ", "ساخت فروشگاه", "پیدا کردن نیچ پردرآمد"] },
      { n: "۰۹", title: "بیزینس مدل فروش فایل دیجیتال", teacher: "رضا رفیعی", items: ["فایل‌های پردرآمد", "پلتفرم‌های فروش", "قیمت‌گذاری منطقی"] },
      { n: "۱۰", title: "همه چیز درباره مهارت بیزینس آنلاین", teacher: "متین پورخالقی", items: ["دستاوردهای کلاس IR", "تجربه ما در بیزینس آنلاین", "این کلاس برای چه کسانی"] },
      { n: "۱۱", title: "راهنمای انتخاب مسیر و بیزینس مدل", teacher: "متین پورخالقی", items: ["۴ بیزینس مدل", "۶ سؤال کلیدی برای انتخاب مسیر", "ذهنیت سیستم‌سازی دیجیتال"] },
      { n: "۱۲", title: "بیزینس مدل فروشگاه اینترنتی", teacher: "متین پورخالقی", items: ["واسطه‌گری و فروشگاه شخصی", "استراتژی تک‌محصوله", "۳ مرحله اصلی فروش"] },
      { n: "۱۳", title: "بیزینس مدل فروش فایل دیجیتال", teacher: "متین پورخالقی", items: ["۳ نوع محصول دیجیتال", "استراتژی قرص آبی و قرمز", "پیاده‌سازی تبلیغات"] },
    ],
  },
  {
    id: "phase-2", badge: "فاز ۲",
    title: "ساخت زیرساخت + پیاده‌سازی عملی",
    icon: <Layers className="h-5 w-5" />,
    episodes: [
      { n: "۱۴", title: "معرفی سایت‌سازها و ابزارهای ایرانی", teacher: "رضا رفیعی", items: ["سایت‌های ایرانی کاربردی", "AI ایرانی", "سایت‌سازهای ایرانی"] },
      { n: "۱۵", title: "درگاه‌های پرداخت", teacher: "رضا رفیعی", items: ["زرین‌پال", "زیبال", "پی‌پینگ"] },
      { n: "۱۶", title: "مجوزها — اینماد", teacher: "رضا رفیعی", items: ["دریافت اینماد", "الزامات قانونی"] },
      { n: "۱۷", title: "برندسازی پایه", teacher: "متین پورخالقی", items: ["Positioning", "آرکتایپ برند", "ساخت نام با AI", "خرید دامنه"] },
      { n: "۱۸", title: "آموزش کامل پلتفرم باسلام", teacher: "متین پورخالقی", items: ["ساخت اکانت", "فریم‌ورک FEEL", "محصول‌نویسی با AI", "قانون ۳ ثانیه"] },
      { n: "۱۹", title: "همه چیز درباره درگاه‌های پرداخت", teacher: "متین پورخالقی", items: ["زیبال + اینماد + سامانه مودیان", "تجربه بعد از خرید", "قانون ۲ کلیک"] },
    ],
  },
  {
    id: "phase-3", badge: "فاز ۳",
    title: "مارکتینگ + جذب مشتری",
    icon: <Megaphone className="h-5 w-5" />,
    episodes: [
      { n: "۲۰", title: "مقدمه مارکتینگ + جذب مشتری", teacher: "رضا رفیعی", items: ["استراتژی‌ها", "فروش در پلتفرم‌های ایرانی"] },
      { n: "۲۱", title: "کمپین تبلیغاتی", teacher: "رضا رفیعی", items: ["هدف‌گذاری SMART", "محتوا براساس پرسونا", "تحلیل و بهبود تبلیغ"] },
      { n: "۲۲", title: "کمپین فروش ۵ مرحله‌ای", teacher: "رضا رفیعی", items: ["طراحی قیف فروش", "اجرای کمپین"] },
      { n: "۲۳", title: "آموزش پلتفرم یکتانت", teacher: "متین پورخالقی", items: ["ساخت اکانت + جریان", "تارگت‌گذاری با AI", "تحلیل کمپین با AI"] },
      { n: "۲۴", title: "آموزش پلتفرم دیوار", teacher: "متین پورخالقی", items: ["پنل پنجره", "قالب عنوان‌نویسی", "محتوای آگهی + پرامپت AI"] },
      { n: "۲۵", title: "آموزش پنل‌های پیامکی", teacher: "متین پورخالقی", items: ["انتخاب پنل", "پیامک تبدیل‌محور", "ست‌آپ کمپین"] },
    ],
  },
  {
    id: "phase-4", badge: "فاز ۴",
    title: "هوش مصنوعی فارسی برای بیزینس",
    icon: <Brain className="h-5 w-5" />,
    episodes: [
      { n: "۲۶", title: "ابزارهای AI ایرانی برای بیزینس", teacher: "تیم رفیعی", items: ["اتوماسیون فروش", "تولید محتوای فارسی", "چت‌بات فارسی پشتیبانی"] },
    ],
  },
];

const pillars = [
  { icon: <Flag className="h-6 w-6" />, title: "مخصوص بازار ایران", desc: "همه چیز با پلتفرم‌های ایرانی، بدون نیاز به اینترنت بین‌المللی" },
  { icon: <Wifi className="h-6 w-6" />, title: "مقاوم در برابر قطعی", desc: "استراتژی‌هایی که حتی در شرایط بحرانی کار می‌کنند" },
  { icon: <ShoppingBag className="h-6 w-6" />, title: "۴ بیزینس مدل کاربردی", desc: "خدمات، محصول فیزیکی، فایل دیجیتال، دراپ‌شیپینگ" },
  { icon: <Building2 className="h-6 w-6" />, title: "زیرساخت کامل", desc: "درگاه پرداخت، اینماد، سامانه مودیان، باسلام" },
  { icon: <BarChart3 className="h-6 w-6" />, title: "مارکتینگ ایرانی", desc: "یکتانت، دیوار، پنل پیامکی + کمپین ۵ مرحله‌ای" },
  { icon: <Brain className="h-6 w-6" />, title: "هوش مصنوعی فارسی", desc: "AI ایرانی برای محتوا، فروش و تحلیل" },
];

const audience = [
  { icon: <Briefcase />, title: "صاحبان کسب‌وکار سنتی", desc: "که می‌خواهند آنلاین شوند" },
  { icon: <Smartphone />, title: "فریلنسرها و خدمات‌دهندگان", desc: "که قطعی اینترنت متوقفشان کرده" },
  { icon: <Package />, title: "فروشندگان محصول", desc: "که دنبال کانال‌های جدیدند" },
  { icon: <Rocket />, title: "افراد ابتدای مسیر", desc: "که می‌خواهند از صفر داخل ایران شروع کنند" },
  { icon: <GraduationCap />, title: "دانشجویان و فارغ‌التحصیلان", desc: "که دنبال درآمد داخلی پایدارند" },
  { icon: <HeartHandshake />, title: "خانم‌های خانه‌دار", desc: "که می‌خواهند از خانه کسب درآمد کنند" },
];

const includes = [
  { icon: <PlayCircle />, title: "۲۶+ اپیزود ویدیویی", desc: "محتوای کاملاً عملی و قابل اجرا", value: "۸,۰۰۰,۰۰۰" },
  { icon: <FileDigit />, title: "فایل‌ها و چک‌لیست‌های آماده", desc: "تمپلیت کمپین، آرکتایپ برند، چک‌لیست اینماد", value: "۲,۵۰۰,۰۰۰" },
  { icon: <Sparkles />, title: "پرامپت‌های AI آماده", desc: "برای محتوا، تبلیغ، تحلیل و پرسونا", value: "۳,۰۰۰,۰۰۰" },
  { icon: <InfinityIcon />, title: "دسترسی مادام‌العمر", desc: "هر زمان که خواستید مرور کنید", value: "بی‌قیمت" },
  { icon: <Headphones />, title: "پشتیبانی تخصصی", desc: "پاسخ سوالات شما توسط تیم رفیعی", value: "۲,۰۰۰,۰۰۰" },
  { icon: <Award />, title: "گواهی پایان دوره", desc: "گواهی رسمی آکادمی رفیعی", value: "رایگان" },
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
  "نوشتن آگهی و صفحه محصول با فریم‌ورک FEEL",
  "کمپین فروش ۵ مرحله‌ای + قیف فروش پیامکی",
  "استفاده از هوش مصنوعی فارسی برای بیزینس",
  "پیاده‌سازی سامانه مودیان و قانونمند کردن کسب‌وکار",
  "طراحی تجربه پرداخت با قانون ۲ کلیک",
];

const compareWith = [
  { f: "متمرکز بر بازار ایران", us: true, others: false },
  { f: "آموزش پلتفرم‌های ایرانی (باسلام، یکتانت، دیوار)", us: true, others: false },
  { f: "بدون نیاز به اینترنت بین‌المللی", us: true, others: false },
  { f: "آموزش درگاه‌های پرداخت ایرانی", us: true, others: false },
  { f: "AI فارسی و پرامپت‌های آماده", us: true, others: false },
  { f: "آموزش اینماد و سامانه مودیان", us: true, others: false },
  { f: "۲ مدرس با تجربه عملی", us: true, others: "گاهی" },
  { f: "دسترسی مادام‌العمر", us: true, others: "گاهی" },
];

const testimonials = [
  { name: "علی محمدی", role: "صاحب فروشگاه دیجیتال", text: "بعد از ۲ هفته از شروع دوره، اولین فروشم در باسلام رو ثبت کردم. روش‌های مارکتینگ ایرانی واقعاً کار می‌کنه." },
  { name: "سارا کریمی", role: "فریلنسر طراحی", text: "وقتی اینترنت بین‌المللی قطع شد، فکر کردم کارم تمومه. این دوره نشون داد چطور با پلتفرم‌های ایرانی هم میشه درآمد عالی داشت." },
  { name: "محمد رضایی", role: "کارآفرین تازه‌کار", text: "از صفر شروع کردم. الان فروشگاه آنلاین خودم رو دارم با درگاه زیبال و اینماد. قدم به قدم همه چیز توضیح داده شده." },
];

const faqs = [
  { q: "این دوره برای چه کسانی مناسب است؟", a: "هر کسی که می‌خواهد در شرایط فعلی ایران، یک کسب‌وکار آنلاین واقعی و سودده راه‌اندازی کند — از مبتدی کامل تا صاحب کسب‌وکار سنتی." },
  { q: "آیا به اینترنت بین‌المللی نیاز دارم؟", a: "خیر. تمام پلتفرم‌ها، ابزارها و درگاه‌های پرداختی که آموزش می‌دهیم ایرانی هستند و با اینترنت داخلی کار می‌کنند." },
  { q: "چقدر طول می‌کشد دوره را تمام کنم؟", a: "بسته به سرعت شما، بین ۳ تا ۶ هفته. ولی دسترسی شما مادام‌العمر است و هر زمان می‌توانید مرور کنید." },
  { q: "بعد از خرید چقدر زمان می‌برد دسترسی پیدا کنم؟", a: "بلافاصله پس از پرداخت، دسترسی کامل به پنل دانشجو و تمام محتوا فعال می‌شود." },
  { q: "آیا پشتیبانی دارد؟", a: "بله. تیم پشتیبانی آکادمی رفیعی به سوالات شما پاسخ می‌دهد و در صورت نیاز با مدرس ارتباط برقرار می‌کنید." },
  { q: "آیا گواهی پایان دوره می‌دهید؟", a: "بله، گواهی رسمی پایان دوره از طرف آکادمی رفیعی صادر می‌شود." },
  { q: "اگر نتیجه نگرفتم چه؟", a: "ما به محتوای دوره مطمئنیم. در صورت اجرای کامل آموزش‌ها و عدم رضایت، در ۷ روز اول قابل بررسی است." },
];

// Wave divider
const Wave = ({ flip = false, color = "muted" }: { flip?: boolean; color?: string }) => (
  <div className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""}`}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-12 md:h-20">
      <path
        d="M0,32 C240,80 480,0 720,32 C960,64 1200,16 1440,48 L1440,80 L0,80 Z"
        className={`fill-${color}`}
      />
    </svg>
  </div>
);

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
          .from("courses").select("id, price").eq("slug", courseSlug).maybeSingle();
        if (data) {
          setCourseId(data.id);
          if (data.price) setCoursePrice(Number(data.price));
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  const goEnroll = () => { window.location.href = "/enroll/?course=iran"; };
  const formatPrice = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  const finalPrice = blackFridayDiscount > 0 ? Math.round(coursePrice * (1 - blackFridayDiscount / 100)) : coursePrice;
  const totalValue = 18000000;

  return (
    <MainLayout>
      <head>
        <title>دوره جامع ایران | کسب‌وکار آنلاین در شرایط بحرانی</title>
        <meta name="description" content="دوره پرمیوم ایران: راه‌اندازی و توسعه کسب‌وکار آنلاین با پلتفرم‌های ایرانی، حتی بدون اینترنت بین‌المللی. ۲۶+ اپیزود، ۲ مدرس متخصص، دسترسی مادام‌العمر." />
      </head>

      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        {isBlackFridayActive && blackFridayDiscount > 0 && courseId && (
          <div className="container mx-auto px-4 pt-6">
            <CourseDiscountBanner
              discount={blackFridayDiscount} courseName="دوره ایران"
              originalPrice={coursePrice} courseSlug={courseSlug}
            />
          </div>
        )}

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden bg-background">
          {/* soft Iran-color glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-40"
              style={{ background: `radial-gradient(circle, hsl(${IRAN_GREEN} / 0.18), transparent 70%)` }} />
            <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-40"
              style={{ background: `radial-gradient(circle, hsl(${IRAN_RED} / 0.18), transparent 70%)` }} />
          </div>

          <div className="relative z-10 container mx-auto px-5 pt-16 pb-24 md:pt-24 md:pb-28">
            <div className="max-w-3xl mx-auto text-center space-y-7">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 backdrop-blur-sm border rounded-full px-5 py-2"
                style={{ borderColor: `hsl(${IRAN_RED} / 0.25)`, background: `hsl(${IRAN_RED} / 0.05)` }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: `hsl(${IRAN_GREEN})` }} />
                <span className="text-sm font-medium" style={{ color: `hsl(${IRAN_RED})` }}>دوره پرمیوم آکادمی رفیعی</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(var(--foreground)) 50%, hsl(${IRAN_RED}))` }}>
                  ایران
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl md:text-3xl font-bold">
                کسب‌وکار آنلاین، در دل بحران
              </motion.p>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                وقتی اینترنت بین‌المللی قطع است، وقتی همه می‌گویند نمی‌شود — ما نشان می‌دهیم چطور با پلتفرم‌های ایرانی، یک کسب‌وکار دیجیتال واقعی، پایدار و سودده بسازید.
              </motion.p>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["۴ فاز کامل", "۲۶+ اپیزود", "۲ مدرس متخصص", "دسترسی مادام‌العمر"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" style={{ color: `hsl(${IRAN_GREEN})` }} />
                    <span>{t}</span>
                  </div>
                ))}
              </motion.div>

              {/* Pricing card – Rafiei style: thin gradient strip */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="max-w-md mx-auto pt-4">
                <Card className="border shadow-sm overflow-hidden">
                  <div className="h-1" style={{ background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }} />
                  <CardContent className="p-6 md:p-8 text-center space-y-5">
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">سرمایه‌گذاری روی خودت</p>
                      {blackFridayDiscount > 0 && (
                        <p className="text-sm text-muted-foreground line-through mb-1">{formatPrice(coursePrice)} تومان</p>
                      )}
                      <p className="text-4xl font-bold tracking-tight">
                        {formatPrice(finalPrice)}
                        <span className="text-base text-muted-foreground mr-2 font-normal">تومان</span>
                      </p>
                    </div>
                    <Button onClick={goEnroll} className="w-full h-12 rounded-xl text-base font-bold gap-2">
                      <Rocket size={17} />
                      ثبت‌نام در دوره ایران
                      <ArrowLeft size={15} />
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <ShieldCheck size={13} />
                      پرداخت امن • دسترسی فوری • گواهی پایان دوره
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-6">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <s.icon className="w-6 h-6 mx-auto mb-1.5" style={{ color: `hsl(${IRAN_RED})` }} />
                    <div className="text-xl font-bold">{s.num}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Wave color="muted/30" />
        </section>

        {/* ─── PAIN ─── */}
        <section className="bg-muted/30 py-16 md:py-20 px-5">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className="mb-4 border-destructive/30 text-destructive">واقعیت تلخ امروز</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">اینترنت بین‌المللی قطعه. حالا چی؟</h2>
              <p className="text-muted-foreground leading-relaxed">
                خیلی‌ها فلج شدند. ولی بازار ایران، هنوز میلیون‌ها مشتری دارد که منتظر محصول و خدمت شما هستند — فقط باید بدانید کجا و چطور.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pillars.map((p, i) => (
                <Card key={i} className="border hover:shadow-md transition-all group overflow-hidden">
                  <div className="h-0.5" style={{ background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }} />
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                      style={{ background: `hsl(${i % 2 === 0 ? IRAN_RED : IRAN_GREEN} / 0.08)`, color: `hsl(${i % 2 === 0 ? IRAN_RED : IRAN_GREEN})` }}>
                      {p.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-1.5">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <Wave flip color="muted/30" />

        {/* ─── WHAT YOU GET ─── */}
        <section className="py-16 md:py-20 px-5 bg-background">
          <div className="container mx-auto max-w-6xl">
            <SectionTitle title="چی دریافت می‌کنید؟" subtitle="یک پکیج کامل برای راه‌اندازی کسب‌وکار آنلاین در ایران" isCentered />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {includes.map((it, i) => (
                <Card key={i} className="border hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
                        style={{ background: `hsl(${IRAN_GREEN} / 0.08)`, color: `hsl(${IRAN_GREEN})` }}>
                        {it.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold">{it.title}</h3>
                          <Badge variant="secondary" className="text-xs shrink-0">{it.value}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{it.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Value stack */}
            <Card className="mt-8 border-2 max-w-2xl mx-auto overflow-hidden"
              style={{ borderColor: `hsl(${IRAN_GREEN} / 0.3)` }}>
              <div className="h-1" style={{ background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }} />
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">ارزش کل پکیج</p>
                <p className="text-2xl font-bold line-through text-muted-foreground">{formatPrice(totalValue)} تومان</p>
                <div className="flex items-center justify-center gap-2 text-sm" style={{ color: `hsl(${IRAN_RED})` }}>
                  <TrendingUp size={16} />
                  <span>قیمت ویژه شما:</span>
                </div>
                <p className="text-4xl font-black">{formatPrice(finalPrice)} <span className="text-base font-normal">تومان</span></p>
                <Button onClick={goEnroll} size="lg" className="w-full md:w-auto h-12 px-8 rounded-xl font-bold gap-2">
                  <Rocket size={17} /> الان ثبت‌نام می‌کنم
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <Wave color="muted/30" />
        {/* ─── CURRICULUM ─── */}
        <section className="bg-muted/30 py-16 md:py-20 px-5">
          <div className="container mx-auto max-w-5xl">
            <SectionTitle title="سرفصل کامل دوره" subtitle="۴ فاز پیوسته که شما را از صفر به یک کسب‌وکار سودده می‌رسانند" isCentered />
            <div className="space-y-10 mt-10">
              {phases.map((phase) => (
                <div key={phase.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `hsl(${IRAN_RED} / 0.08)`, color: `hsl(${IRAN_RED})` }}>
                      {phase.icon}
                    </div>
                    <div>
                      <Badge className="mb-1" style={{ background: `hsl(${IRAN_RED})`, color: "white" }}>{phase.badge}</Badge>
                      <h3 className="text-xl md:text-2xl font-bold">{phase.title}</h3>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    {phase.episodes.map((ep, idx) => (
                      <AccordionItem key={`${phase.id}-${idx}`} value={`${phase.id}-${idx}`}
                        className="border rounded-xl px-4 bg-background">
                        <AccordionTrigger className="hover:no-underline py-3.5">
                          <div className="flex items-center gap-3 text-right flex-1">
                            <div className="w-9 h-9 rounded-lg font-bold flex items-center justify-center shrink-0 text-sm"
                              style={{ background: `hsl(${IRAN_GREEN} / 0.08)`, color: `hsl(${IRAN_GREEN})` }}>
                              {ep.n}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm md:text-base">{ep.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">مدرس: {ep.teacher}</div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1.5 pr-12 pb-2">
                            {ep.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: `hsl(${IRAN_GREEN})` }} />
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
        <Wave flip color="muted/30" />

        {/* ─── INSTRUCTORS ─── */}
        <section className="py-16 md:py-20 px-5 bg-background">
          <div className="container mx-auto max-w-6xl">
            <SectionTitle title="مدرسان دوره" subtitle="۲ متخصص با تجربه که ترکیب استراتژی و اجرای ایرانی را به شما یاد می‌دهند" isCentered />
            <div className="grid md:grid-cols-2 gap-6 mt-10">
              {/* Reza */}
              <Card className="overflow-hidden border hover:shadow-lg transition-all">
                <div className="h-1" style={{ background: `hsl(${IRAN_RED})` }} />
                <div className="p-6 flex flex-col sm:flex-row gap-5">
                  <div className="relative shrink-0 mx-auto sm:mx-0">
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                      style={{ background: `hsl(${IRAN_RED})` }} />
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2"
                      style={{ borderColor: `hsl(${IRAN_RED} / 0.2)` }}>
                      <img src="/lovable-uploads/6eccb7da-2d9d-4f23-bda8-fb9072b17465.png" alt="رضا رفیعی"
                        className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 text-center sm:text-right">
                    <div>
                      <h3 className="text-xl font-bold">رضا رفیعی</h3>
                      <p className="text-sm text-muted-foreground">بنیان‌گذار آکادمی رفیعی</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      مربی، کارآفرین و بنیان‌گذار آکادمی رفیعی با بیش از ۳۷۰ هزار دانشجو. متخصص استراتژی، مدیریت بحران و کسب‌وکار بین‌المللی.
                    </p>
                    <div className="flex gap-3 justify-center sm:justify-start text-xs">
                      <div><span className="font-bold" style={{ color: `hsl(${IRAN_RED})` }}>+۳۷۰K</span> دانشجو</div>
                      <div><span className="font-bold" style={{ color: `hsl(${IRAN_RED})` }}>۱۲+</span> سال تجربه</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Matin */}
              <Card className="overflow-hidden border hover:shadow-lg transition-all">
                <div className="h-1" style={{ background: `hsl(${IRAN_GREEN})` }} />
                <div className="p-6 flex flex-col sm:flex-row gap-5">
                  <div className="relative shrink-0 mx-auto sm:mx-0">
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                      style={{ background: `hsl(${IRAN_GREEN})` }} />
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2"
                      style={{ borderColor: `hsl(${IRAN_GREEN} / 0.2)` }}>
                      <img src="/lovable-uploads/724e94ed-8140-4749-af7a-f025b21a6d33.png" alt="متین پورخالقی"
                        className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 text-center sm:text-right">
                    <div>
                      <h3 className="text-xl font-bold">متین پورخالقی</h3>
                      <p className="text-sm text-muted-foreground">بنیان‌گذار آژانس دیجیتال «دیان»</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      متخصص فروش در پلتفرم‌های ایرانی (باسلام، دیوار، یکتانت)، برندسازی و فروش فایل دیجیتال. مشاور رشد بیش از ۵۰ برند.
                    </p>
                    <div className="flex gap-3 justify-center sm:justify-start text-xs">
                      <div><span className="font-bold" style={{ color: `hsl(${IRAN_GREEN})` }}>+۴۵K</span> دانش‌پذیر</div>
                      <div><span className="font-bold" style={{ color: `hsl(${IRAN_GREEN})` }}>+۵۰</span> برند مشاوره</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <Wave color="muted/30" />
        {/* ─── COMPARISON ─── */}
        <section className="bg-muted/30 py-16 md:py-20 px-5">
          <div className="container mx-auto max-w-3xl">
            <SectionTitle title="چرا دوره ایران؟" subtitle="مقایسه با دوره‌های عمومی کسب‌وکار آنلاین" isCentered />
            <Card className="mt-10 overflow-hidden border">
              <div className="h-1" style={{ background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }} />
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 p-6">
                <div className="font-bold text-sm pb-3 border-b">ویژگی</div>
                <div className="font-bold text-sm pb-3 border-b text-center px-3" style={{ color: `hsl(${IRAN_RED})` }}>دوره ایران</div>
                <div className="font-bold text-sm pb-3 border-b text-center px-3 text-muted-foreground">دیگران</div>
                {compareWith.map((c, i) => (
                  <React.Fragment key={i}>
                    <div className="text-sm py-3 border-b border-border/50">{c.f}</div>
                    <div className="py-3 border-b border-border/50 text-center px-3">
                      {c.us === true ? <Check className="h-5 w-5 mx-auto" style={{ color: `hsl(${IRAN_GREEN})` }} /> : <span className="text-xs">{c.us}</span>}
                    </div>
                    <div className="py-3 border-b border-border/50 text-center px-3">
                      {c.others === false ? <X className="h-5 w-5 mx-auto text-muted-foreground/50" /> : <span className="text-xs text-muted-foreground">{c.others}</span>}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </Card>
          </div>
        </section>
        <Wave flip color="muted/30" />

        {/* ─── TESTIMONIALS ─── */}
        <section className="py-16 md:py-20 px-5 bg-background">
          <div className="container mx-auto max-w-6xl">
            <SectionTitle title="نظرات دانشجویان" subtitle="نتایج واقعی از افرادی که این مسیر را شروع کرده‌اند" isCentered />
            <div className="grid md:grid-cols-3 gap-5 mt-10">
              {testimonials.map((t, i) => (
                <Card key={i} className="border overflow-hidden">
                  <div className="h-0.5" style={{ background: i % 2 === 0 ? `hsl(${IRAN_GREEN})` : `hsl(${IRAN_RED})` }} />
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" style={{ color: `hsl(${IRAN_RED})` }} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">«{t.text}»</p>
                    <div className="flex items-center gap-3 pt-3 border-t">
                      <div className="w-10 h-10 rounded-full font-bold flex items-center justify-center"
                        style={{ background: `hsl(${i % 2 === 0 ? IRAN_GREEN : IRAN_RED} / 0.1)`, color: `hsl(${i % 2 === 0 ? IRAN_GREEN : IRAN_RED})` }}>
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Wave color="muted/30" />
        {/* ─── AUDIENCE ─── */}
        <section className="bg-muted/30 py-16 md:py-20 px-5">
          <div className="container mx-auto max-w-6xl">
            <SectionTitle title="این دوره برای چه کسانی است؟" isCentered />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {audience.map((a, i) => (
                <Card key={i} className="border hover:shadow-md transition-all p-5 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: `hsl(${i % 2 === 0 ? IRAN_RED : IRAN_GREEN} / 0.08)`, color: `hsl(${i % 2 === 0 ? IRAN_RED : IRAN_GREEN})` }}>
                    {a.icon}
                  </div>
                  <h3 className="font-bold mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <Wave flip color="muted/30" />

        {/* ─── OUTCOMES ─── */}
        <section className="py-16 md:py-20 px-5 bg-background">
          <div className="container mx-auto max-w-5xl">
            <SectionTitle title="پس از این دوره چه چیزی به دست می‌آورید؟" isCentered />
            <div className="grid md:grid-cols-2 gap-3 mt-10">
              {outcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-card rounded-xl border hover:border-foreground/20 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `hsl(${IRAN_GREEN} / 0.1)`, color: `hsl(${IRAN_GREEN})` }}>
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium pt-0.5">{o}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Wave color="muted/30" />
        {/* ─── GUARANTEE ─── */}
        <section className="bg-muted/30 py-16 md:py-20 px-5">
          <div className="container mx-auto max-w-3xl">
            <Card className="border-2 overflow-hidden" style={{ borderColor: `hsl(${IRAN_GREEN} / 0.3)` }}>
              <div className="h-1" style={{ background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }} />
              <CardContent className="p-8 md:p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: `hsl(${IRAN_GREEN} / 0.1)`, color: `hsl(${IRAN_GREEN})` }}>
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">ضمانت رضایت ۷ روزه</h2>
                <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  ما به محتوای دوره اطمینان داریم. اگر در ۷ روز اول، با اجرای کامل آموزش‌ها از کیفیت دوره راضی نبودید، درخواست شما بررسی می‌شود.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        <Wave flip color="muted/30" />

        {/* ─── FAQ ─── */}
        <section className="py-16 md:py-20 px-5 bg-background">
          <div className="container mx-auto max-w-3xl">
            <SectionTitle title="سوالات متداول" isCentered />
            <Accordion type="single" collapsible className="space-y-2 mt-10">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-5 bg-card">
                  <AccordionTrigger className="font-semibold text-right hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="relative py-20 px-5 overflow-hidden bg-background">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-30"
              style={{ background: `hsl(${IRAN_GREEN})` }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-30"
              style={{ background: `hsl(${IRAN_RED})` }} />
          </div>
          <div className="relative z-10 container mx-auto max-w-2xl text-center">
            <Lightbulb className="h-12 w-12 mx-auto mb-5" style={{ color: `hsl(${IRAN_RED})` }} />
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
              ایران، سرزمین فرصت‌هاست
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              منتظر «همه چی درست شدن» نباشید. همین امروز بیزینس‌تان را داخل ایران بسازید.
            </p>
            <Card className="max-w-md mx-auto overflow-hidden border shadow-lg">
              <div className="h-1" style={{ background: `linear-gradient(90deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }} />
              <CardContent className="p-6 space-y-4">
                {blackFridayDiscount > 0 && (
                  <div className="text-sm text-muted-foreground line-through">{formatPrice(coursePrice)} تومان</div>
                )}
                <div className="text-3xl font-black">{formatPrice(finalPrice)} <span className="text-base font-normal">تومان</span></div>
                <Button onClick={goEnroll} size="lg" className="w-full h-12 rounded-xl text-base font-bold gap-2">
                  <PlayCircle size={18} />
                  ثبت‌نام در دوره ایران
                  <ArrowLeft size={15} />
                </Button>
                <p className="text-xs text-muted-foreground">دسترسی فوری • مادام‌العمر • گواهی پایان دوره</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sticky mobile CTA */}
        <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/95 backdrop-blur border-t p-3">
          <Button onClick={goEnroll} className="w-full h-12 rounded-xl font-bold gap-2">
            <Rocket size={16} />
            ثبت‌نام در دوره ایران — {formatPrice(finalPrice)} ت
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default IranLanding;
