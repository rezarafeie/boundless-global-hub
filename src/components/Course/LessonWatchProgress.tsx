import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface LessonWatchProgressProps {
  secondsRef: React.MutableRefObject<number>;
  requiredRef: React.MutableRefObject<number>;
  completed: boolean;
}

/**
 * Ticks locally (so the lesson page and video never re-render) and shows how much
 * of the lesson watch time is needed before it counts as completed automatically.
 */
const LessonWatchProgress: React.FC<LessonWatchProgressProps> = ({ secondsRef, requiredRef, completed }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (completed) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [completed]);

  if (completed) return null;

  const required = Math.max(requiredRef.current, 1);
  const watched = Math.min(secondsRef.current, required);
  const percent = Math.round((watched / required) * 100);
  const remaining = Math.max(0, Math.ceil((required - watched) / 60));

  return (
    <div className="space-y-2 text-right">
      <Progress value={percent} className="h-1.5" />
      <p className="text-xs text-muted-foreground">
        {remaining > 0
          ? `با ${remaining} دقیقه تماشای دیگر، این درس به‌صورت خودکار تکمیل می‌شود`
          : 'در حال ثبت تکمیل خودکار این درس...'}
      </p>
    </div>
  );
};

export default LessonWatchProgress;
