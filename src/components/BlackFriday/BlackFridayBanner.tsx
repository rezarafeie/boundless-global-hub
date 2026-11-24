import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface BlackFridayBannerProps {
  endDate: string;
}

const fa = (n: number) => new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2 }).format(n);

/** Slim, monochrome site-wide Black Friday strip. */
const BlackFridayBanner: React.FC<BlackFridayBannerProps> = ({ endDate }) => {
  const t = useCountdown(endDate);
  if (t.done) return null;
  return (
    <a
      href="/blackfriday"
      dir="rtl"
      className="sticky top-16 z-40 block w-full bg-foreground text-background hover:opacity-95 transition-opacity"
    >
      <div className="container mx-auto px-4 h-10 flex items-center justify-center gap-3 text-xs sm:text-sm">
        <span className="font-black tracking-[0.2em]" dir="ltr">BLACK FRIDAY</span>
        <span className="hidden sm:inline opacity-40">|</span>
        <span className="hidden sm:inline opacity-80">تخفیف ویژه دوره‌ها</span>
        <span className="opacity-40">|</span>
        <span className="font-semibold tabular-nums" dir="ltr">
          {fa(t.days)}:{fa(t.hours)}:{fa(t.minutes)}:{fa(t.seconds)}
        </span>
        <ArrowLeft className="h-3.5 w-3.5 opacity-70" />
      </div>
    </a>
  );
};

export default BlackFridayBanner;
