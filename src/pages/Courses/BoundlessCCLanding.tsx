import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/Layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import QuickEnrollPopover from "@/components/Course/QuickEnrollPopover";
import {
  PlayCircle, Flame, ShieldCheck, Clock, Users, CheckCircle2, Check, X,
  Sparkles, MessageCircle, ArrowLeft, Layers,
  Infinity as InfinityIcon, Gift, AlertTriangle,
  DollarSign, Heart, Hourglass, Ban, Globe, Timer, TrendingDown, Zap,
} from "lucide-react";
import EnhancedCountdownTimer from "@/components/EnhancedCountdownTimer";
import ArvanPlayer from "@/components/ArvanPlayer";

const HERO_VIDEO = "https://rafiei.arvanvod.ir/d7maAb4xV6/eQqGzlNBWk/origin_config.json";
const FEATURED_TESTIMONIAL = "https://rafiei.arvanvod.ir/d7maAb4xV6/9YrZ9oOaPJ/origin_config.json";
const TESTIMONIAL_VIDEOS = [
  "https://rafiei.arvanvod.ir/d7maAb4xV6/v6xBdLB5QM/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/KVgAgy238p/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/L3VxZeMnjZ/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/mQGK8WJajz/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/6n42Ey2Pd5/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/5gwDQmD2O9/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/gZ1MWVL6z0/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/kyWoDrnQwL/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/oPeQA43Gbm/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/QMXOKeDRgN/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/bWXwrXvxJG/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/nKOXWgXW43/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/aXm9y4ZJg2/origin_config.json",
  "https://rafiei.arvanvod.ir/d7maAb4xV6/jGzbwL3gvR/origin_config.json",
];
import { TetherlandService } from "@/lib/tetherlandService";

const BRAND = "212 90% 45%";
const ACCENT = "32 95% 50%";

/* ───────── DATA ───────── */

const transformations = [
  { name: "آرش محمدی", role: "فریلنسر، تورنتو", text: "بعد از مهاجرت، چند ماه گیج بودم که چطور درآمد دلاری بسازم. با مسیر دوره، اول یک پروفایل تمیز روی Upwork ساختم و الان حدود ۳ تا ۴ هزار دلار در ماه از پروژه‌های ثابت می‌گیرم.", badge: "درآمد دلاری" },
  { name: "نیلوفر کریمی", role: "صاحب برند پوشاک، دبی", text: "از یک پیج اینستاگرام کوچک شروع کردم. الان فروشگاه Shopify دارم و به ۸ کشور ارسال می‌کنم. مهم‌ترین چیزی که یاد گرفتم این بود که برند جهانی فقط ترجمه نیست.", badge: "فروش بین‌المللی" },
  { name: "رضا شفیعی", role: "کارآفرین، استانبول", text: "قبلش فکر می‌کردم بازار جهانی فقط مال آدم‌های خیلی خاصه. این دوره ذهنیتم رو شکست. الان دو تا کلاینت اروپایی ثابت دارم.", badge: "تحول ذهنی" },
  { name: "مریم توکلی", role: "دیجیتال نومد، بالی", text: "از یه کارمند معمولی توی تهران تبدیل شدم به فریلنسری که با ۵ کشور کار می‌کنه. سخت‌ترین قسمتش شروع بود، نه ادامه دادن.", badge: "زندگی نومد" },
  { name: "سعید نیکزاد", role: "صاحب آژانس، برلین", text: "آژانس مارکتینگ کوچیکی راه انداختم با تیم ریموت. اولین کلاینت آلمانی‌ام رو با همون تمپلیت پروپوزال دوره گرفتم.", badge: "آژانس بین‌المللی" },
  { name: "لیلا جعفری", role: "محصول دیجیتال، لندن", text: "یه دوره کوچیک طراحی روی Gumroad گذاشتم. ماه اول ۲۰۰ دلار شد، الان بعد از یک سال درآمد پسیو ماهانه‌م حدود ۱۵۰۰ دلاره.", badge: "درآمد پسیو" },
  { name: "محمد رضایی", role: "برنامه‌نویس فریلنس، تهران", text: "بدون مهاجرت و فقط از داخل ایران، تونستم با کلاینت‌های آمریکایی کار کنم. مشکل اصلی‌م دریافت پول بود که توی دوره راه‌حلش رو پیدا کردم.", badge: "کار از ایران" },
  { name: "زهرا احمدی", role: "مترجم و کپی‌رایتر، مشهد", text: "همیشه فکر می‌کردم برای ورود به بازار جهانی باید انگلیسی فوق‌العاده داشته باشم. الان فهمیدم مهارت و پرزنت درست مهم‌تره. ماهانه حدود ۸۰۰ دلار درآمد دارم.", badge: "از داخل ایران" },
  { name: "علی موسوی", role: "صادرکننده محصول، اصفهان", text: "محصول صنایع دستی خانوادگی‌مون رو با Etsy و Shopify بردم بازار جهانی. اولش فقط ماهی ۳-۴ سفارش بود، الان هفته‌ای ۱۰ تا.", badge: "صادرات دیجیتال" },
];

