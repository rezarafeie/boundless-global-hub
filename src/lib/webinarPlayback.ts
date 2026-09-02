/**
 * Automatic (timeline-based) interaction scheduling for webinar playback.
 *
 * During a replay we do NOT want the host to push cards manually again: each
 * interaction stores the offset (in seconds, relative to the start of the
 * session) at which it appeared during the original live run, plus how long it
 * stayed on screen. Every viewer then computes the currently visible card
 * locally from `playback_started_at + offset` — zero extra database writes, so
 * it scales to thousands of concurrent viewers.
 */

export const DEFAULT_AUTO_DURATION_SECONDS = 120;

export interface PlaybackInteraction {
  id: string;
  status: string;
  settings?: any;
  auto_offset_seconds?: number | null;
  auto_duration_seconds?: number | null;
  activated_at?: string | null;
  ended_at?: string | null;
}

export function interactionDuration(i: PlaybackInteraction): number {
  if (typeof i.auto_duration_seconds === 'number' && i.auto_duration_seconds > 0) {
    return i.auto_duration_seconds;
  }
  const timer = Number(i.settings?.timer_duration);
  if (Number.isFinite(timer) && timer > 0) return timer;
  return DEFAULT_AUTO_DURATION_SECONDS;
}

/** Seconds elapsed since playback started (0 when it has not started yet). */
export function playbackElapsedSeconds(playbackStartedAt: string | null | undefined, now = Date.now()): number {
  if (!playbackStartedAt) return 0;
  const start = new Date(playbackStartedAt).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now - start) / 1000));
}

/**
 * The card that should be on screen right now. When several windows overlap we
 * show the one that started most recently.
 */
export function resolveAutoInteraction<T extends PlaybackInteraction>(
  interactions: T[],
  playbackStartedAt: string | null | undefined,
  now = Date.now(),
): T | null {
  if (!playbackStartedAt) return null;
  const elapsed = playbackElapsedSeconds(playbackStartedAt, now);
  let best: T | null = null;
  let bestOffset = -1;
  for (const i of interactions) {
    const offset = i.auto_offset_seconds;
    if (typeof offset !== 'number' || offset < 0) continue;
    const end = offset + interactionDuration(i);
    if (elapsed >= offset && elapsed < end && offset >= bestOffset) {
      best = i;
      bestOffset = offset;
    }
  }
  return best;
}

/**
 * Rebuild the timeline from the previous live session: offsets are measured
 * from the first activated card.
 */
export function buildTimelineFromLive<T extends PlaybackInteraction>(
  interactions: T[],
): { id: string; auto_offset_seconds: number; auto_duration_seconds: number }[] {
  const activated = interactions.filter(i => !!i.activated_at);
  if (!activated.length) return [];
  const base = Math.min(...activated.map(i => new Date(i.activated_at as string).getTime()));
  return activated.map(i => {
    const start = new Date(i.activated_at as string).getTime();
    const end = i.ended_at ? new Date(i.ended_at).getTime() : start + DEFAULT_AUTO_DURATION_SECONDS * 1000;
    return {
      id: i.id,
      auto_offset_seconds: Math.max(0, Math.round((start - base) / 1000)),
      auto_duration_seconds: Math.max(10, Math.round((end - start) / 1000)),
    };
  });
}

export function formatOffset(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || seconds < 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Parses "mm:ss" / "hh:mm:ss" / plain seconds into seconds. */
export function parseOffset(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':').map(p => Number(p));
  if (parts.some(p => !Number.isFinite(p) || p < 0)) return null;
  if (parts.length === 1) return Math.round(parts[0]);
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return null;
}
