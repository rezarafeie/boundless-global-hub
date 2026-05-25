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
  PlayCircle, Flame, ShieldCheck, Star, Clock, Users, CheckCircle2, Check, X,
  Award, Sparkles, Target, Rocket, TrendingUp, MessageCircle, ArrowLeft,
  Brain, ShoppingBag, Building2, BarChart3, Megaphone, Layers, FileDigit,
  Headphones, Infinity as InfinityIcon, Zap, Lightbulb, Gift, AlertTriangle,
  DollarSign, Heart, Hourglass, Ban, Briefcase,
} from "lucide-react";

const IRAN_GREEN = "142 71% 35%";
const IRAN_RED = "356 75% 48%";

/* ───────── DATA ───────── */

const transformations = [
  { name: "علی م.", role: "صاحب فروشگاه دیجیتال، تهران", text: "قبلاً فقط مغازه فیزیکی داشتم و فروشم کم شده بود. بعد از این دوره فروشگاه باسلام راه انداختم و فروش ماهانم ۳ برابر شد." , badge: "فروش ۳ برابر" },
  { name: "سارا ک.", role: "فریلنسر، اصفهان", text: "وقتی اینترنت بین‌المللی قطع شد فکر کردم کارم تمومه. الان از پلتفرم‌های ایرانی درآمد دلاری ندارم ولی درآمد ریالی پایدار و بیشتری دارم." , badge: "درآمد پایدار" },
  { name: "محمد ر.", role: "کارآفرین تازه‌کار، مشهد", text: "از صفر شروع کردم. الان درگاه زیبال، اینماد و فروشگاه آنلاین دارم. قدم به قدم همه چی توضیح داده شده." , badge: "از صفر تا کسب‌وکار" },
  { name: "نگار ا.", role: "خانم خانه‌دار، شیراز", text: "از خونه با موبایل شروع کردم. اولین فروشم رو دو هفته بعد از شروع دوره ثبت کردم." , badge: "شروع از خانه" },
  { name: "پریسا ج.", role: "صاحب کسب‌وکار، تبریز", text: "کمپین یکتانت و دیوار رو یاد گرفتم. هزینه تبلیغاتم نصف شد و فروشم بیشتر." , badge: "ROI تبلیغات" },
  { name: "حمید ص.", role: "تأمین‌کننده، کرج", text: "مدل دراپ‌شیپینگ ایرانی رو یاد گرفتم و الان بدون انبار کار می‌کنم." , badge: "بدون انبار" },
];

const scenarios = [
  "مغازه/کسب‌وکار سنتی دارید و فروش‌تان روز‌به‌روز کمتر می‌شود.",
  "اینترنت بین‌المللی قطع می‌شود و کانال درآمدتان از کار می‌افتد.",
  "بلد نیستید درگاه پرداخت ایرانی، اینماد یا سامانه مودیان را راه بیندازید.",
  "از تورم می‌ترسید و دنبال یک منبع درآمد ریالی مقاوم هستید.",
  "ایده دارید ولی نمی‌دانید کدام بیزینس مدل برای شرایط ایران امن و سودده است.",
  "تبلیغات می‌کنید اما هزینه‌تان بازنمی‌گردد و فروش نمی‌شود.",
];

const benefits = [
  "یک بیزینس مدل امن و سودده برای بازار ایران انتخاب می‌کنید.",
  "فروشگاه باسلام و سایت اختصاصی راه می‌اندازید.",
  "اینماد و سامانه مودیان را قانونی پیاده می‌کنید.",
  "کمپین یکتانت، دیوار و پنل پیامکی اجرا می‌کنید.",
  "از AI فارسی برای تولید محتوا و فروش استفاده می‌کنید.",
  "حتی در شرایط بحرانی و قطعی اینترنت، درآمدتان حفظ می‌شود.",
];

