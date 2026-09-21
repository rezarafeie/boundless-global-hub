import React from 'react';
import { STAGES } from '@/data/smartTestV2/questions';
import { cn } from '@/lib/utils';

interface Props {
  current: string;
  progress: number; // 0..1
}

const StageBar: React.FC<Props> = ({ current, progress }) => {
  const idx = Math.max(0, STAGES.findIndex((s) => s.id === current));
  return (
    <div className="w-full" dir="rtl">
      <div className="flex items-center justify-between gap-1 mb-2 overflow-x-auto no-scrollbar">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <span
              className={cn(
                'text-[11px] sm:text-xs whitespace-nowrap transition-colors',
                i < idx && 'text-muted-foreground',
                i === idx && 'text-primary font-bold',
                i > idx && 'text-muted-foreground/50',
              )}
            >
              {s.label}
            </span>
            {i < STAGES.length - 1 && <span className="text-muted-foreground/30 text-[10px]">←</span>}
          </div>
        ))}
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.round(Math.min(1, Math.max(0.03, progress)) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default StageBar;
