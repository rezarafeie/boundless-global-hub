import React from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdaptiveQuestion } from '@/lib/smartTestV2/ai';

interface Props {
  question: AdaptiveQuestion;
  index: number;
  total: number;
  value: string | undefined;
  onChange: (value: string) => void;
}

/** Extra question generated only to resolve a real ambiguity between two close paths. */
const AdaptiveStep: React.FC<Props> = ({ question, index, total, value, onChange }) => (
  <section dir="rtl" className="space-y-6 animate-fade-in">
    <div className="space-y-3">
      <span className="inline-flex items-center gap-2 text-xs font-bold text-primary">
        <HelpCircle className="w-4 h-4" /> یک سؤال تکمیلی ({index + 1} از {total})
      </span>
      <h2 className="text-xl sm:text-2xl font-black leading-9">{question.question}</h2>
      {question.reason && <p className="text-sm text-muted-foreground leading-7">{question.reason}</p>}
    </div>
    <div className="grid gap-3">
      {question.options.map((option) => {
        const active = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            onClick={() => onChange(option.value)}
            className={cn(
              'w-full h-auto min-h-[60px] justify-start whitespace-normal text-right rounded-xl p-4',
              active ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border',
            )}
          >
            <span className="flex-1 text-sm sm:text-base leading-7">{option.label}</span>
            <span className={cn('shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mr-auto', active ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30')}>
              {active && <Check className="w-3 h-3" />}
            </span>
          </Button>
        );
      })}
    </div>
  </section>
);

export default AdaptiveStep;
