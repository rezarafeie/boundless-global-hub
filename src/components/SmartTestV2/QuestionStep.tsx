import React from 'react';
import type { Question } from '@/data/smartTestV2/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Props {
  question: Question;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  onAutoAdvance?: () => void;
}

const QuestionStep: React.FC<Props> = ({ question, value, onChange, onAutoAdvance }) => {
  const selected: string[] = value === undefined ? [] : Array.isArray(value) ? value : [value];

  const toggle = (optValue: string) => {
    const opt = question.options.find((o) => o.value === optValue);
    if (question.kind === 'single') {
      onChange(optValue);
      onAutoAdvance?.();
      return;
    }
    let next: string[];
    if (selected.includes(optValue)) {
      next = selected.filter((v) => v !== optValue);
    } else if (opt?.exclusive) {
      next = [optValue];
    } else {
      const cleaned = selected.filter((v) => !question.options.find((o) => o.value === v)?.exclusive);
      if (question.maxSelect && cleaned.length >= question.maxSelect) return;
      next = [...cleaned, optValue];
    }
    onChange(next);
  };

  return (
    <div dir="rtl" className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold leading-relaxed">{question.title}</h2>
        {question.hint && <p className="text-sm text-muted-foreground">{question.hint}</p>}
      </div>
      <div className="space-y-3">
        {question.options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={cn(
                'w-full text-right rounded-2xl border p-4 min-h-[56px] transition-all flex items-center justify-between gap-3',
                'hover:border-primary/60 active:scale-[0.99]',
                active ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card',
              )}
            >
              <span className="text-sm sm:text-base leading-relaxed">{o.label}</span>
              <span
                className={cn(
                  'shrink-0 w-6 h-6 rounded-full border flex items-center justify-center',
                  active ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30',
                )}
              >
                {active && <Check className="w-3.5 h-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionStep;
