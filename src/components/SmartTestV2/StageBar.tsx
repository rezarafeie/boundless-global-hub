import React from 'react';
import { STAGES } from '@/data/smartTestV2/questions';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Props {
  current: string;
  progress: number; // 0..1
}

const StageBar: React.FC<Props> = ({ current, progress }) => {
  const idx = Math.max(0, STAGES.findIndex((s) => s.id === current));
  return (
    <div className="w-full" dir="rtl" aria-label="مراحل تحلیل">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 shrink-0">
            <span className={cn('w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold', i < idx && 'bg-primary border-primary text-primary-foreground', i === idx && 'border-primary text-primary', i > idx && 'border-border text-muted-foreground')}>
              {i < idx ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-[11px] sm:text-xs whitespace-nowrap transition-colors',
                i < idx && 'text-muted-foreground',
                i === idx && 'text-foreground font-bold',
                i > idx && 'text-muted-foreground/50',
              )}
            >
              {s.label}
            </span>
            {i < STAGES.length - 1 && <span className="w-5 h-px bg-border" />}
          </div>
        ))}
      </div>
      <div className="h-1 w-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.round(Math.min(1, Math.max(0.03, progress)) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default StageBar;