const scenarios = [
  "دلتان می‌خواهد درآمد دلاری/یورویی پایدار داشته باشید.",
  "می‌خواهید مهاجرت کنید ولی نمی‌دانید چطور درآمد بین‌المللی بسازید.",
  "از وابستگی به اقتصاد ریالی و تورم خسته شده‌اید.",
  "ایده دارید ولی نمی‌دانید کدام بیزینس مدل برای بازار جهانی مناسب است.",
  "بلد نیستید روی پلتفرم‌های جهانی (Upwork، Shopify، Stripe) فعال شوید.",
  "می‌خواهید برند شخصی بین‌المللی بسازید ولی مسیر مشخصی ندارید.",
];

const benefits = [
  "یک بیزینس مدل بین‌المللی متناسب با مهارت‌های خودتان انتخاب می‌کنید.",
  "اکانت Upwork، Fiverr و LinkedIn حرفه‌ای می‌سازید.",
  "درگاه پرداخت بین‌المللی (Stripe / Wise / Payoneer) راه می‌اندازید.",
  "فروشگاه Shopify یا سایت خدماتی راه‌اندازی می‌کنید.",
  "از AI برای محتوا، فروش و اتوماسیون استفاده می‌کنید.",
  "درآمد ارزی پایدار و مقاوم به تورم می‌سازید.",
];

const costs = [
  { icon: DollarSign, color: ACCENT, title: "هزینه مالی", items: [
    "از دست دادن فرصت‌های دلاری بازار جهانی",
    "وابستگی به درآمد ریالی و تورم",
    "هدر دادن مهارت‌ها در بازار محدود داخلی",
    "نداشتن سرمایه ارزی برای آینده",
  ]},
  { icon: Heart, color: ACCENT, title: "هزینه عاطفی", items: [
    "احساس محدود بودن در یک جغرافیا",
    "ناامیدی از شرایط اقتصادی",
    "استرس مداوم برای آینده مالی",
    "نداشتن مسیر روشن برای رشد جهانی",
  ]},
  { icon: Hourglass, color: BRAND, title: "هزینه زمانی", items: [
    "ماه‌ها صرف یادگیری بدون نتیجه",
    "آزمون و خطا روی پلتفرم‌های اشتباه",
    "تأخیر در ساخت پورتفولیو بین‌المللی",
    "از دست دادن سال‌های طلایی کاری",
  ]},
  { icon: Ban, color: BRAND, title: "هزینه فرصت", items: [
    "از دست دادن مشتریان جهانی پولساز",
    "محرومیت از پلتفرم‌های پرترافیک خارجی",
    "نداشتن برند شخصی بین‌المللی",
    "عقب ماندن از موج جدید کار از راه دور",
  ]},
];

const compareRows = [
  { f: "تمرکز بر بازار جهانی و درآمد ارزی", us: true, others: false },
  { f: "آموزش پلتفرم‌های بین‌المللی (Upwork, Shopify, Stripe)", us: true, others: false },
  { f: "راه‌اندازی درگاه پرداخت ارزی برای ایرانیان", us: true, others: false },
  { f: "ساخت برند شخصی جهانی", us: true, others: false },
  { f: "AI و اتوماسیون فروش بین‌المللی", us: true, others: false },
  { f: "چند مدرس با تجربه واقعی بازار جهانی", us: true, others: "گاهی" },
  { f: "دسترسی مادام‌العمر و آپدیت رایگان", us: true, others: "گاهی" },
  { f: "گارانتی بازگشت وجه", us: true, others: false },
];

const forYou = [
  "می‌خواهید یک کسب‌وکار آنلاین بین‌المللی واقعی راه بیندازید.",
  "قصد مهاجرت دارید و می‌خواهید قبل از آن درآمد ارزی بسازید.",
  "دنبال درآمد دلاری/یورویی پایدار و مقاوم به تورم هستید.",
  "می‌خواهید برند شخصی بین‌المللی داشته باشید.",
  "می‌خواهید از AI برای رشد بیزینس جهانی استفاده کنید.",
  "حاضرید قدم به قدم اجرا کنید — نه فقط تماشا.",
];