const costs = [
  { icon: DollarSign, color: IRAN_RED, title: "هزینه مالی", items: [
    "از دست دادن فرصت‌های آنلاین در بازار داخلی",
    "هدر دادن بودجه تبلیغاتی روی کانال‌های اشتباه",
    "ادامه دادن کسب‌وکار سنتی با حاشیه سود کم",
    "وابستگی به یک کانال درآمدی شکننده",
  ]},
  { icon: Heart, color: IRAN_RED, title: "هزینه عاطفی", items: [
    "استرس مداوم بابت قطع اینترنت و تحریم‌ها",
    "احساس عقب‌ماندن از رقبا",
    "ناامیدی از شرایط اقتصادی",
    "نداشتن مسیر مشخص و امن برای آینده",
  ]},
  { icon: Hourglass, color: IRAN_GREEN, title: "هزینه زمانی", items: [
    "ماه‌ها صرف آزمون و خطا با ابزارهای اشتباه",
    "یاد گرفتن دوره‌های خارجی غیرقابل اجرا در ایران",
    "اتلاف وقت در پلتفرم‌هایی که مخاطب ایرانی ندارد",
    "تأخیر در تصمیم‌گیری برای آنلاین شدن",
  ]},
  { icon: Ban, color: IRAN_GREEN, title: "هزینه فرصت", items: [
    "از دست دادن مشتریان داخلی پولساز",
    "محرومیت از پلتفرم‌های پرترافیک ایرانی",
    "نداشتن سیستم خودکار فروش با AI فارسی",
    "عقب ماندن از موج جدید بیزینس آنلاین ایران",
  ]},
];

const compareRows = [
  { f: "متمرکز بر بازار ایران (نه ترجمه دوره خارجی)", us: true, others: false },
  { f: "آموزش پلتفرم‌های ایرانی (باسلام، یکتانت، دیوار)", us: true, others: false },
  { f: "بدون نیاز به اینترنت بین‌المللی", us: true, others: false },
  { f: "آموزش درگاه‌های پرداخت ایرانی + اینماد + مودیان", us: true, others: false },
  { f: "AI فارسی و پرامپت‌های آماده", us: true, others: false },
  { f: "۲ مدرس با تجربه عملی در بازار ایران", us: true, others: "گاهی" },
  { f: "دسترسی مادام‌العمر و آپدیت رایگان", us: true, others: "گاهی" },
  { f: "گارانتی بازگشت وجه", us: true, others: false },
];

const forYou = [
  "می‌خواهید یک کسب‌وکار آنلاین واقعی در شرایط فعلی ایران راه بیندازید.",
  "صاحب کسب‌وکار سنتی هستید و می‌خواهید آنلاین شوید.",
  "تجربه قطعی اینترنت بین‌المللی، شما را به فکر کانال جایگزین انداخته.",
  "دنبال درآمد ریالی پایدار و قابل پیش‌بینی هستید.",
  "می‌خواهید از AI فارسی برای رشد بیزینس استفاده کنید.",
  "حاضرید قدم به قدم اجرا کنید — نه فقط تماشا.",
];

