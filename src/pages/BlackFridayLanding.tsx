import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft, Copy, Check } from "lucide-react";
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

const CourseTile = ({ row }: { row: DiscountRow }) => {
  const c = row.courses!;
  const [price, setPrice] = useState<number>(Number(c.price || 0));
  useEffect(() => { resolveLivePrice(c).then(setPrice).catch(() => {}); }, [c]);
  const final = price * (1 - row.discount_percentage / 100);
  return (
    <article className="group flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-float">
      <Link to={`/courses/${c.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-photo-shade">
        <img src={courseImage(c.slug, c.title)} alt={c.title} loading="lazy" className="h-full w-full object-cover grayscale-[30%] transition-transform duration-[1200ms] group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-photo-shade via-photo-shade/30 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-background px-3 py-1.5 text-sm font-black text-foreground">
          {fa(row.discount_percentage)}٪−
        </span>
        <h3 className="absolute inset-x-5 bottom-5 text-2xl font-extrabold leading-snug text-photo-ink">{c.title}</h3>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        {c.description && <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{c.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-5">
          {price > 0 ? (
            <div>
              <div className="text-xs text-muted-foreground line-through">{fa(price)} تومان</div>
              <div className="text-2xl font-black text-foreground">{fa(final)} <span className="text-sm font-normal text-muted-foreground">تومان</span></div>
            </div>
          ) : <span className="text-sm text-muted-foreground">{fa(row.discount_percentage)}٪ تخفیف</span>}
          <a href={`/enroll/?course=${c.slug}`} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90">
            ثبت‌نام <ArrowLeft className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
};

const ServiceTile = ({ s }: { s: Service }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col rounded-[2rem] border border-border bg-card/60 p-6 backdrop-blur-xl transition-colors hover:border-foreground/40">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-extrabold text-foreground">{s.title}</h3>
        <span className="shrink-0 rounded-full border border-foreground px-3 py-1 text-sm font-black text-foreground">{fa(s.discount_percentage)}٪−</span>
      </div>
      {s.description && <p className="mt-3 text-sm leading-7 text-muted-foreground">{s.description}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {s.discount_code && (
          <button
            onClick={() => { navigator.clipboard?.writeText(s.discount_code!); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-sm font-semibold text-foreground"
            dir="ltr"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {s.discount_code}
          </button>
        )}
        <a href={s.url} target="_blank" rel="noopener noreferrer" className="mr-auto inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background">
          مشاهده <ArrowUpLeft className="h-4 w-4" />
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                {rows.map((r) => <CourseTile key={r.courses!.id} row={r} />)}
              </div>
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
