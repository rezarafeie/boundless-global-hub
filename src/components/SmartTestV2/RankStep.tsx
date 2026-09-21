import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { QUESTION_BY_ID } from '@/data/smartTestV2/questions';

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
    <div dir="rtl" className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold leading-relaxed">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="space-y-3">
        {order.map((v, i) => (
          <div
            key={v}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 min-h-[56px]"
          >
            <span className="w-7 h-7 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="flex-1 text-sm sm:text-base leading-relaxed">{labelOf(v)}</span>
            <div className="flex flex-col gap-1">
              <button type="button" aria-label="بالا" onClick={() => move(i, i - 1)} className="p-1 rounded hover:bg-muted">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button type="button" aria-label="پایین" onClick={() => move(i, i + 1)} className="p-1 rounded hover:bg-muted">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <GripVertical className="w-4 h-4 text-muted-foreground/50 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankStep;
