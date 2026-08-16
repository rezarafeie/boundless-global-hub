// Client-side mirror of the adaptive webinar followup scheduler (used for admin preview).

const TEHRAN_OFFSET_MIN = 210; // UTC+3:30

export interface AdaptiveFollowupLike {
  id: string;
  name: string;
  priority?: number | null;
  min_interval_minutes?: number | null;
  final_lead_minutes?: number | null;
  quiet_hours_start?: number | null;
  quiet_hours_end?: number | null;
}

function tehranHour(d: Date) {
  return new Date(d.getTime() + TEHRAN_OFFSET_MIN * 60000).getUTCHours();
}

export function applyQuietHours(d: Date, start?: number | null, end?: number | null): Date {
  if (start == null || end == null || start === end) return d;
  let out = new Date(d.getTime());
  for (let i = 0; i < 48; i++) {
    const h = tehranHour(out);
    const inQuiet = start < end ? h >= start && h < end : h >= start || h < end;
    if (!inQuiet) return out;
    out = new Date(out.getTime() + 60 * 60000);
  }
  return out;
}

export interface AdaptiveSlot { id: string; name: string; at: Date }

export function adaptiveSchedule(
  remaining: AdaptiveFollowupLike[],
  webinarStart: string | Date | null | undefined,
  anchor: Date,
): AdaptiveSlot[] {
  if (!remaining.length || !webinarStart) return [];
  const startTs = anchor.getTime();
  const leadMin = Math.max(0, ...remaining.map((f) => f.final_lead_minutes ?? 15));
  const endTs = new Date(webinarStart).getTime() - leadMin * 60000;
  const availableMin = (endTs - startTs) / 60000;
  if (availableMin <= 0) return [];

  const minInterval = Math.max(1, ...remaining.map((f) => f.min_interval_minutes ?? 30));
  const n = remaining.length;
  const step = availableMin / n;

  let selected = remaining;
  let slots: number[] = [];

  if (step >= minInterval) {
    slots = remaining.map((_, i) => (n === 1 ? startTs : startTs + step * i * 60000));
  } else {
    const capacity = Math.max(1, Math.min(n, Math.floor(availableMin / minInterval) + 1));
    const byPriority = remaining
      .map((f, i) => ({ f, i }))
      .sort((a, b) => ((a.f.priority ?? 100) - (b.f.priority ?? 100)) || a.i - b.i)
      .slice(0, capacity)
      .sort((a, b) => a.i - b.i);
    selected = byPriority.map((x) => x.f);
    const k = selected.length;
    slots = selected.map((_, i) => endTs - (k - 1 - i) * minInterval * 60000);
  }

  return selected.map((f, i) => {
    let at = applyQuietHours(new Date(slots[i]), f.quiet_hours_start, f.quiet_hours_end);
    if (at.getTime() > endTs) at = new Date(endTs);
    return { id: f.id, name: f.name, at };
  });
}

export function formatTehran(d: Date) {
  return d.toLocaleString('fa-IR', {
    timeZone: 'Asia/Tehran',
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}
