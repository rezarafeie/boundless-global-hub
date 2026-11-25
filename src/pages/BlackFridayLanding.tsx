import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft, Copy, Check, Plus, Sparkles, Flame } from "lucide-react";
import { rafieiServices } from "@/data/rafieiServices";
import MainLayout from "@/components/Layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import { useCountdown } from "@/hooks/useCountdown";
import { courseImage, courseImagePosition } from "@/lib/academyImagery";
import { resolveLivePrice } from "@/lib/liveCoursePrice";
import { courseInstallmentPlan, type GatewayInstallmentSettings } from "@/lib/courseInstallments";

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(Math.round(n));
const fa2 = (n: number) => new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(n);

type DiscountRow = {
  discount_percentage: number;
  courses: { id: string; slug: string; title: string; description: string | null; price: number | null; use_dollar_price: boolean | null; usd_price: number | null; is_active: boolean | null; snapppay_enabled: boolean | null; digipay_enabled: boolean | null } | null;
};
type Service = { id: string; title: string; description: string | null; url: string; discount_percentage: number; discount_code: string | null };

const CountBlock = ({ v, l }: { v: number; l: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-4xl sm:text-6xl md:text-7xl font-black tabular-nums leading-none text-background">{fa2(v)}</span>
    <span className="mt-2 text-[11px] sm:text-xs tracking-widest text-background/60">{l}</span>
  </div>
);

const Tape = ({ text, tilt = "", invert = false }: { text: string; tilt?: string; invert?: boolean }) => (
  <div className={`relative overflow-hidden py-3 text-left ${invert ? "bg-background text-foreground border-y border-foreground" : "bg-foreground text-background"} ${tilt}`} dir="ltr" aria-hidden>
    <div className="bf-marquee flex w-max flex-nowrap items-center whitespace-nowrap">
      {Array.from({ length: 2 }).map((_, k) => (
        <div key={k} className="flex shrink-0 flex-nowrap items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-5 flex shrink-0 items-center gap-5 whitespace-nowrap text-sm font-black uppercase tracking-[0.25em] md:text-base">{text}<span className="h-2 w-2 shrink-0 rotate-45 bg-current" /></span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SectionHead = ({ eyebrow, title, sub, ghost }: { eyebrow: string; title: string; sub?: string; ghost: string }) => (
  <div className="relative mb-8 md:mb-12">
    <span className="pointer-events-none absolute -top-6 left-0 select-none text-[5rem] font-black leading-none text-foreground/[0.05] md:-top-10 md:text-[9rem]" dir="ltr">{ghost}</span>
    <span className="relative inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1 text-[11px] font-bold text-background"><Flame className="h-3 w-3" />{eyebrow}</span>
    <h2 className="relative mt-3 text-3xl font-black text-foreground md:text-5xl">{title}</h2>
    {sub && <p className="relative mt-2 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">{sub}</p>}
  </div>
);

const short = (n: number) => n >= 1_000_000 ? `${fa(Math.round(n / 100_000) / 10)} میلیون` : `${fa(Math.round(n / 1000))} هزار`;

const useLivePrice = (c: NonNullable<DiscountRow["courses"]>) => {
  const [price, setPrice] = useState<number>(Number(c.price || 0));
  useEffect(() => { resolveLivePrice(c).then(setPrice).catch(() => {}); }, [c]);
  return price;
};

const CourseTile = ({ row, picked, onPick, onPrice, gateways }: { row: DiscountRow; picked: boolean; onPick: () => void; onPrice: (id: string, p: number) => void; gateways: GatewayInstallmentSettings }) => {
  const c = row.courses!;
  const price = useLivePrice(c);
  useEffect(() => { onPrice(c.id, price); }, [price]); // eslint-disable-line react-hooks/exhaustive-deps
  const final = price * (1 - row.discount_percentage / 100);
  const save = price - final;
  const installmentPlan = courseInstallmentPlan(c, gateways, final);
  return (
    <article id={`deal-${c.id}`} className={`group flex flex-col overflow-hidden rounded-[2rem] border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-float ${picked ? "border-foreground ring-2 ring-foreground" : "border-border"}`}>
      <Link to={`/courses/${c.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-photo-shade">
        <img src={courseImage(c.slug, c.title)} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" style={{ objectPosition: courseImagePosition(c.slug, c.title) }} />
        <div className="absolute inset-0 bg-gradient-to-t from-photo-shade via-photo-shade/30 to-transparent" />
        <span className="absolute right-4 top-4 rotate-[-4deg] rounded-md bg-foreground px-2 py-1 font-mono text-[10px] font-black tracking-widest text-background" dir="ltr">BLACK FRIDAY</span>
        <span className="absolute left-4 top-4 rounded-2xl bg-background px-3 py-2 text-center leading-none text-foreground shadow-float">
          <b className="block text-2xl font-black">{fa(row.discount_percentage)}٪</b><span className="text-[10px] font-bold">تخفیف</span>
        </span>
        <h3 className="absolute inset-x-5 bottom-4 text-xl font-extrabold leading-snug text-photo-ink md:text-2xl">{c.title}</h3>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        {c.description && <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{c.description}</p>}
        {price > 0 ? (
          <>
            <div className="rounded-2xl bg-foreground p-4 text-background">
              {installmentPlan ? (
                <>
                  <div className="text-xs text-background/60">شروع یادگیری فقط با</div>
                  <div className="mt-1 text-3xl font-black">{short(installmentPlan.firstPayment)} <span className="text-sm font-medium text-background/70">تومان</span></div>
                  <div className="mt-1 text-[11px] text-background/60">قسط اول از {fa(installmentPlan.count)} قسط مساوی {fa(installmentPlan.firstPayment)} تومانی</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-background/60">قیمت نهایی با تخفیف</div>
                  <div className="mt-1 text-3xl font-black">{fa(final)} <span className="text-sm font-medium text-background/70">تومان</span></div>
                  <div className="mt-1 text-[11px] text-background/60">پرداخت نقدی در صفحه ثبت‌نام</div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-2xl border border-border p-3">
                <div className="text-[11px] text-muted-foreground">قیمت اصلی</div>
                <div className="mt-1 text-sm font-bold text-muted-foreground line-through">{fa(price)}</div>
              </div>
              <div className="rounded-2xl border border-foreground p-3">
                <div className="text-[11px] text-muted-foreground">سود شما</div>
                <div className="mt-1 text-sm font-black text-foreground">{fa(save)} تومان</div>
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground">قیمت نهایی نقدی: <b className="text-foreground">{fa(final)} تومان</b></div>
          </>
        ) : <p className="text-sm text-muted-foreground">{fa(row.discount_percentage)}٪ تخفیف بلک فرایدی</p>}
        <div className="mt-auto flex gap-2 pt-1">
          <a href={`/enroll/?course=${c.slug}`} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition-opacity hover:opacity-90">
            همین حالا ثبت‌نام <ArrowLeft className="h-4 w-4" />
          </a>
          {price > 0 && (
            <button onClick={onPick} aria-label="افزودن به ماشین‌حساب سود" className={`rounded-full border px-4 text-sm font-bold transition-colors ${picked ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground"}`}>
              {picked ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

const ServiceTile = ({ s }: { s: Service }) => {
  const [copied, setCopied] = useState(false);
  const meta = rafieiServices.find((x) => x.name === s.title || (x.href.startsWith("http") && s.url.startsWith(x.href)));
  const Icon = meta?.icon || Sparkles;
  return (
    <div className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-[2rem] bg-foreground p-6 text-background transition-all duration-300 hover:-translate-y-1 hover:shadow-float md:p-6">
      <Icon className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-36 text-background/[0.06] transition-transform duration-700 group-hover:rotate-12" />
      <div className="relative flex items-start justify-between">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-foreground"><Icon className="h-7 w-7" /></span>
        <span className="text-left leading-none"><b className="block text-4xl font-black">{fa(s.discount_percentage)}٪</b><span className="text-[10px] text-background/60">تخفیف</span></span>
      </div>
      <div className="relative mt-auto pt-6">
        {meta && <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-background/50" dir="ltr">{meta.en}</span>}
        <h3 className="mt-1 text-2xl font-extrabold">{s.title}</h3>
        {meta && <p className="mt-1 text-sm font-semibold text-background/85">{meta.tagline}</p>}
        <p className="mt-2 text-sm leading-7 text-background/65">{s.description || meta?.description}</p>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        {s.discount_code && (
          <button onClick={() => { navigator.clipboard?.writeText(s.discount_code!); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-background/40 px-3 py-1.5 font-mono text-xs font-semibold" dir="ltr">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {s.discount_code}
          </button>
        )}
        <a href={s.url} target="_blank" rel="noopener noreferrer" className="mr-auto inline-flex items-center gap-1 rounded-full bg-background px-4 py-1.5 text-sm font-bold text-foreground">
          استفاده <ArrowUpLeft className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

const BlackFridayLanding: React.FC = () => {
  const { isActive, settings } = useBlackFridayContext();
  const t = useCountdown(settings?.end_date);

  const { data: rows = [] } = useQuery({
    queryKey: ["bf-landing-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("black_friday_discounts")
        .select("discount_percentage, courses(id, slug, title, description, price, use_dollar_price, usd_price, is_active, snapppay_enabled, digipay_enabled)")
        .order("discount_percentage", { ascending: false });
      if (error) throw error;
      return ((data || []) as unknown as DiscountRow[]).filter((r) => r.courses && r.courses.is_active !== false);
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: installmentGateways = {} } = useQuery<GatewayInstallmentSettings>({
    queryKey: ["bf-installment-gateways"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_settings")
        .select("snapppay_enabled, rafieipay_snapppay_enabled, digipay_enabled, snapppay_max_amount_toman, digipay_max_amount_toman")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return (data || {}) as GatewayInstallmentSettings;
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["bf-landing-services"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("black_friday_services").select("id, title, description, url, discount_percentage, discount_code")
        .eq("is_active", true).order("sort_order").order("created_at");
      if (error) throw error;
      return (data || []) as Service[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const maxOff = useMemo(() => Math.max(0, ...rows.map((r) => r.discount_percentage), ...services.map((s) => s.discount_percentage)), [rows, services]);
  const notStarted = settings?.start_date && new Date(settings.start_date) > new Date();

  const [picked, setPicked] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const onPrice = React.useCallback((id: string, p: number) => setPrices((m) => (m[id] === p ? m : { ...m, [id]: p })), []);
  const calc = useMemo(() => {
    let orig = 0, fin = 0, installmentFirst = 0, installmentCourses = 0;
    rows.forEach((r) => {
      const id = r.courses!.id;
      if (!picked.includes(id)) return;
      const p = prices[id] || 0;
      const finalPrice = p * (1 - r.discount_percentage / 100);
      orig += p;
      fin += finalPrice;
      const plan = courseInstallmentPlan(r.courses!, installmentGateways, finalPrice);
      if (plan) {
        installmentFirst += plan.firstPayment;
        installmentCourses += 1;
      }
    });
    return { orig, fin, save: orig - fin, installmentFirst, installmentCourses };
  }, [picked, prices, rows, installmentGateways]);
  const totalSave = useMemo(() => rows.reduce((a, r) => a + (prices[r.courses!.id] || 0) * r.discount_percentage / 100, 0), [rows, prices]);
  const startingInstallment = useMemo(() => {
    const firstPayments = rows.flatMap((r) => {
      const price = prices[r.courses!.id] || 0;
      const finalPrice = price * (1 - r.discount_percentage / 100);
      const plan = courseInstallmentPlan(r.courses!, installmentGateways, finalPrice);
      return plan ? [plan.firstPayment] : [];
    });
    return firstPayments.length ? Math.min(...firstPayments) : null;
  }, [rows, prices, installmentGateways]);
  const startCoursePrice = useMemo(() => {
    const isStartCourse = (r: DiscountRow) => {
      const slug = r.courses!.slug || "";
      const title = r.courses!.title || "";
      return slug === "boundless" || slug === "boundless-taste" || title.includes("دوره شروع");
    };
    const row = rows.find(isStartCourse) ?? (rows.length ? rows.slice().sort((a, b) => {
      const pa = (prices[a.courses!.id] || 0) * (1 - a.discount_percentage / 100);
      const pb = (prices[b.courses!.id] || 0) * (1 - b.discount_percentage / 100);
      return pa - pb;
    })[0] : null);
    if (!row) return null;
    const price = prices[row.courses!.id] || 0;
    if (!price) return null;
    return price * (1 - row.discount_percentage / 100);
  }, [rows, prices]);
  const reveal = (id: string) => { setPicked((p) => (p.includes(id) ? p : [...p, id])); document.getElementById(`deal-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); };

  useEffect(() => { document.title = "بلک فرایدی | آکادمی رفیعی"; }, []);

  return (
    <MainLayout>
      <div dir="rtl">
        {/* Hero */}
        <section className="px-3 pt-4 md:px-4 md:pt-10">
          <div className="container mx-auto">
            <div className="relative overflow-hidden rounded-[2rem] bg-foreground px-5 py-14 md:rounded-[2.5rem] text-center md:px-12 md:py-24">
              <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(hsl(var(--background)) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
              <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-background/10 blur-3xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-background/20 px-4 py-1.5 text-xs text-background/70">
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-background animate-pulse" : "bg-background/40"}`} />
                  {isActive ? "کمپین فعال است" : notStarted ? "به‌زودی" : "کمپین به پایان رسید"}
                </span>
                <h1 className="mt-8 text-[3.2rem] font-black leading-[0.9] tracking-tight text-background sm:text-8xl md:text-[9rem]" dir="ltr">
                  BLACK<br />FRIDAY
                </h1>
                <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-background/70 md:text-lg">
                  بزرگ‌ترین تخفیف سال روی دوره‌های آکادمی و سرویس‌های گروه رفیعی
                  {maxOff > 0 && <> — تا <b className="text-background">{fa(maxOff)}٪</b></>}
                </p>
                {isActive && (totalSave > 0 || startCoursePrice !== null) && (
                  <p className="mx-auto mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm font-bold text-background">
                    <Flame className="h-4 w-4" />
                    {totalSave > 0 && <span>تا {short(totalSave)} تومان سود</span>}
                    {totalSave > 0 && startCoursePrice !== null && <span aria-hidden>—</span>}
                    {startCoursePrice !== null && <span>شروع از {short(startCoursePrice)} تومان</span>}
                  </p>
                )}
                {isActive && !t.done && (
                  <div className="mx-auto mt-12 flex max-w-2xl items-start justify-center gap-4 sm:gap-10">
                    <CountBlock v={t.days} l="روز" /><CountBlock v={t.hours} l="ساعت" /><CountBlock v={t.minutes} l="دقیقه" /><CountBlock v={t.seconds} l="ثانیه" />
                  </div>
                )}
                <a href="#courses" className="mt-12 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-bold text-foreground transition-transform hover:scale-[1.03]">
                  مشاهده تخفیف‌ها <ArrowLeft className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="relative my-8 h-32 overflow-hidden">
          <div className="absolute inset-x-[-5%] top-3 -rotate-3"><Tape text={`BLACK FRIDAY · ${maxOff ? `UP TO ${maxOff}% OFF` : "SALE"}`} /></div>
          <div className="absolute inset-x-[-5%] top-[4.5rem] rotate-2"><Tape invert text="تخفیف بزرگ سال · فقط چند روز" /></div>
        </div>

        {/* Courses */}
        <section id="courses" className="scroll-mt-28 px-3 py-14 md:px-4 md:py-24">
          <div className="container mx-auto">
            <SectionHead ghost="SALE" eyebrow="دوره‌های آکادمی" title="دوره‌های تخفیف‌خورده" sub={startingInstallment !== null ? "قیمت‌ها فقط تا پایان کمپین؛ در دوره‌های واجد شرایط می‌توانی قسطی شروع کنی." : "قیمت‌های ویژه فقط تا پایان کمپین."} />
            {!isActive ? (
              <p className="rounded-3xl border border-border p-10 text-center text-muted-foreground">
                {notStarted ? "قیمت‌های ویژه با شروع کمپین نمایش داده می‌شوند." : "این کمپین به پایان رسیده است."}
              </p>
            ) : rows.length === 0 ? (
              <p className="rounded-3xl border border-border p-10 text-center text-muted-foreground">به‌زودی…</p>
            ) : (
              <>
                <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"><Plus className="h-4 w-4" /> روی + هر دوره بزن تا سودت و مبلغ شروعِ دوره‌های واجد شرایط را یکجا ببینی</p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                  {rows.map((r) => <CourseTile key={r.courses!.id} row={r} picked={picked.includes(r.courses!.id)} onPrice={onPrice} gateways={installmentGateways}
                    onPick={() => setPicked((p) => p.includes(r.courses!.id) ? p.filter((x) => x !== r.courses!.id) : [...p, r.courses!.id])} />)}
                </div>
              </>
            )}
          </div>
        </section>

        {isActive && services.length > 0 && <Tape text="RAFIEI GROUP · BLACK FRIDAY · LIMITED TIME" />}
        {/* Group services */}
        {isActive && services.length > 0 && (
          <section className="px-3 pb-28 pt-14 md:px-4 md:pt-20">
            <div className="container mx-auto">
              <SectionHead ghost="OFF" eyebrow="اکوسیستم رفیعی" title="تخفیف سرویس‌های گروه رفیعی" sub="کد تخفیف رو کپی کن و توی سرویس مورد نظرت استفاده کن." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
                {services.map((s) => <ServiceTile key={s.id} s={s} />)}
              </div>
            </div>
          </section>
        )}
        {picked.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] animate-in slide-in-from-bottom-4">
            <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-[1.75rem] bg-foreground p-3 pr-5 text-background shadow-float">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-background/60">{fa(picked.length)} دوره · سود تو</div>
                <div className="truncate text-xl font-black tabular-nums md:text-2xl">{fa(calc.save)} <span className="text-xs font-medium text-background/60">تومان</span></div>
              </div>
              <div className="border-r border-background/15 pr-3 text-left">
                {calc.installmentCourses > 0 ? (
                  <>
                    <div className="text-[11px] text-background/60">قسط اول · {fa(calc.installmentCourses)} دوره واجد شرایط</div>
                    <div className="text-base font-bold">{short(calc.installmentFirst)}</div>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] text-background/60">جمع پرداخت نقدی</div>
                    <div className="text-base font-bold">{short(calc.fin)}</div>
                  </>
                )}
              </div>
              <button onClick={() => setPicked([])} aria-label="پاک کردن انتخاب‌ها" className="rounded-full border border-background/25 px-3 py-2 text-xs text-background/80">پاک</button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BlackFridayLanding;
