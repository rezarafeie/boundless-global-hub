import React from 'react';
import type { Question } from '@/data/smartTestV2/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Check, BriefcaseBusiness, Clock3, Coins, Heart, Languages, MonitorSmartphone,
  PackageSearch, Rocket, ShieldAlert, Sparkles, Target, Wrench,
} from 'lucide-react';

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

  const Icon = ({ index }: { index: number }) => {
    const icons = question.id === 'q7_scenario'
      ? [PackageSearch, BriefcaseBusiness, Sparkles, Wrench, Rocket]
      : question.id === 'q1_stage' ? [Target, BriefcaseBusiness, Wrench, Rocket, ShieldAlert]
        : question.id === 'q2_time' ? [Clock3, Clock3, Clock3, Clock3]
          : question.id === 'q3_capital' ? [Coins, Coins, Coins, Coins, Coins]
            : question.id === 'q10_english' ? [Languages, Languages, Languages, Languages]
              : question.id === 'q11_tech' ? [MonitorSmartphone, MonitorSmartphone, MonitorSmartphone, MonitorSmartphone]
                : question.id === 'q15_notification' ? [PackageSearch, BriefcaseBusiness, Sparkles, Wrench, Rocket]
                  : [Heart, Sparkles, Target, Wrench, BriefcaseBusiness];
    const C = icons[index % icons.length];
    return <C className="w-5 h-5" />;
  };

  const isScenario = question.id === 'q7_scenario' || question.id === 'q15_notification';
  const isCompactGrid = ['q1_stage', 'q4_interest', 'q6_skills', 'q13_goal', 'q14_tradeoff'].includes(question.id);

  return (
    <section dir="rtl" className="space-y-6 animate-fade-in">
      <header className="space-y-2.5">
        <span className="text-xs font-bold text-primary">{question.kind === 'multi' ? 'چند انتخاب ممکنه درست باشه' : isScenario ? 'خودت رو در این موقعیت بذار' : 'بدون زیاد فکر کردن جواب بده'}</span>
        <h2 className="text-xl sm:text-2xl font-black leading-9">{question.title}</h2>
        {question.hint && <p className="text-sm text-muted-foreground leading-7">{question.hint}</p>}
      </header>
      <div className={cn('grid gap-3', isCompactGrid && 'sm:grid-cols-2', isScenario && 'sm:grid-cols-2')}>
        {question.options.map((o) => {
          const active = selected.includes(o.value);
          const index = question.options.indexOf(o);
          return (
            <Button
              key={o.value}
              type="button"
              variant="outline"
              onClick={() => toggle(o.value)}
              className={cn(
                'relative w-full h-auto min-h-[72px] justify-start whitespace-normal text-right rounded-lg p-4 transition-all duration-200',
                'hover:border-primary active:scale-[0.99]',
                isScenario && 'sm:min-h-[190px] sm:flex-col sm:items-start sm:justify-between sm:p-5',
                active ? 'border-primary bg-primary/10 ring-1 ring-primary text-foreground' : 'border-border bg-background text-foreground',
              )}
            >
              <span className={cn('w-10 h-10 shrink-0 rounded-md flex items-center justify-center', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                <Icon index={index} />
              </span>
              <span className={cn('flex-1 text-sm sm:text-base leading-relaxed', isScenario && 'sm:flex-none sm:min-h-[76px]')}>{o.label}</span>
              <span
                className={cn(
                  'shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-auto',
                  active ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30',
                )}
              >
                {active && <Check className="w-3.5 h-3.5" />}
              </span>
            </Button>
          );
        })}
      </div>
      {question.kind === 'multi' && question.maxSelect && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{selected.length}</span>
          <span>از {question.maxSelect} انتخاب</span>
          <div className="flex gap-1">
            {Array.from({ length: question.maxSelect }).map((_, index) => (
              <span key={index} className={cn('w-7 h-1 rounded-full', index < selected.length ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default QuestionStep;
