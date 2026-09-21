import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Timer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  submissionId: string | null;
  onOpenCourse: () => void;
}

type Offer = { code: string; valid_until: string; percentage: number; savings: number; price: number };

const fmt = (value: number) => String(value).padStart(2, '0');

/** One-time discount for the Boundless course, with a real deadline from the issued code. */
const BoundlessOffer: React.FC<Props> = ({ submissionId, onOpenCourse }) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    let active = true;
    supabase.functions
      .invoke('generate-boundless-discount', { body: { submissionId, source: 'smart_test_v2' } })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && (data as any)?.code) setOffer(data as Offer);
        setLoading(false);
      });
    return () => { active = false; };
  }, [submissionId]);

  useEffect(() => {
    if (!offer) return;
    const tick = () => setLeft(Math.max(0, new Date(offer.valid_until).getTime() - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [offer]);

  if (loading) {
    return <div className="rounded-xl border border-border p-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> در حال ساخت کد اختصاصی تو...</div>;
  }
  if (!offer || left <= 0) return null;

  const hours = Math.floor(left / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);

  return (
    <div dir="rtl" className="rounded-xl border border-primary/40 bg-primary/5 p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-black">کد {offer.percentage}٪ تخفیف دوره بدون مرز — فقط برای تو</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary tabular-nums" dir="ltr">
          <Timer className="w-4 h-4" /> {fmt(hours)}:{fmt(minutes)}:{fmt(seconds)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <code className="px-4 py-2.5 rounded-lg bg-background border border-border font-black tracking-widest" dir="ltr">{offer.code}</code>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { navigator.clipboard.writeText(offer.code); toast.success('کد کپی شد'); }}
        >
          <Copy className="w-3.5 h-3.5 ml-1" /> کپی کد
        </Button>
        <Button size="sm" onClick={onOpenCourse}>مشاهده دوره بدون مرز</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        این کد یک‌بار مصرفه و بعد از پایان شمارش معکوس غیرفعال می‌شه. تخفیف روی دوره بدون مرز اعمال می‌شه.
      </p>
    </div>
  );
};

export default BoundlessOffer;
