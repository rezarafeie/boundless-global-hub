import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { PROGRESS_LABELS } from '@/lib/challenge/schema';

const faNum = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString('fa-IR');

const MissionList: React.FC<{ title: string; items?: any[] }> = ({ title, items }) =>
  items && items.length ? (
    <div>
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{typeof item === 'string' ? item : item.title ?? JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

export type ChallengeMissionCardProps = {
  dayInfo: any;
  mission: any;
  isToday?: boolean;
  countdown?: React.ReactNode;
  statusLabel?: string;
  children?: React.ReactNode;
};

const ChallengeMissionCard: React.FC<ChallengeMissionCardProps> = ({
  dayInfo,
  mission,
  isToday = false,
  countdown,
  statusLabel,
  children,
}) => {
  const variant = mission?.variant;
  const label = statusLabel ?? PROGRESS_LABELS[mission?.status] ?? mission?.status;

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            {isToday ? 'ماموریت امروز' : `ماموریت روز ${faNum(mission?.day_number ?? dayInfo?.day_number)}`}
          </CardTitle>
          {label && <Badge variant="outline">{label}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">{dayInfo?.title}</h2>
          {dayInfo?.goal && <p className="mt-1 text-sm text-muted-foreground">🎯 {dayInfo.goal}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {dayInfo?.estimated_minutes && <Badge variant="secondary">⏱ {faNum(dayInfo.estimated_minutes)} دقیقه</Badge>}
            <Badge variant="secondary">⚡ {faNum(dayInfo?.xp)} امتیاز</Badge>
            {countdown && <Badge variant="secondary">⏰ {countdown}</Badge>}
          </div>
        </div>

        {variant && (
          <div className="space-y-4 rounded-lg bg-muted/50 p-4">
            {variant.instructions && <p className="whitespace-pre-line text-sm leading-7">{variant.instructions}</p>}
            <MissionList title="چک‌لیست" items={variant.checklist} />
            <MissionList title="نکته‌ها" items={variant.tips} />
            {variant.example && <div><p className="mb-1 text-sm font-semibold">مثال</p><p className="whitespace-pre-line text-sm text-muted-foreground">{variant.example}</p></div>}
            {variant.resources?.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-semibold">منابع</p>
                <ul className="space-y-1 text-sm">
                  {variant.resources.map((resource: any, index: number) => (
                    <li key={index}><a className="text-primary underline" href={resource.url} target="_blank" rel="noreferrer">{resource.title ?? resource.url}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {variant.expected_result && <p className="text-sm"><span className="font-semibold">نتیجه مورد انتظار: </span>{variant.expected_result}</p>}
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  );
};

export default ChallengeMissionCard;