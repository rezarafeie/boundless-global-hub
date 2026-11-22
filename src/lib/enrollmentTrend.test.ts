/// <reference types="node" />
import { it as test } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import { enrollmentInterval, enrollmentTrend } from './enrollmentTrend';

test('line chart follows chronological hourly bins and retains empty hours', () => {
  const interval = enrollmentInterval('day', new Date('2026-11-22T12:00:00Z'));
  const points = enrollmentTrend(['2026-11-21T12:00:00Z', '2026-11-21T12:30:00Z', '2026-11-21T14:15:00Z'], interval);
  strictEqual(points.length, 24);
  deepStrictEqual(points.slice(0, 3).map(p => p.count), [2, 0, 1]);
  strictEqual(points.reduce((sum, p) => sum + p.count, 0), 3);
  strictEqual(points[2].time - points[0].time, 7200000);
});
test('line chart excludes the end boundary exactly like the numeric list', () => {
  const interval = enrollmentInterval('hour', new Date('2026-11-22T12:00:00Z'));
  const points = enrollmentTrend(['2026-11-22T10:59:59Z', '2026-11-22T11:00:00Z', '2026-11-22T11:59:59Z', '2026-11-22T12:00:00Z'], interval);
  strictEqual(points.length, 12);
  strictEqual(points.reduce((sum, p) => sum + p.count, 0), 2);
});
test('week and month use daily points without capping registration totals', () => {
  for (const [period, length] of [['week', 7], ['month', 30]] as const) {
    const interval = enrollmentInterval(period, new Date('2026-11-22T12:00:00Z'));
    const points = enrollmentTrend(Array.from({ length: 1223 }, () => '2026-11-22T11:59:00Z'), interval);
    strictEqual(points.length, length);
    strictEqual(points.reduce((sum, p) => sum + p.count, 0), 1223);
  }
});