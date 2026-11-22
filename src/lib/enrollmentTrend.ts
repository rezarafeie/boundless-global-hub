export type EnrollmentPeriod = 'hour' | 'day' | 'week' | 'month';
export type EnrollmentTrendPoint = { time: number; count: number };
const durations: Record<EnrollmentPeriod, number> = { hour: 3600000, day: 86400000, week: 604800000, month: 2592000000 };
const steps: Record<EnrollmentPeriod, number> = { hour: 300000, day: 3600000, week: 86400000, month: 86400000 };

export function enrollmentInterval(period: EnrollmentPeriod, now = new Date()) {
  return { from: now.getTime() - durations[period], to: now.getTime(), step: steps[period] };
}

export function enrollmentTrend(timestamps: string[], interval: { from: number; to: number; step: number }): EnrollmentTrendPoint[] {
  const points = Array.from({ length: Math.ceil((interval.to - interval.from) / interval.step) }, (_, i) => ({ time: interval.from + i * interval.step, count: 0 }));
  for (const timestamp of timestamps) {
    const time = Date.parse(timestamp);
    if (!Number.isFinite(time) || time < interval.from || time >= interval.to) continue;
    const point = points[Math.floor((time - interval.from) / interval.step)];
    if (point) point.count++;
  }
  return points;
}