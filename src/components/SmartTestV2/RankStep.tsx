import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  hint?: string;
  items: string[]; // option values selected in q4
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

const RankStep: React.FC<Props> = ({ title, hint, items, value, onChange }) => {
  const labels = QUESTION_BY_ID['q4_interest'].options;
  const labelOf = (v: string) => labels.find((o) => o.value === v)?.label || v;
  const [order, setOrder] = useState<string[]>(value && value.length ? value : items);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    onChange(order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
  };

  return (
    <section dir="rtl" className="space-y-8 animate-fade-in">
      <div className="space-y-3 max-w-3xl">
        <span className="text-xs font-bold text-primary">اولویت‌ها همیشه از علاقه مهم‌ترن</span>
        <h2 className="text-2xl sm:text-4xl font-black leading-[1.55]">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="space-y-2 max-w-3xl">
        {order.map((v, i) => (
          <div
            key={v}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }}
            className="group flex items-center gap-3 border-b border-border bg-background px-1 py-4 min-h-[68px] transition-colors hover:bg-muted/40"
          >
            <span className="w-9 h-9 shrink-0 bg-foreground text-background text-sm font-black flex items-center justify-center">
              {i + 1}
            </span>
            <span className="flex-1 text-sm sm:text-base leading-relaxed">{labelOf(v)}</span>
            <div className="flex flex-col gap-1">
              <Button type="button" variant="ghost" size="icon" aria-label="بالا" onClick={() => move(i, i - 1)} className="w-7 h-7">
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="پایین" onClick={() => move(i, i + 1)} className="w-7 h-7">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <GripVertical className="w-4 h-4 text-muted-foreground/50 hidden sm:block" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RankStep;