const techniques = [
  { en: "Global Mindset", fa: "ذهنیت جهانی", desc: "تفکر بدون مرز و حذف باورهای محدودکننده." },
  { en: "Skill Stacking", fa: "چیدن مهارت‌ها", desc: "ترکیب مهارت‌ها برای ساخت پروپوزیشن منحصربه‌فرد." },
  { en: "Freelancing", fa: "فریلنسینگ بین‌المللی", desc: "Upwork، Fiverr، Toptal و LinkedIn." },
  { en: "E-commerce", fa: "تجارت الکترونیک جهانی", desc: "Shopify، Etsy و Amazon FBA." },
  { en: "Digital Products", fa: "محصولات دیجیتال", desc: "فروش روی Gumroad، Lemon Squeezy و Podia." },
  { en: "Service Agency", fa: "آژانس خدماتی", desc: "ساخت آژانس از راه دور با مشتری‌های جهانی." },
  { en: "Payment Gateway", fa: "درگاه پرداخت ارزی", desc: "Stripe، Wise، Payoneer و راه‌حل‌های ایرانیان." },
  { en: "Personal Brand", fa: "برند شخصی جهانی", desc: "LinkedIn، X و یوتیوب برای رشد بین‌المللی." },
  { en: "Global Marketing", fa: "مارکتینگ بین‌المللی", desc: "گوگل ادز، متا ادز و کمپین‌های جهانی." },
  { en: "Sales Funnel", fa: "قیف فروش جهانی", desc: "ایمیل مارکتینگ، لندینگ و تبدیل بین‌المللی." },
  { en: "AI Automation", fa: "اتوماسیون با AI", desc: "ChatGPT، Claude و n8n برای اسکیل." },
  { en: "Tax & Legal", fa: "مالیات و حقوق بین‌المللی", desc: "ساختار قانونی LLC، Estonia e-Residency و …" },
];

const guarantees = [
  { icon: "💯", title: "ضمانت رضایت", desc: "اگر تا پایان هفته اول راضی نبودید، کل وجه برمی‌گردد." },
  { icon: "🎯", title: "ضمانت نتیجه", desc: "اگر اجرا کنید و نتیجه نگیرید، وجه شما برگشت داده می‌شود." },
  { icon: "⏱️", title: "ضمانت زمانی", desc: "تا پایان دوره وقت دارید تصمیم بگیرید — بدون هیچ سوالی." },
];

const faqs = [
  { q: "این دوره برای چه کسانی است؟", a: "هر کسی که می‌خواهد درآمد ارزی و کسب‌وکار بین‌المللی واقعی داشته باشد — از مبتدی تا حرفه‌ای." },
  { q: "آیا برای شروع به مهارت خاصی نیاز دارم؟", a: "خیر. دوره از صفر شروع می‌شود و شما را تا اجرای کامل پیش می‌برد." },
  { q: "چقدر طول می‌کشد دوره را تمام کنم؟", a: "بسته به سرعت شما ۴ تا ۸ هفته. دسترسی شما مادام‌العمر است." },
  { q: "بعد از خرید چقدر زمان می‌برد دسترسی پیدا کنم؟", a: "بلافاصله پس از پرداخت، دسترسی فعال می‌شود." },
  { q: "آیا پشتیبانی دارد؟", a: "بله. تیم پشتیبانی آکادمی رفیعی پاسخگوی شماست." },
  { q: "اگر از ایران هستم، می‌توانم درآمد ارزی بگیرم؟", a: "بله. در دوره روش‌های دریافت ارز برای ایرانیان به‌طور کامل آموزش داده شده." },
  { q: "آیا گواهی پایان دوره دارد؟", a: "بله. گواهی رسمی آکادمی رفیعی صادر می‌شود." },
  { q: "اگر نتیجه نگرفتم چه؟", a: "گارانتی بازگشت وجه داریم. در صورت اجرا و عدم نتیجه، وجه شما برمی‌گردد." },
];

/* ───────── COMPONENT ───────── */

