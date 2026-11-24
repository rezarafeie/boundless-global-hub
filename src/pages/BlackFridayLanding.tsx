import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft, Copy, Check, Plus, Gift, Sparkles, Flame, Calculator } from "lucide-react";
import { rafieiServices } from "@/data/rafieiServices";
import MainLayout from "@/components/Layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import { useCountdown } from "@/hooks/useCountdown";
import { courseImage } from "@/lib/academyImagery";
import { resolveLivePrice } from "@/lib/liveCoursePrice";

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(Math.round(n));
const fa2 = (n: number) => new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(n);

type DiscountRow = {
  discount_percentage: number;
  courses: { id: string; slug: string; title: string; description: string | null; price: number | null; use_dollar_price: boolean | null; usd_price: number | null; is_active: boolean | null } | null;
};
type Service = { id: string; title: string; description: string | null; url: string; discount_percentage: number; discount_code: string | null };

const CountBlock = ({ v, l }: { v: number; l: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-4xl sm:text-6xl md:text-7xl font-black tabular-nums leading-none text-background">{fa2(v)}</span>
    <span className="mt-2 text-[11px] sm:text-xs tracking-widest text-background/60">{l}</span>
  </div>
);

const INST = 4;
const short = (n: number) => n >= 1_000_000 ? `${fa(Math.round(n / 100_000) / 10)} میلیون` : `${fa(Math.round(n / 1000))} هزار`;

const useLivePrice = (c: NonNullable<DiscountRow["courses"]>) => {
  const [price, setPrice] = useState<number>(Number(c.price || 0));
  useEffect(() => { resolveLivePrice(c).then(setPrice).catch(() => {}); }, [c]);
  return price;
};

const CourseTile = ({ row, picked, onPick, onPrice }: { row: DiscountRow; picked: boolean; onPick: () => void; onPrice: (id: string, p: number) => void }) => {
  const c = row.courses!;
  const price = useLivePrice(c);
  useEffect(() => { onPrice(c.id, price); }, [price]); // eslint-disable-line react-hooks/exhaustive-deps
  const final = price * (1 - row.discount_percentage / 100);
  const save = price - final;
  return (
    <article id={`deal-${c.id}`} className={`group flex flex-col overflow-hidden rounded-[2rem] border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-float ${picked ? "border-foreground ring-2 ring-foreground" : "border-border"}`}>
      <Link to={`/courses/${c.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-photo-shade">
        <img src={courseImage(c.slug, c.title)} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-photo-shade via-photo-shade/30 to-transparent" />
        <span className="absolute left-4 top-4 rounded-2xl bg-background px-3 py-2 text-center leading-none text-foreground shadow-float">
          <b className="block text-2xl font-black">{fa(row.discount_percentage)}٪</b><span className="text-[10px] font-bold">تخفیف</span>
        </span>
        <h3 className="absolute inset-x-5 bottom-4 text-xl font-extrabold leading-snug text-photo-ink md:text-2xl">{c.title}</h3>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5">
        {price > 0 ? (
          <>
            <div className="rounded-2xl bg-foreground p-4 text-background">
              <div className="text-xs text-background/60">شروع یادگیری فقط با</div>
              <div className="mt-1 text-3xl font-black">{short(final / INST)} <span className="text-sm font-medium text-background/70">تومان</span></div>
              <div className="mt-1 text-[11px] text-background/60">قسط اول از {fa(INST)} قسط مساوی {fa(final / INST)} تومانی</div>
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
    <div className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-[1.75rem] bg-foreground p-5 text-background transition-all duration-300 hover:-translate-y-1 hover:shadow-float md:p-6">
      <Icon className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-36 text-background/[0.06] transition-transform duration-700 group-hover:rotate-12" />
      <div className="relative flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-foreground"><Icon className="h-6 w-6" /></span>
        <span className="text-left leading-none"><b className="block text-3xl font-black">{fa(s.discount_percentage)}٪</b><span className="text-[10px] text-background/60">تخفیف</span></span>
      </div>
      <div className="relative mt-auto pt-6">
        {meta && <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-background/50" dir="ltr">{meta.en}</span>}
        <h3 className="mt-1 text-xl font-extrabold">{s.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-background/70">{s.description || meta?.description}</p>
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

/** Mini game: spin to reveal one real deal from the campaign. */
const LuckyBox = ({ rows, onReveal }: { rows: DiscountRow[]; onReveal: (id: string) => void }) => {
  const [spinning, setSpinning] = useState(false);
  const [idx, setIdx] = useState<number | null>(null);
  const [tries, setTries] = useState(() => Number(sessionStorage.getItem("bf_tries") || 3));
  const spin = () => {
    if (spinning || tries <= 0 || !rows.length) return;
    setSpinning(true);
    let n = 0; const total = 18 + Math.floor(Math.random() * rows.length);
    const tick = () => {
      setIdx(n % rows.length); n++;
      if (n <= total) setTimeout(tick, 60 + n * 6);
      else { setSpinning(false); const left = tries - 1; setTries(left); sessionStorage.setItem("bf_tries", String(left)); }
    };
    tick();
  };
  const r = idx !== null ? rows[idx] : null;
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Gift className="h-4 w-4" /> جعبه شانس بلک فرایدی</div>
      <h3 className="mt-2 text-2xl font-extrabold text-foreground">ببین شانست کدوم دوره‌ست</h3>
      <div className={`mt-6 flex min-h-[120px] items-center justify-center rounded-3xl bg-foreground p-6 text-center text-background transition-transform ${spinning ? "scale-[0.98]" : ""}`}>
        {r ? (
          <div>
            <div className="text-5xl font-black">{fa(r.discount_percentage)}٪</div>
            <div className="mt-2 text-sm font-bold text-background/80">{r.courses!.title}</div>
          </div>
        ) : <span className="text-background/60">دکمه رو بزن…</span>}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button onClick={spin} disabled={spinning || tries <= 0} className="flex-1 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-40">
          {spinning ? "در حال چرخش…" : tries > 0 ? `بچرخون (${fa(tries)} شانس)` : "شانس‌هات تموم شد"}
        </button>
        {r && !spinning && (
          <button onClick={() => onReveal(r.courses!.id)} className="rounded-full border border-foreground px-5 py-3 text-sm font-bold text-foreground">دیدن پیشنهاد</button>
        )}
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
        .select("discount_percentage, courses(id, slug, title, description, price, use_dollar_price, usd_price, is_active)")
        .order("discount_percentage", { ascending: false });
      if (error) throw error;
      return ((data || []) as unknown as DiscountRow[]).filter((r) => r.courses && r.courses.is_active !== false);
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
    let orig = 0, fin = 0;
    rows.forEach((r) => { const id = r.courses!.id; if (!picked.includes(id)) return; const p = prices[id] || 0; orig += p; fin += p * (1 - r.discount_percentage / 100); });
    return { orig, fin, save: orig - fin };
  }, [picked, prices, rows]);
  const totalSave = useMemo(() => rows.reduce((a, r) => a + (prices[r.courses!.id] || 0) * r.discount_percentage / 100, 0), [rows, prices]);
  const reveal = (id: string) => { setPicked((p) => (p.includes(id) ? p : [...p, id])); document.getElementById(`deal-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); };

  useEffect(() => { document.title = "بلک فرایدی | آکادمی رفیعی"; }, []);

  return (
    <MainLayout>
      <div dir="rtl">
        {/* Hero */}
        <section className="px-4 pt-6 md:pt-10">
          <div className="container mx-auto">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-16 text-center md:px-12 md:py-24">
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
                {isActive && totalSave > 0 && (
                  <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm font-bold text-background">
                    <Flame className="h-4 w-4" /> تا {short(totalSave)} تومان سود — شروع از {short(Math.min(...rows.filter((r) => (prices[r.courses!.id] || 0) > 0).map((r) => prices[r.courses!.id] * (1 - r.discount_percentage / 100) / INST)))} تومان
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

        {/* Courses */}
        <section id="courses" className="scroll-mt-28 px-4 py-16 md:py-24">
          <div className="container mx-auto">
            <div className="mb-10 md:mb-14">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">دوره‌های آکادمی</span>
              <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-5xl">دوره‌های تخفیف‌خورده</h2>
            </div>
            {!isActive ? (
              <p className="rounded-3xl border border-border p-10 text-center text-muted-foreground">
                {notStarted ? "قیمت‌های ویژه با شروع کمپین نمایش داده می‌شوند." : "این کمپین به پایان رسیده است."}
              </p>
            ) : rows.length === 0 ? (
              <p className="rounded-3xl border border-border p-10 text-center text-muted-foreground">به‌زودی…</p>
            ) : (
              <>
                <div className="mb-10 grid gap-6 md:grid-cols-2">
                  <LuckyBox rows={rows} onReveal={reveal} />
                  <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Calculator className="h-4 w-4" /> ماشین‌حساب سود</div>
                    <h3 className="mt-2 text-2xl font-extrabold text-foreground">دوره‌ها رو با + انتخاب کن</h3>
                    <div className="mt-6 rounded-3xl bg-foreground p-6 text-background">
                      <div className="text-xs text-background/60">سود تو از بلک فرایدی</div>
                      <div className="mt-1 text-4xl font-black tabular-nums">{fa(calc.save)} <span className="text-sm font-medium text-background/70">تومان</span></div>
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-background/15 pt-4 text-sm">
                        <div><div className="text-[11px] text-background/60">جمع نهایی</div><b>{fa(calc.fin)}</b></div>
                        <div><div className="text-[11px] text-background/60">هر قسط ({fa(INST)} قسط)</div><b>{fa(calc.fin / INST)}</b></div>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">{picked.length ? `${fa(picked.length)} دوره انتخاب شده` : "هنوز دوره‌ای انتخاب نکردی"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                  {rows.map((r) => <CourseTile key={r.courses!.id} row={r} picked={picked.includes(r.courses!.id)} onPrice={onPrice}
                    onPick={() => setPicked((p) => p.includes(r.courses!.id) ? p.filter((x) => x !== r.courses!.id) : [...p, r.courses!.id])} />)}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Group services */}
        {isActive && services.length > 0 && (
          <section className="px-4 pb-16 md:pb-24">
            <div className="container mx-auto">
              <div className="mb-10 md:mb-14">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground">گروه رفیعی</span>
                <h2 className="mt-3 text-3xl font-extrabold text-foreground md:text-5xl">سرویس‌های گروه رفیعی</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
                {services.map((s) => <ServiceTile key={s.id} s={s} />)}
              </div>
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default BlackFridayLanding;
