import React from 'react';
import { Clock, Flame, Lock } from 'lucide-react';
import { GamStatus, formatRemaining, useLiveGamStatus } from '@/hooks/useCourseGamification';
import { cn } from '@/lib/utils';
import { gamText } from '@/lib/gamificationMessages';

interface Props {
  status: GamStatus | null;
  onReactivate?: () => void;
  className?: string;
}

const CourseAccessBar: React.FC<Props> = ({ status: rawStatus, onReactivate, className }) => {
  const status = useLiveGamStatus(rawStatus);
  if (!status?.enabled || !status.window) return null;

  const locked = status.locked;
  const m = status.settings?.messages ?? {};

  return (
    <div
      dir="rtl"
      className={cn(
        'sticky top-0 z-40 w-full border-b backdrop-blur',
        locked ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/10 border-primary/20',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-medium">
          {locked ? <Lock size={14} className="text-destructive" /> : <Clock size={14} className="text-primary" />}
          <span>
            {locked
              ? gamText(m, 'locked_title')
              : `${formatRemaining(status.remainingMs)} تا پایان دسترسی`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!!status.streak && (
            <span className="flex items-center gap-1 text-orange-600">
              <Flame size={13} /> {status.streak} روز
            </span>
          )}
          <span className="text-muted-foreground">{Math.round(status.progressPercent ?? 0)}٪</span>
          {locked && onReactivate && (
            <button
              onClick={onReactivate}
              className="rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground"
            >
              {gamText(m, 'reactivate_button')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseAccessBar;