const BoundlessCCLanding: React.FC = () => {
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [saleEndsAt, setSaleEndsAt] = useState<string | null>(null);
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);
  const courseSlug = "boundless";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("courses")
          .select("price, is_sale_enabled, sale_price, sale_expires_at, use_dollar_price, usd_price")
          .eq("slug", courseSlug)
          .maybeSingle();
        if (!data) return;
        const notExpired =
          !data.sale_expires_at || new Date(data.sale_expires_at) > new Date();

        let priceToman = Number(data.price) || 0;
        let saleToman: number | null = data.sale_price ? Number(data.sale_price) : null;

        if (data.use_dollar_price && data.usd_price) {
          // Try live Tetherland rate; fall back to ratio from stored toman price.
          let rate = 0;
          try {
            rate = await TetherlandService.getUSDTToIRRRate();
          } catch (err) {
            console.error("Tetherland rate fetch failed, using stored price ratio", err);
          }
          if (!rate && priceToman > 0) rate = priceToman / Number(data.usd_price);
          if (rate > 0) {
            priceToman = Math.round(Number(data.usd_price) * rate);
            if (saleToman !== null) saleToman = Math.round(saleToman * rate);
          }
        }

        const discountOn =
          !!data.is_sale_enabled && !!saleToman && saleToman < priceToman && notExpired;
        setOriginalPrice(priceToman);
        setCoursePrice(discountOn ? (saleToman as number) : priceToman);
        setSaleEndsAt(discountOn ? data.sale_expires_at : null);
        setHasDiscount(discountOn);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const goEnroll = () => { window.location.href = "/enroll/?course=boundless"; };
  const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  const savings = Math.max(originalPrice - coursePrice, 0);
  const percentOff = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  const StickyCTA = () => (
    <QuickEnrollPopover courseSlug="boundless" fallbackHref="/enroll/?course=boundless">
      <Button
        size="lg"
        className="text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        style={{ background: `linear-gradient(135deg, hsl(${BRAND}), hsl(${BRAND} / 0.85))` }}
      >
        <Flame className="ml-2 h-5 w-5" />
        همین الان شروع کنید — {fmt(coursePrice)} تومان
      </Button>
    </QuickEnrollPopover>
  );

  return (
    <MainLayout>
      <head>
        <title>دوره شروع بدون مرز | راه‌اندازی بیزینس آنلاین بین‌المللی و درآمد ارزی</title>
        <meta name="description" content="دوره شروع بدون مرز: بیزینس بین‌المللی، درآمد ارزی پایدار، Upwork، Shopify، Stripe، AI و گارانتی بازگشت وجه." />
      </head>

      <div dir="rtl" className="min-h-screen bg-background text-foreground">

        {/* HERO */}
        <section className="relative py-12 md:py-20 border-y" style={{ borderColor: `hsl(${BRAND} / 0.25)` }}>
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-8">
              <Badge
                className="mb-4 text-white border-0 px-4 py-2"
                style={{ background: `linear-gradient(135deg, hsl(${BRAND}), hsl(${ACCENT}))` }}
              >
                <PlayCircle className="ml-2 h-4 w-4" />
                ویدیو معرفی دوره را حتماً تماشا کنید
              </Badge>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
                دوره شروع <span style={{ color: `hsl(${BRAND})` }}>بدون مرز</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                در این ویدیو با جزئیات دوره و روش‌های ساخت بیزینس بین‌المللی و درآمد ارزی آشنا می‌شوید.
              </p>
            </div>

            <Card className="overflow-hidden border-2" style={{ borderColor: `hsl(${BRAND} / 0.3)` }}>
              <ArvanPlayer configUrl={HERO_VIDEO} />
            </Card>

            <div className="text-center mt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">
                ⏱️ مدت زمان: ۵۴ دقیقه | 🎯 این ویدیو می‌تواند نقطه عطف بیزینس جهانی شما باشد
              </p>
              <StickyCTA />
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-6">
              <Badge variant="outline" className="mb-4" style={{ borderColor: `hsl(${ACCENT})`, color: `hsl(${ACCENT})` }}>
                <Flame className="ml-1 h-3 w-3" /> پیشنهاد ویژه
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">دوره شروع بدون مرز — ۱۴۰۵</h2>
              <p className="text-muted-foreground">سرمایه‌گذاری روی پایدارترین مدل کسب‌وکار جهانی</p>
            </div>

            {hasDiscount ? (
              <div className="relative max-w-2xl mx-auto">
                {/* Outer frame — classic double border */}
                <div
                  className="relative rounded-[28px] p-[1.5px] shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${BRAND} / 0.6), hsl(${ACCENT}))`,
                  }}
                >
                  <div
                    className="relative rounded-[26px] overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 100%)",
                    }}
                  >
                    {/* Top eyebrow */}
                    <div
                      className="text-center text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase py-2.5 text-white"
                      style={{
                        background: `linear-gradient(90deg, hsl(${ACCENT}), hsl(20 90% 50%), hsl(${ACCENT}))`,
                      }}
                    >
                      Exclusive · Limited Edition · پیشنهاد ویژه
                    </div>

                    {/* Perforated side notches (ticket look) */}
                    <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border" style={{ borderColor: `hsl(${ACCENT} / 0.4)` }} />
                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border" style={{ borderColor: `hsl(${ACCENT} / 0.4)` }} />

                    <div className="px-5 sm:px-8 md:px-12 pt-8 md:pt-10 pb-8 md:pb-10 text-center">
                      {/* Giant percent badge */}
                      <div className="relative inline-flex items-center justify-center mb-5">
                        <div
                          className="absolute inset-0 blur-2xl opacity-40 rounded-full"
                          style={{ background: `hsl(${ACCENT})` }}
                        />
                        <div
                          className="relative flex items-baseline gap-1.5 px-6 py-3 rounded-2xl border-2"
                          style={{
                            borderColor: `hsl(${ACCENT})`,
                            background: `hsl(${ACCENT} / 0.08)`,
                          }}
                        >
                          <span className="text-5xl md:text-6xl font-black leading-none" style={{ color: `hsl(${ACCENT})`, fontFamily: 'Georgia, serif' }}>
                            {fmt(percentOff)}
                          </span>
                          <span className="text-2xl md:text-3xl font-bold" style={{ color: `hsl(${ACCENT})` }}>٪</span>
                          <span className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase mr-2 text-foreground/70">تخفیف</span>
                        </div>
                      </div>

                      <p className="text-sm md:text-base text-muted-foreground mb-1">سرمایه‌گذاری امروز شما</p>

                      {/* Price block */}
                      <div className="flex items-baseline justify-center gap-2 mb-1" dir="ltr">
                        <span
                          className="text-5xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight"
                          style={{ color: `hsl(${BRAND})`, fontFeatureSettings: '"tnum"' }}
                        >
                          {fmt(coursePrice)}
                        </span>
                        <span className="text-base md:text-lg font-bold text-foreground/80">تومان</span>
                      </div>

                      <div className="inline-flex items-center gap-2 mt-2 mb-6 text-sm text-muted-foreground">
                        <span className="line-through">{fmt(originalPrice)} تومان</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: `hsl(0 70% 50%)` }}>
                          <TrendingDown className="h-3 w-3" /> {fmt(savings)} صرفه‌جویی
                        </span>
                      </div>

                      {/* Ornament */}
                      <div className="flex items-center justify-center gap-3 mb-6">
                        <span className="h-px w-16 md:w-24" style={{ background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.6))` }} />
                        <span className="text-[10px] tracking-[0.4em] text-muted-foreground uppercase">پایان کمپین</span>
                        <span className="h-px w-16 md:w-24" style={{ background: `linear-gradient(90deg, hsl(${ACCENT} / 0.6), transparent)` }} />
                      </div>

                      {/* Countdown */}
                      {saleEndsAt && (
                        <div className="mb-7 max-w-md mx-auto">
                          <EnhancedCountdownTimer endDate={saleEndsAt} />
                          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs font-semibold" style={{ color: `hsl(${ACCENT})` }}>
                            <Timer className="h-3.5 w-3.5 animate-pulse" />
                            <span>پس از این زمان، قیمت به حالت عادی بازمی‌گردد</span>
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <StickyCTA />

                      {/* Trust pills — minimal */}
                      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" style={{ color: `hsl(${BRAND})` }} /> پرداخت امن
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5" style={{ color: `hsl(${BRAND})` }} /> گارانتی بازگشت وجه
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <InfinityIcon className="h-3.5 w-3.5" style={{ color: `hsl(${BRAND})` }} /> دسترسی مادام‌العمر
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-3 mb-4 flex-wrap">
                  <span className="text-5xl md:text-6xl font-extrabold" style={{ color: `hsl(${BRAND})` }}>
                    {fmt(coursePrice)}
                  </span>
                  <span className="text-xl">تومان</span>
                </div>
                <div className="mt-8"><StickyCTA /></div>
              </div>
            )}
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">دقیقاً چی دریافت می‌کنید؟</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "۱۰+ اپیزود ویدیویی عملی و قابل اجرا",
                "پرامپت‌های AI برای محتوا، فروش و اتوماسیون",
                "پشتیبانی تخصصی تیم رفیعی",
                "دسترسی مادام‌العمر + آپدیت‌های آینده رایگان",
                "هدیه: مزه بدون مرز + کلاس‌های جانبی",
                "گارانتی ۱۰۰٪ بازگشت وجه",
              ].map((item, i) => (
                <Card key={i} className="border-r-4" style={{ borderRightColor: `hsl(${BRAND})` }}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `hsl(${BRAND})` }}>
                      {i + 1}
                    </div>
                    <p className="pt-1">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-10"><StickyCTA /></div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <Badge className="mx-auto block w-fit mb-3 text-white border-0" style={{ background: `hsl(${BRAND})` }}>
              <Sparkles className="ml-1 h-3 w-3 inline" /> موفقیت‌های واقعی
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">داستان‌های تحول واقعی</h2>
            <p className="text-center text-muted-foreground mb-10">کسانی که با این دوره وارد بازار جهانی شدند</p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { num: "+۸۵٪", label: "افزایش درآمد ارزی" },
                { num: "+۵,۰۰۰", label: "دانشجوی بدون مرز" },
                { num: "۹۷٪", label: "رضایت دانشجویان" },
              ].map((s, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-6">
                    <div className="text-4xl font-extrabold" style={{ color: `hsl(${BRAND})` }}>{s.num}</div>
                    <p className="text-muted-foreground mt-2">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformations.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <p className="text-sm leading-relaxed mb-4">"{t.text}"</p>
                      <div className="border-t pt-3">
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                        <Badge className="mt-2 text-white border-0" style={{ background: `hsl(${BRAND})` }}>
                          <CheckCircle2 className="ml-1 h-3 w-3" /> {t.badge}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* VIDEO TESTIMONIALS */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4" style={{ borderColor: `hsl(${BRAND})`, color: `hsl(${BRAND})` }}>
                تجربه‌های واقعی
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">تجربه‌های واقعی دانشجویان</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                ببینید دانشجویان دوره شروع بدون مرز چه می‌گویند.
              </p>
            </div>

            {/* Featured big frame */}
            <Card className="overflow-hidden border-2 mb-8 max-w-4xl mx-auto" style={{ borderColor: `hsl(${BRAND} / 0.4)` }}>
              <ArvanPlayer configUrl={FEATURED_TESTIMONIAL} />
            </Card>

            {/* Other testimonials grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TESTIMONIAL_VIDEOS.map((url) => (
                <Card key={url} className="overflow-hidden border-2" style={{ borderColor: `hsl(${BRAND} / 0.2)` }}>
                  <ArvanPlayer configUrl={url} />
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SCENARIOS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">خودتان را در این موقعیت‌ها تصور کنید:</h2>
            <div className="space-y-3">
              {scenarios.map((s, i) => (
                <Card key={i} className="border-r-4" style={{ borderRightColor: `hsl(${ACCENT})` }}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: `hsl(${ACCENT})` }} />
                    <p>{s}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-lg mt-8">برای همه این چالش‌ها، یک راه‌حل تضمینی وجود دارد:</p>
            <p className="text-center text-2xl font-bold mt-2" style={{ color: `hsl(${BRAND})` }}>دوره شروع بدون مرز</p>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">با این دوره:</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/40">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0" style={{ color: `hsl(${BRAND})` }} />
                  <p>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COST OF NOT CHANGING */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">هزینه واقعی تغییر نکردن چیست؟</h2>
            <p className="text-center text-muted-foreground mb-10">ماندن در شرایط فعلی، گران‌ترین انتخاب است</p>
            <div className="grid md:grid-cols-2 gap-5">
              {costs.map((c, i) => (
                <Card key={i} className="border-2" style={{ borderColor: `hsl(${c.color} / 0.3)` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ background: `hsl(${c.color} / 0.12)`, color: `hsl(${c.color})` }}>
                        <c.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-lg">{c.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {c.items.map((it, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1">•</span><span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mt-8 border-2 text-center" style={{ borderColor: `hsl(${BRAND})`, background: `hsl(${BRAND} / 0.05)` }}>
              <CardContent className="p-6">
                <p className="text-lg font-medium">هزینه تغییر نکردن خیلی بیشتر از سرمایه‌گذاری {fmt(coursePrice)} تومان است.</p>
                <p className="text-muted-foreground mt-2">یک تصمیم امروز، مسیر ۱۰ سال آینده شما را عوض می‌کند.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* COMPARISON */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">چرا دوره شروع بدون مرز متفاوت است؟</h2>
            <Card className="overflow-hidden">
              <table className="w-full text-sm md:text-base">
                <thead style={{ background: `hsl(${BRAND} / 0.1)` }}>
                  <tr>
                    <th className="text-right p-4">ویژگی</th>
                    <th className="text-center p-4" style={{ color: `hsl(${BRAND})` }}>دوره شروع بدون مرز</th>
                    <th className="text-center p-4 text-muted-foreground">دوره‌های دیگر</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-4">{r.f}</td>
                      <td className="p-4 text-center">
                        {r.us === true ? <Check className="inline h-5 w-5" style={{ color: `hsl(${BRAND})` }} /> : <span className="text-sm text-muted-foreground">{String(r.us)}</span>}
                      </td>
                      <td className="p-4 text-center">
                        {r.others === false ? <X className="inline h-5 w-5 text-muted-foreground/50" /> : <span className="text-sm text-muted-foreground">{String(r.others)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </section>

        {/* FOR YOU IF */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">این دوره برای شما مناسب است اگر:</h2>
            <div className="space-y-3">
              {forYou.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-background border-r-4" style={{ borderRightColor: `hsl(${BRAND})` }}>
                  <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: `hsl(${BRAND})` }} />
                  <p>{f}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-lg mt-8 font-medium">شما لایق یک کسب‌وکار جهانی قوی و درآمد ارزی پایدار هستید.</p>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">تحول شما در ۴ تا ۸ هفته</h2>
            <p className="text-center text-muted-foreground mb-10">از یک ایده مبهم به یک کسب‌وکار جهانی واقعی</p>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { w: "هفته ۱-۲", t: "ذهنیت + انتخاب مدل", d: "ذهنیت بدون مرز و انتخاب بهترین بیزینس مدل برای شما." },
                { w: "هفته ۳-۵", t: "ساخت زیرساخت جهانی", d: "Upwork، Shopify، Stripe، Wise و برند شخصی." },
                { w: "هفته ۶-۸", t: "اولین درآمد ارزی", d: "کمپین، فروش و دریافت اولین مشتری بین‌المللی." },
              ].map((s, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-6">
                    <Badge className="mb-3 text-white border-0" style={{ background: `hsl(${BRAND})` }}>{s.w}</Badge>
                    <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                    <p className="text-sm text-muted-foreground">{s.d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-10"><StickyCTA /></div>
          </div>
        </section>

        {/* BONUSES */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge className="mx-auto block w-fit mb-3 text-white border-0" style={{ background: `hsl(${ACCENT})` }}>
              <Gift className="ml-1 h-3 w-3 inline" /> هدایای ویژه
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">بونس‌های ویژه دوره</h2>
            {hasDiscount && (
              <p className="text-center text-muted-foreground mb-10">قیمت اصلی پکیج: <span className="line-through">{fmt(originalPrice)} تومان</span></p>
            )}

            <div className="space-y-4">
              {[
                { t: "ورک‌بوک کامل تمام اپیزودها + چک‌لیست‌ها", v: "۴,۰۰۰,۰۰۰" },
                { t: "پرامپت‌های AI برای بیزینس بین‌المللی", v: "۳,۵۰۰,۰۰۰" },
                { t: "دوره مزه بدون مرز", v: "۲,۰۰۰,۰۰۰" },
                { t: "وبینار ذهن‌آگاهی برای کارآفرینان جهانی", v: "۱,۵۰۰,۰۰۰" },
              ].map((b, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{i + 1}</Badge>
                      <span>{b.t}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-sm line-through text-muted-foreground block">{b.v}</span>
                      <Badge style={{ background: `hsl(${BRAND})` }} className="text-white border-0">رایگان</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* This Week Surprise Gifts */}
            <div className="mt-10">
              <div className="text-center mb-6">
                <Badge className="mb-3 bg-gradient-to-r from-amber-500 to-pink-500 text-white border-0 px-4 py-1.5">
                  <Gift className="ml-1 h-4 w-4 inline" /> سورپرایز این هفته
                </Badge>
                <h3 className="text-2xl md:text-3xl font-extrabold">۳ هدیه ویژه برای ثبت‌نام‌های این هفته</h3>
                <p className="text-sm text-muted-foreground mt-2">فقط برای دانشجویانی که این هفته در دوره ثبت‌نام کنند</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "اشتراک یک‌ماهه Rafiei Store",
                    desc: "سیستم چندزبانه ساخت فروشگاه با AI و محصولات برنده، پشتیبانی Stripe و زرین‌پال، فیزیکی و دیجیتال — ارزش ۵$",
                  },
                  {
                    title: "دوره «شروع ایران» (۲۰۰ دقیقه)",
                    desc: "راه‌اندازی بیزینس آنلاین در ایران با باله، ترب، لندین و… کمپین فروش، تبلیغات، SMS مارکتینگ و فروش خدمات",
                  },
                  {
                    title: "۱ گیگابایت Boundless Network (یک‌ماهه)",
                    desc: "دسترسی پرسرعت و ایمن به شبکه بدون مرز برای کار با ابزارهای جهانی",
                  },
                ].map((g, i) => (
                  <Card key={i} className="border-2 border-amber-300 dark:border-amber-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500" />
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Gift className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 text-xs">
                          هدیه {i + 1}
                        </Badge>
                      </div>
                      <h4 className="font-bold mb-2 leading-snug">{g.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="mt-8 text-center border-2" style={{ borderColor: `hsl(${BRAND})`, background: `hsl(${BRAND} / 0.05)` }}>
              <CardContent className="p-6">
                {hasDiscount && (
                  <>
                    <p className="text-muted-foreground mb-1">مجموع ارزش پکیج:</p>
                    <p className="text-2xl font-bold line-through text-muted-foreground">{fmt(originalPrice)} تومان</p>
                    <p className="mt-2 text-muted-foreground">قیمت ویژه شما:</p>
                  </>
                )}
                {!hasDiscount && <p className="text-muted-foreground mb-1">قیمت دوره:</p>}
                <p className="text-4xl md:text-5xl font-extrabold mt-1" style={{ color: `hsl(${BRAND})` }}>{fmt(coursePrice)} تومان</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* TECHNIQUES */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">۱۲ مهارت کلیدی دوره شروع بدون مرز</h2>
            <p className="text-center text-muted-foreground mb-10">هر مهارت با مثال واقعی و قابل اجرا در بازار جهانی</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techniques.map((t, i) => (
                <Card key={i} className="border-t-4" style={{ borderTopColor: `hsl(${BRAND})` }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: `hsl(${BRAND})` }}>{i + 1}</span>
                      <h3 className="font-bold">{t.fa}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{t.en}</p>
                    <p className="text-sm">{t.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* DETAILS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">جزئیات دوره</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { i: Clock, l: "مدت", v: "۱۰+ اپیزود" },
                { i: Layers, l: "فاز", v: "۵ فاز عملی" },
                { i: Users, l: "مدرس", v: "تیم متخصص" },
                { i: InfinityIcon, l: "دسترسی", v: "مادام‌العمر" },
              ].map((x, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-5">
                    <x.i className="h-8 w-8 mx-auto mb-2" style={{ color: `hsl(${BRAND})` }} />
                    <p className="text-xs text-muted-foreground">{x.l}</p>
                    <p className="font-bold mt-1">{x.v}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* GUARANTEES */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">۳ ضمانت قدرتمند برای آرامش خاطر شما</h2>
            <p className="text-center text-muted-foreground mb-10">ریسک تصمیم با ماست، نه با شما</p>
            <div className="grid md:grid-cols-3 gap-5">
              {guarantees.map((g, i) => (
                <Card key={i} className="text-center border-2" style={{ borderColor: `hsl(${BRAND} / 0.3)` }}>
                  <CardContent className="p-6">
                    <div className="text-5xl mb-3">{g.icon}</div>
                    <h3 className="font-bold mb-2">{g.title}</h3>
                    <p className="text-sm text-muted-foreground">{g.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center mt-8 text-sm text-muted-foreground">چرا این ضمانت‌ها را می‌دهیم؟ چون ۹۷٪ دانشجویان ما کاملاً راضی هستند.</p>
          </div>
        </section>

        {/* INVEST */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Globe className="h-12 w-12 mx-auto mb-4" style={{ color: `hsl(${BRAND})` }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">روی خودت سرمایه‌گذاری کن</h2>
            <p className="text-lg text-muted-foreground mb-3">بهترین سرمایه‌گذاری نه طلاست، نه دلار، نه ارز دیجیتال.</p>
            <p className="text-xl font-medium" style={{ color: `hsl(${BRAND})` }}>بهترین سرمایه‌گذاری، سرمایه‌گذاری روی مهارت‌های جهانی توست.</p>
            <div className="mt-8"><StickyCTA /></div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">سوالات متداول</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`q-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-right font-medium">❓ {f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 text-white" style={{ background: `linear-gradient(135deg, hsl(${BRAND}), hsl(${ACCENT}))` }}>
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">زندگی کوتاه است — دیگر منتظر نمانید</h2>
            <p className="text-lg opacity-90 mb-8">
              راه اول: همین‌طور که هستید بمانید و امیدوار باشید همه چی خودش درست شود.<br />
              راه دوم: امروز تصمیم بگیرید و بیزینس بین‌المللی خودتان را بسازید.
            </p>

            {hasDiscount ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-6">
                <CardContent className="p-6">
                  <p className="opacity-90">قیمت اصلی دوره</p>
                  <p className="text-3xl font-bold mt-1 line-through opacity-80">{fmt(originalPrice)} تومان</p>
                  <p className="opacity-90 mt-2">قیمت ویژه این کمپین</p>
                  <p className="text-4xl font-extrabold mt-1">{fmt(coursePrice)} تومان</p>
                  {saleEndsAt && (
                    <div className="mt-4">
                      <EnhancedCountdownTimer endDate={saleEndsAt} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-6">
                <CardContent className="p-6">
                  <p className="opacity-90">قیمت دوره</p>
                  <p className="text-3xl font-bold mt-1">{fmt(coursePrice)} تومان</p>
                </CardContent>
              </Card>
            )}

            <QuickEnrollPopover courseSlug="boundless" fallbackHref="/enroll/?course=boundless">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-bold text-base sm:text-lg px-4 sm:px-8 py-5 sm:py-6 rounded-xl shadow-2xl w-full max-w-md mx-auto whitespace-normal leading-relaxed"
              >
                <Flame className="ml-2 h-5 w-5 shrink-0" style={{ color: `hsl(${ACCENT})` }} />
                بله، می‌خواهم وارد بازار جهانی شوم — {fmt(coursePrice)} تومان
                <ArrowLeft className="mr-2 h-5 w-5 shrink-0" />
              </Button>
            </QuickEnrollPopover>

            <p className="text-sm opacity-80 mt-4">
              <ShieldCheck className="ml-1 h-4 w-4 inline" />
              گارانتی بازگشت وجه بدون سوال
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h3 className="text-2xl font-bold mb-2">هنوز سوالی دارید؟</h3>
            <p className="text-muted-foreground mb-5">با ما در تماس باشید — خوشحال می‌شویم کمک‌تان کنیم.</p>
            <Button variant="outline" size="lg" asChild>
              <a href="/contact"><MessageCircle className="ml-2 h-4 w-4" /> تماس با پشتیبانی</a>
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default BoundlessCCLanding;
