import React from 'react';
import { useBlackFridayContext } from '@/contexts/BlackFridayContext';
import { useCountdown } from '@/hooks/useCountdown';

interface CourseDiscountBannerProps {
  discount: number;
  courseName: string;
  originalPrice: number;
  courseSlug: string;
}

const fmt = (n: number) => new Intl.NumberFormat('fa-IR').format(Math.round(n));
const fa2 = (n: number) => new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2 }).format(n);

/** Minimal Black Friday price card for course landing pages. */
const CourseDiscountBanner: React.FC<CourseDiscountBannerProps> = ({ discount, courseName, originalPrice }) => {
  const { settings } = useBlackFridayContext();
  const t = useCountdown(settings?.end_date);
  const discounted = originalPrice * (1 - discount / 100);

  return (
    <div dir="rtl" className="rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-6 md:p-8 mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-black tracking-[0.2em]" dir="ltr">
            BLACK FRIDAY
          </span>
          <span className="text-sm text-muted-foreground">{courseName}</span>
        </div>
        {!t.done && (
          <span className="text-sm text-muted-foreground tabular-nums" dir="ltr">
            {fa2(t.days)}:{fa2(t.hours)}:{fa2(t.minutes)}:{fa2(t.seconds)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="text-4xl md:text-5xl font-black text-foreground">{fmt(discounted)}</span>
        <span className="text-base text-muted-foreground mb-1">تومان</span>
        {originalPrice > 0 && (
          <span className="text-sm text-muted-foreground line-through mb-1.5">{fmt(originalPrice)}</span>
        )}
        <span className="mr-auto px-3 py-1 rounded-full border border-foreground text-foreground text-sm font-bold">
          {fmt(discount)}٪ تخفیف
        </span>
      </div>
    </div>
  );
};

export default CourseDiscountBanner;