const techniques = [
  { en: "Market Reality", fa: "درک واقعیت بازار ایران", desc: "بیزینس مدل امن، تحلیل تورم و رفتار مشتری ایرانی." },
  { en: "Service Business", fa: "بیزینس مدل خدمات", desc: "ساخت پکیج درآمدی، آربیتراژ خدمات و خدمات AI." },
  { en: "Physical Product", fa: "محصول فیزیکی", desc: "محصولات خانواده، شخصی و راه‌اندازی از خانه." },
  { en: "Dropshipping", fa: "دراپ‌شیپینگ ایرانی", desc: "تأمین‌کننده، نیچ پردرآمد و فروش بدون انبار." },
  { en: "Digital Files", fa: "فروش فایل دیجیتال", desc: "محصولات دیجیتال، پلتفرم‌های فروش و قیمت‌گذاری." },
  { en: "Basalam Mastery", fa: "تسلط بر باسلام", desc: "ساخت اکانت، فریم‌ورک FEEL و محصول‌نویسی با AI." },
  { en: "Payment Gateway", fa: "درگاه پرداخت + اینماد", desc: "زرین‌پال، زیبال، اینماد و سامانه مودیان." },
  { en: "Brand Building", fa: "برندسازی پایه", desc: "Positioning، آرکتایپ برند، نام‌سازی با AI." },
  { en: "Ad Campaign", fa: "کمپین تبلیغاتی", desc: "هدف‌گذاری SMART، پرسونا و تحلیل کمپین." },
  { en: "Sales Funnel", fa: "کمپین فروش ۵ مرحله‌ای", desc: "طراحی و اجرای قیف فروش پیامکی و آنلاین." },
  { en: "Iranian Ad Platforms", fa: "یکتانت + دیوار + پیامک", desc: "تارگت‌گذاری با AI، عنوان‌نویسی و پنل پیامکی." },
  { en: "Persian AI", fa: "هوش مصنوعی فارسی", desc: "اتوماسیون فروش، محتوای فارسی و چت‌بات پشتیبانی." },
];

const guarantees = [
  { icon: "💯", title: "ضمانت رضایت", desc: "اگر تا پایان هفته اول راضی نبودید، کل وجه برمی‌گردد." },
  { icon: "🎯", title: "ضمانت نتیجه", desc: "اگر اجرا کنید و نتیجه نگیرید، وجه شما برگشت داده می‌شود." },
  { icon: "⏱️", title: "ضمانت زمانی", desc: "تا پایان دوره وقت دارید تصمیم بگیرید — بدون هیچ سوالی." },
];

const faqs = [
  { q: "این دوره برای چه کسانی است؟", a: "هر کسی که می‌خواهد در شرایط فعلی ایران یک کسب‌وکار آنلاین واقعی و سودده داشته باشد — از مبتدی تا صاحب کسب‌وکار سنتی." },
  { q: "آیا به اینترنت بین‌المللی نیاز دارم؟", a: "خیر. تمام پلتفرم‌ها، ابزارها و درگاه‌های پرداخت آموزش‌داده‌شده ایرانی هستند." },
  { q: "چقدر طول می‌کشد دوره را تمام کنم؟", a: "بسته به سرعت شما ۳ تا ۶ هفته. دسترسی شما مادام‌العمر است." },
  { q: "بعد از خرید چقدر زمان می‌برد دسترسی پیدا کنم؟", a: "بلافاصله پس از پرداخت، دسترسی فعال می‌شود." },
  { q: "آیا پشتیبانی دارد؟", a: "بله. تیم پشتیبانی آکادمی رفیعی پاسخگوی شماست." },
  { q: "اگر نتیجه نگرفتم چه؟", a: "گارانتی بازگشت وجه داریم. در صورت اجرا و عدم نتیجه، وجه شما برمی‌گردد." },
  { q: "آیا مبتدی هستم، می‌توانم استفاده کنم؟", a: "بله. دوره از صفر شروع می‌شود و تا اجرای کامل پیش می‌رود." },
  { q: "آیا گواهی پایان دوره دارد؟", a: "بله. گواهی رسمی آکادمی رفیعی صادر می‌شود." },
];

/* ───────── COMPONENT ───────── */

