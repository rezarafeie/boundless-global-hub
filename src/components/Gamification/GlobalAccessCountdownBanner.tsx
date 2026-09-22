import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GamStatus, useLiveGamStatus } from '@/hooks/useCourseGamification';
import { gamText } from '@/lib/gamificationMessages';
import { cn } from '@/lib/utils';

const fa = (n: number) => n.toLocaleString('fa-IR', { minimumIntegerDigits: 2, useGrouping: false });

/**
 * Fixed top banner (site-wide) showing the live countdown of the user's free course access.
 * Only fetches once per mount; the per-second ticking stays inside this component.
 */
interface Props {
  className?: string;
}

const GlobalAccessCountdownBanner: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  const [raw, setRaw] = useState<GamStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const status = useLiveGamStatus(raw);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setRaw(null);
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('course-access-status', {
          body: { userId: user.id, email: user.email },
        });
        if (error) throw error;
        if (!cancelled) setRaw({ ...(data as GamStatus), fetchedAt: Date.now() });
      } catch {
        if (!cancelled) setRaw(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (dismissed || !status?.enabled || !status.window || status.completed || (status.progressPercent ?? 0) >= 100) return null;

  const remaining = status.remainingMs ?? 0;
  const locked = status.locked || remaining <= 0;
  const m = status.settings?.messages ?? {};
  const courseSlug = (status as any).course?.slug as string | undefined;
  const href = courseSlug ? `/course-access?course=${courseSlug}` : "/dashboard";

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const urgent = remaining > 0 && remaining < 24 * 60 * 60 * 1000;

  return (
    <div className={cn('sticky top-0 z-[60] w-full', className)} dir="rtl">
      <Link to={href} className="block">
        <div
          className={cn(
            'border-b transition-opacity hover:opacity-95',
            locked || urgent
              ? 'bg-destructive text-destructive-foreground border-destructive'
              : 'bg-primary text-primary-foreground border-primary',
          )}
        >
          <div className="container relative flex items-center justify-center gap-3 py-2 text-xs sm:text-sm">
            {locked ? <Lock className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
            {locked ? (
              <span className="font-bold">{gamText(m, 'locked_title')}</span>
            ) : (
              <>
                <span className="font-bold">
                  {(status as any).course?.title
                    ? `دسترسی رایگان «${(status as any).course.title}»`
                    : gamText(m, 'banner_title')}
                </span>
                <span className="font-black tabular-nums tracking-wider" dir="ltr">
                  {days > 0 ? `${fa(days)}:` : ''}
                  {fa(hours)}:{fa(minutes)}:{fa(seconds)}
                </span>
                <span className="hidden sm:inline opacity-90">تا پایان دسترسی — همین حالا ادامه بده</span>
              </>
            )}
            <button
              type="button"
              aria-label="بستن"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDismissed(true);
              }}
              className="absolute left-3 text-current/80 hover:text-current"
            >
              ✕
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default GlobalAccessCountdownBanner;
