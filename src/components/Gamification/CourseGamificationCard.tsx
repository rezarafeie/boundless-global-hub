import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Zap, Clock, Gift, Lock, Target } from 'lucide-react';
import { GamStatus, formatRemaining, useLiveGamStatus } from '@/hooks/useCourseGamification';
import { gamText } from '@/lib/gamificationMessages';

interface Props {
  status: GamStatus | null;
  onOpenMission?: (lessonId: string, lessonNumber?: number | null) => void;
  onReactivate?: () => void;
}

const CourseGamificationCard: React.FC<Props> = ({ status: rawStatus, onOpenMission, onReactivate }) => {
  const status = useLiveGamStatus(rawStatus);
  if (!status?.enabled || !status.window) return null;
  const m = status.settings?.messages ?? {};
  const tvars = {
    percent: Math.round(status.progressPercent ?? 0),
    streak: status.streak ?? 0,
    price_usd: status.settings?.reactivation_price_usd,
    reactivation_days: status.settings?.reactivation_days,
  };

  return (
    <Card dir="rtl" className="border-primary/20">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <span className="flex items-center gap-1 text-orange-600">
            <Flame size={16} /> {status.streak ?? 0} روز استریک
          </span>
          <span className="flex items-center gap-1 text-primary">
            <Zap size={16} /> {Math.round(status.progressPercent ?? 0)}٪ تکمیل
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock size={16} />
            {status.locked ? 'پایان یافته' : `${formatRemaining(status.remainingMs)} باقی‌مانده`}
          </span>
        </div>

        <Progress value={status.progressPercent ?? 0} className="h-2" />

        {status.locked ? (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-destructive">
              <Lock size={15} /> {gamText(m, 'locked_title', tvars)}
            </div>
            <p className="text-muted-foreground">{gamText(m, 'locked_text', tvars)}</p>
            {onReactivate && (
              <Button size="sm" onClick={onReactivate} className="w-full">
                {gamText(m, 'reactivate_button', tvars)}
              </Button>
            )}
          </div>
        ) : status.mission ? (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target size={15} className="text-primary" /> {gamText(m, 'mission_current', tvars)}
            </div>
            <p className="text-sm">{status.mission.lesson_title}</p>
            <p className="text-xs text-muted-foreground">
              مهلت: {formatRemaining(status.mission.remainingMs)} دیگر
            </p>
            {onOpenMission && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onOpenMission(status.mission!.lesson_id, status.mission!.lesson_number)}
              >
                شروع ماموریت
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            {gamText(m, 'all_missions_done', tvars)}
          </div>
        )}

        {!!status.rewards?.length && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Gift size={15} className="text-primary" /> جوایز
            </div>
            <div className="space-y-2">
              {status.rewards.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-start justify-between gap-2 rounded-lg border p-2 text-xs ${
                    r.unlocked ? 'border-primary/40 bg-primary/5' : 'opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-medium">
                      {r.emoji ?? '🎁'} {r.title}
                    </div>
                    {r.description && <div className="text-muted-foreground">{r.description}</div>}
                  </div>
                  <Badge variant={r.unlocked ? 'default' : 'secondary'} className="shrink-0">
                    {r.unlocked ? 'باز شد' : `تا ${r.within_days} روز`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseGamificationCard;
