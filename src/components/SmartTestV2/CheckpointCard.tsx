import React from 'react';
import { Sparkles, TriangleAlert, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CheckpointInsight } from '@/lib/smartTestV2/ai';

interface Props {
  state: 'loading' | 'ready' | 'failed';
  insight: CheckpointInsight | null;
  fallback: string;
  onRetry: () => void;
}

/** Live AI observation during the test. Never labelled as AI unless it really came from the model. */
const CheckpointCard: React.FC<Props> = ({ state, insight, fallback, onRetry }) => {
  const conflict = insight?.tone === 'conflict';

  return (
    <section dir="rtl" className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-xs font-bold">
        {state === 'ready' ? (
          <>
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary">تحلیل زنده جواب‌های تو</span>
          </>
        ) : state === 'failed' ? (
          <span className="text-muted-foreground">تحلیل اولیه</span>
        ) : (
          <span className="text-muted-foreground">در حال خوندن جواب‌هات...</span>
        )}
      </div>

      <div className={cn('rounded-xl border p-5 sm:p-6', conflict ? 'border-primary/40 bg-primary/5' : 'border-border bg-card')}>
        {state === 'loading' ? (
          <div className="space-y-3" aria-label="در حال تحلیل">
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        ) : state === 'ready' && insight ? (
          <>
            <div className="flex items-start gap-3">
              {conflict ? <TriangleAlert className="w-5 h-5 text-primary shrink-0 mt-1" /> : <Check className="w-5 h-5 text-primary shrink-0 mt-1" />}
              <p className="text-base sm:text-lg font-semibold leading-8">{insight.observation}</p>
            </div>
            {insight.evidence?.length > 0 && (
              <p className="mt-4 pt-4 border-t border-border/70 text-xs text-muted-foreground">
                بر اساس جواب‌های خودت به: {insight.evidence.slice(0, 4).join('، ')}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-base leading-8">{fallback}</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">تحلیل شخصی این مرحله کامل نشد.</span>
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RotateCcw className="w-3.5 h-3.5 ml-1" /> تلاش مجدد
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CheckpointCard;