const IranCCLanding: React.FC = () => {
  const [coursePrice, setCoursePrice] = useState<number>(18700000);
  const [originalPrice] = useState<number>(35000000);
  const courseSlug = "iran";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("courses").select("id, price").eq("slug", courseSlug).maybeSingle();
        if (data?.price) setCoursePrice(Number(data.price));
      } catch (e) { console.error(e); }
    })();
  }, []);

  const goEnroll = () => { window.location.href = "/enroll/?course=iran"; };
  const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

  const StickyCTA = () => (
    <QuickEnrollPopover courseSlug="iran" fallbackHref="/enroll/?course=iran">
      <Button
        size="lg"
        className="text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        style={{ background: `linear-gradient(135deg, hsl(${IRAN_GREEN}), hsl(${IRAN_GREEN} / 0.85))` }}
      >
        <Flame className="ml-2 h-5 w-5" />
        همین الان شروع کنید — {fmt(coursePrice)} تومان
      </Button>
    </QuickEnrollPopover>
  );

  return (
    <MainLayout>
      <head>
        <title>دوره ایران | راه‌اندازی بیزینس آنلاین در شرایط فعلی ایران</title>
        <meta name="description" content="دوره جامع ایران: بیزینس آنلاین مقاوم با پلتفرم‌های ایرانی، حتی بدون اینترنت بین‌المللی. ۲۶+ اپیزود + AI فارسی + گارانتی بازگشت وجه." />
      </head>

      <div dir="rtl" className="min-h-screen bg-background text-foreground">

        {/* HERO — Video intro */}
        <section
          className="relative py-12 md:py-20 border-y"
          style={{ borderColor: `hsl(${IRAN_GREEN} / 0.25)` }}
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-8">
              <Badge
                className="mb-4 text-white border-0 px-4 py-2"
                style={{ background: `linear-gradient(135deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }}
              >
                <PlayCircle className="ml-2 h-4 w-4" />
                ویدیو معرفی دوره را حتماً تماشا کنید
              </Badge>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
                دوره جامع <span style={{ color: `hsl(${IRAN_GREEN})` }}>بیزینس آنلاین ایران</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                در این ویدیو با جزئیات دوره و روش‌های راه‌اندازی بیزینس در شرایط فعلی ایران آشنا می‌شوید.
              </p>
            </div>

            <Card className="overflow-hidden border-2" style={{ borderColor: `hsl(${IRAN_GREEN} / 0.3)` }}>
              <div className="aspect-video bg-black flex items-center justify-center">
                <iframe
                  className="w-full h-full"
                  src="https://www.aparat.com/video/video/embed/videohash/placeholder/vt/frame"
                  title="معرفی دوره ایران"
                  allowFullScreen
                />
              </div>
            </Card>

            <div className="text-center mt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">
                ⏱️ مدت زمان: ۱۵ دقیقه | 🎯 این ویدیو می‌تواند نقطه عطف بیزینس شما باشد
              </p>
              <StickyCTA />
            </div>
          </div>
        </section>

        {/* PRICING / OFFER */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Badge variant="outline" className="mb-4" style={{ borderColor: `hsl(${IRAN_RED})`, color: `hsl(${IRAN_RED})` }}>
              <Flame className="ml-1 h-3 w-3" /> پیشنهاد ویژه
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">دوره ایران — ۱۴۰۵</h2>
            <p className="text-muted-foreground mb-6">سرمایه‌گذاری روی پایدارترین مدل کسب‌وکار داخلی</p>

            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="text-2xl line-through text-muted-foreground">{fmt(originalPrice)}</span>
              <span className="text-5xl md:text-6xl font-extrabold" style={{ color: `hsl(${IRAN_GREEN})` }}>
                {fmt(coursePrice)}
              </span>
              <span className="text-xl">تومان</span>
            </div>
            <Badge className="text-white border-0" style={{ background: `hsl(${IRAN_RED})` }}>
              تخفیف محدود — فقط امروز
            </Badge>

            <div className="mt-8">
              <StickyCTA />
            </div>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
              دقیقاً چی دریافت می‌کنید؟
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "۲۶+ اپیزود ویدیویی عملی و قابل اجرا",
                "۲ مدرس متخصص (رضا رفیعی + متین پورخالقی)",
                "فایل‌ها و چک‌لیست‌های آماده (تمپلیت کمپین، آرکتایپ، اینماد)",
                "پرامپت‌های AI فارسی برای محتوا، تبلیغ و تحلیل",
                "ورک‌بوک PDF + خلاصه هر فاز",
                "پشتیبانی تخصصی تیم رفیعی",
                "دسترسی مادام‌العمر + آپدیت‌های آینده رایگان",
                "گواهی رسمی پایان دوره از آکادمی رفیعی",
                "هدیه: کلاس رایگان IR Class",
                "گارانتی ۱۰۰٪ بازگشت وجه",
              ].map((item, i) => (
                <Card key={i} className="border-r-4" style={{ borderRightColor: `hsl(${IRAN_GREEN})` }}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div
                      className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: `hsl(${IRAN_GREEN})` }}
                    >
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

        {/* SOCIAL PROOF STATS */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <Badge className="mx-auto block w-fit mb-3 text-white border-0" style={{ background: `hsl(${IRAN_GREEN})` }}>
              <Sparkles className="ml-1 h-3 w-3 inline" /> موفقیت‌های واقعی
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">داستان‌های تحول واقعی</h2>
            <p className="text-center text-muted-foreground mb-10">
              کسانی که با این دوره بیزینس‌شان را در ایران متحول کردند
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { num: "۹۲٪", label: "افزایش فروش آنلاین" },
                { num: "+۳,۲۰۰", label: "دانشجوی ایرانی" },
                { num: "۹۶٪", label: "رضایت دانشجویان" },
              ].map((s, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-6">
                    <div className="text-4xl font-extrabold" style={{ color: `hsl(${IRAN_GREEN})` }}>{s.num}</div>
                    <p className="text-muted-foreground mt-2">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformations.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <p className="text-sm leading-relaxed mb-4">"{t.text}"</p>
                      <div className="border-t pt-3">
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                        <Badge className="mt-2 text-white border-0" style={{ background: `hsl(${IRAN_GREEN})` }}>
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

        {/* SCENARIOS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              خودتان را در این موقعیت‌ها تصور کنید:
            </h2>
            <div className="space-y-3">
              {scenarios.map((s, i) => (
                <Card key={i} className="border-r-4" style={{ borderRightColor: `hsl(${IRAN_RED})` }}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: `hsl(${IRAN_RED})` }} />
                    <p>{s}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-lg mt-8">
              برای همه این چالش‌ها، یک راه‌حل تضمینی وجود دارد:
            </p>
            <p className="text-center text-2xl font-bold mt-2" style={{ color: `hsl(${IRAN_GREEN})` }}>
              دوره جامع بیزینس آنلاین ایران
            </p>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
              با این دوره:
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/40">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0" style={{ color: `hsl(${IRAN_GREEN})` }} />
                  <p>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COST OF NOT CHANGING */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
              هزینه واقعی تغییر نکردن چیست؟
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              ماندن در شرایط فعلی، گران‌ترین انتخاب است
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              {costs.map((c, i) => (
                <Card key={i} className="border-2" style={{ borderColor: `hsl(${c.color} / 0.3)` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center"
                        style={{ background: `hsl(${c.color} / 0.12)`, color: `hsl(${c.color})` }}
                      >
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

            <Card
              className="mt-8 border-2 text-center"
              style={{ borderColor: `hsl(${IRAN_GREEN})`, background: `hsl(${IRAN_GREEN} / 0.05)` }}
            >
              <CardContent className="p-6">
                <p className="text-lg font-medium">
                  هزینه تغییر نکردن خیلی بیشتر از سرمایه‌گذاری {fmt(coursePrice)} تومان است.
                </p>
                <p className="text-muted-foreground mt-2">یک تصمیم امروز، مسیر ۱۰ سال آینده شما را عوض می‌کند.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* COMPARISON */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
              چرا دوره ایران متفاوت است؟
            </h2>
            <Card className="overflow-hidden">
              <table className="w-full text-sm md:text-base">
                <thead style={{ background: `hsl(${IRAN_GREEN} / 0.1)` }}>
                  <tr>
                    <th className="text-right p-4">ویژگی</th>
                    <th className="text-center p-4" style={{ color: `hsl(${IRAN_GREEN})` }}>دوره ایران</th>
                    <th className="text-center p-4 text-muted-foreground">دوره‌های دیگر</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-4">{r.f}</td>
                      <td className="p-4 text-center">
                        {r.us === true ? (
                          <Check className="inline h-5 w-5" style={{ color: `hsl(${IRAN_GREEN})` }} />
                        ) : (
                          <span className="text-sm text-muted-foreground">{String(r.us)}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {r.others === false ? (
                          <X className="inline h-5 w-5 text-muted-foreground/50" />
                        ) : (
                          <span className="text-sm text-muted-foreground">{String(r.others)}</span>
                        )}
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
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
              این دوره برای شما مناسب است اگر:
            </h2>
            <div className="space-y-3">
              {forYou.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg bg-background border-r-4"
                  style={{ borderRightColor: `hsl(${IRAN_GREEN})` }}
                >
                  <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: `hsl(${IRAN_GREEN})` }} />
                  <p>{f}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-lg mt-8 font-medium">
              شما لایق یک کسب‌وکار آنلاین قوی و درآمد ریالی پایدار هستید.
            </p>
          </div>
        </section>

        {/* TRANSFORMATION TIMELINE */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
              تحول شما در ۳ تا ۶ هفته
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              از یک ایده مبهم به یک کسب‌وکار آنلاین واقعی
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { w: "هفته ۱-۲", t: "درک بازار + انتخاب مدل", d: "بیزینس مدل امن انتخاب می‌کنید و استراتژی پایه می‌چینید." },
                { w: "هفته ۳-۴", t: "ساخت زیرساخت", d: "باسلام، درگاه پرداخت، اینماد و سامانه مودیان." },
                { w: "هفته ۵-۶", t: "مارکتینگ + اولین فروش", d: "کمپین یکتانت/دیوار/پیامک + AI فارسی + اولین مشتری." },
              ].map((s, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-6">
                    <Badge className="mb-3 text-white border-0" style={{ background: `hsl(${IRAN_GREEN})` }}>{s.w}</Badge>
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
            <Badge className="mx-auto block w-fit mb-3 text-white border-0" style={{ background: `hsl(${IRAN_RED})` }}>
              <Gift className="ml-1 h-3 w-3 inline" /> هدایای ویژه
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">بونس‌های ویژه دوره</h2>
            <p className="text-center text-muted-foreground mb-10">
              قیمت اصلی پکیج: <span className="line-through">{fmt(originalPrice)} تومان</span>
            </p>

            <div className="space-y-4">
              {[
                { t: "ورک‌بوک کامل ۲۶ اپیزود + چک‌لیست‌ها", v: "۳,۰۰۰,۰۰۰" },
                { t: "پرامپت‌های AI فارسی برای بیزینس", v: "۲,۵۰۰,۰۰۰" },
                { t: "کلاس رایگان IR Class", v: "۲,۰۰۰,۰۰۰" },
                { t: "وبینار ذهن‌آگاهی برای کارآفرینان", v: "۱,۵۰۰,۰۰۰" },
              ].map((b, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{i + 1}</Badge>
                      <span>{b.t}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-sm line-through text-muted-foreground block">{b.v}</span>
                      <Badge style={{ background: `hsl(${IRAN_GREEN})` }} className="text-white border-0">رایگان</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card
              className="mt-8 text-center border-2"
              style={{ borderColor: `hsl(${IRAN_GREEN})`, background: `hsl(${IRAN_GREEN} / 0.05)` }}
            >
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-1">مجموع ارزش پکیج:</p>
                <p className="text-2xl font-bold line-through text-muted-foreground">{fmt(originalPrice)} تومان</p>
                <p className="mt-2 text-muted-foreground">قیمت ویژه شما:</p>
                <p className="text-4xl md:text-5xl font-extrabold mt-1" style={{ color: `hsl(${IRAN_GREEN})` }}>
                  {fmt(coursePrice)} تومان
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* TECHNIQUES (12+) */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
              ۱۲ مهارت کلیدی دوره ایران
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              هر مهارت با مثال واقعی و قابل اجرا در بازار ایران
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techniques.map((t, i) => (
                <Card key={i} className="border-t-4" style={{ borderTopColor: `hsl(${IRAN_GREEN})` }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: `hsl(${IRAN_GREEN})` }}
                      >
                        {i + 1}
                      </span>
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

        {/* WORKSHOP DETAILS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">جزئیات دوره</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { i: Clock, l: "مدت", v: "۲۶+ اپیزود" },
                { i: Layers, l: "فاز", v: "۴ فاز عملی" },
                { i: Users, l: "مدرس", v: "۲ متخصص" },
                { i: InfinityIcon, l: "دسترسی", v: "مادام‌العمر" },
              ].map((x, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="p-5">
                    <x.i className="h-8 w-8 mx-auto mb-2" style={{ color: `hsl(${IRAN_GREEN})` }} />
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
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
              ۳ ضمانت قدرتمند برای آرامش خاطر شما
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              ریسک تصمیم با ماست، نه با شما
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {guarantees.map((g, i) => (
                <Card key={i} className="text-center border-2" style={{ borderColor: `hsl(${IRAN_GREEN} / 0.3)` }}>
                  <CardContent className="p-6">
                    <div className="text-5xl mb-3">{g.icon}</div>
                    <h3 className="font-bold mb-2">{g.title}</h3>
                    <p className="text-sm text-muted-foreground">{g.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center mt-8 text-sm text-muted-foreground">
              چرا این ضمانت‌ها را می‌دهیم؟ چون ۹۶٪ دانشجویان ما کاملاً راضی هستند.
            </p>
          </div>
        </section>

        {/* INVEST IN YOURSELF */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">روی خودت سرمایه‌گذاری کن</h2>
            <p className="text-lg text-muted-foreground mb-3">
              بهترین سرمایه‌گذاری نه طلاست، نه دلار، نه ارز دیجیتال.
            </p>
            <p className="text-xl font-medium" style={{ color: `hsl(${IRAN_GREEN})` }}>
              بهترین سرمایه‌گذاری، سرمایه‌گذاری روی مهارت‌های خودت است.
            </p>
            <div className="mt-8"><StickyCTA /></div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">سوالات متداول</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`q-${i}`}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-right font-medium">
                    ❓ {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          className="py-20 text-white"
          style={{ background: `linear-gradient(135deg, hsl(${IRAN_GREEN}), hsl(${IRAN_RED}))` }}
        >
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              زندگی کوتاه است — دیگر منتظر نمانید
            </h2>
            <p className="text-lg opacity-90 mb-8">
              راه اول: همین‌طور که هستید بمانید و امیدوار باشید همه چی خودش درست شود.<br />
              راه دوم: امروز تصمیم بگیرید و با ابزارهای اثبات‌شده بیزینس‌تان را بسازید.
            </p>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-6">
              <CardContent className="p-6">
                <p className="opacity-90">قیمت دوره بعدی به</p>
                <p className="text-3xl font-bold mt-1">{fmt(originalPrice)} تومان</p>
                <p className="opacity-90 mt-1">افزایش پیدا می‌کند.</p>
              </CardContent>
            </Card>

            <QuickEnrollPopover courseSlug="iran" fallbackHref="/enroll/?course=iran">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-xl shadow-2xl"
              >
                <Flame className="ml-2 h-5 w-5" style={{ color: `hsl(${IRAN_RED})` }} />
                بله، می‌خواهم بیزینسم را در ایران راه بیندازم — {fmt(coursePrice)} تومان
                <ArrowLeft className="mr-2 h-5 w-5" />
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

export default IranCCLanding;
