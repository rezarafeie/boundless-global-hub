import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Flame, Lock, Zap } from 'lucide-react';
import { GamStatus } from '@/hooks/useCourseGamification';
import { cn } from '@/lib/utils';

interface Props {
  status: GamStatus | null;
  onReactivate?: () => void;
  className?: string;
}

const fa = (n: number) => n.toLocaleString('fa-IR', { minimumIntegerDigits: 2, useGrouping: false });

const Unit: React.FC<{ value: number; label: string; urgent?: boolean }> = ({ value, label, urgent }) => (
  <div className="flex flex-col items-center">
    <span
      className={cn(
        'min-w-[2.5rem] rounded-lg px-2 py-1 text-lg font-black tabular-nums',
        urgent ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground',
      )}
    >
      {fa(value)}
    </span>
    <span className="mt-1 text-[10px] text-muted-foreground">{label}</span>
  </div>
);

/**
 * Top notification-style banner showing the live free-access countdown.
 * Rendered next to the other course notifications on the course access page.
 */
const CourseCountdownNotification: React.FC<Props> = ({ status, onReactivate, className }) => {
  if (!status?.enabled || !status.window) return null;

  const locked = status.locked || (status.remainingMs ?? 0) <= 0;

  if (locked) {
    return (
      <Alert dir="rtl" className={cn('border-destructive/40 bg-destructive/10', className)}>
        <Lock className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-destructive">دسترسی رایگان شما به پایان رسید 🔒</p>
            <p className="text-sm text-muted-foreground">
              پیشرفت شما ذخیره شده است. با تمدید دسترسی، دقیقاً از همان‌جا ادامه می‌دهید.
            </p>
          </div>
          {onReactivate && (
            <Button size="sm" variant="destructive" onClick={onReactivate} className="shrink-0">
              تمدید دسترسی
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const ms = status.remainingMs ?? 0;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const urgent = ms < 86400000;

  return (
    <Alert
      dir="rtl"
      className={cn(
        'relative overflow-hidden border-2',
        urgent ? 'border-destructive/50 bg-destructive/10' : 'border-primary/40 bg-primary/5',
        className,
      )}
    >
      <Clock className={cn('h-4 w-4', urgent ? 'text-destructive' : 'text-primary')} />
      <AlertDescription className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={urgent ? 'destructive' : 'default'} className="gap-1">
              <Zap className="h-3 w-3" />
              دسترسی رایگان محدود
            </Badge>
            {!!status.streak && (
              <Badge variant="outline" className="gap-1 text-orange-600">
                <Flame className="h-3 w-3" />
                {status.streak.toLocaleString('fa-IR')} روز پشت‌سرهم
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {Math.round(status.progressPercent ?? 0).toLocaleString('fa-IR')}٪ دوره را تمام کرده‌اید
            </span>
          </div>
          <p className={cn('text-sm font-bold', urgent ? 'text-destructive' : 'text-foreground')}>
            {urgent
              ? 'کمتر از یک روز تا بسته‌شدن دسترسی شما باقی مانده — همین الان یک درس جلو بروید!'
              : 'بعد از پایان این زمان، دسترسی شما بسته می‌شود؛ هر روز تعللی یعنی یک درس عقب‌ماندگی.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <Unit value={seconds} label="ثانیه" urgent={urgent} />
          <Unit value={minutes} label="دقیقه" urgent={urgent} />
          <Unit value={hours} label="ساعت" urgent={urgent} />
          <Unit value={days} label="روز" urgent={urgent} />
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default CourseCountdownNotification;
