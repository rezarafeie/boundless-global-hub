/**
 * Local-first webinar entry.
 *
 * The entry form must NEVER block on Supabase: the viewer is admitted from a
 * local JSON record (localStorage) instantly. Entries are queued locally and
 * pushed to the backend by a background sync that runs immediately and then
 * every 5 minutes until the webinar ends.
 */

import { supabase } from '@/integrations/supabase/client';
import { writeCachedParticipant, readCachedParticipant } from '@/lib/webinarCache';

const QUEUE_KEY = 'webinar_entry_queue_v1';
export const WEBINAR_ENTRY_SYNC_MS = 5 * 60 * 1000;

export interface QueuedEntry {
  local_id: string;
  webinar_id: string;
  webinar_slug: string;
  webinar_title: string;
  webinar_start_date: string;
  phone: string;
  display_name: string | null;
  entered_at: string;
  synced: boolean;
}

export interface LocalParticipant {
  id: string;
  webinar_id: string;
  phone: string;
  display_name: string | null;
  joined_at: string;
  interactions_completed: number;
  is_active_badge: boolean;
}

export function normalizeWebinarPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return '+' + cleaned.substring(2);
  if (cleaned.startsWith('0')) return '+98' + cleaned.substring(1);
  return '+' + cleaned;
}

function readQueue(): QueuedEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEntry[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueuedEntry[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
  } catch {
    /* non fatal */
  }
}

/**
 * Admit a viewer locally. No network call happens here — the returned
 * participant is usable immediately by the live page.
 */
export function enterWebinarLocally(params: {
  webinarId: string;
  webinarSlug: string;
  webinarTitle: string;
  webinarStartDate: string;
  phone: string;
  displayName?: string | null;
}): LocalParticipant {
  const phone = normalizeWebinarPhone(params.phone);
  const existing = readCachedParticipant<LocalParticipant>(params.webinarId);

  const participant: LocalParticipant = {
    id: existing?.phone === phone ? existing.id : crypto.randomUUID(),
    webinar_id: params.webinarId,
    phone,
    display_name: params.displayName || existing?.display_name || null,
    joined_at: existing?.joined_at || new Date().toISOString(),
    interactions_completed: existing?.interactions_completed ?? 0,
    is_active_badge: existing?.is_active_badge ?? false,
  };

  localStorage.setItem(`webinar_phone_${params.webinarId}`, phone);
  writeCachedParticipant(params.webinarId, participant);

  const queue = readQueue().filter(
    e => !(e.webinar_id === params.webinarId && e.phone === phone),
  );
  queue.push({
    local_id: participant.id,
    webinar_id: params.webinarId,
    webinar_slug: params.webinarSlug,
    webinar_title: params.webinarTitle,
    webinar_start_date: params.webinarStartDate,
    phone,
    display_name: participant.display_name,
    entered_at: participant.joined_at,
    synced: false,
  });
  writeQueue(queue);

  // Best-effort immediate push, never awaited by the UI.
  void syncWebinarEntries();

  return participant;
}

async function pushEntry(entry: QueuedEntry): Promise<boolean> {
  // 1) unified participants table (client-generated id keeps local refs valid)
  const { data: participant, error } = await supabase
    .from('webinar_participants')
    .upsert(
      {
        id: entry.local_id,
        webinar_id: entry.webinar_id,
        phone: entry.phone,
        display_name: entry.display_name,
      },
      { onConflict: 'webinar_id,phone' },
    )
    .select()
    .maybeSingle();

  if (error) return false;

  // The row may already have existed with a different id — adopt the server id.
  if (participant) {
    const cached = readCachedParticipant<LocalParticipant>(entry.webinar_id);
    if (cached && cached.phone === entry.phone && cached.id !== participant.id) {
      writeCachedParticipant(entry.webinar_id, { ...cached, ...participant });
    }
  }

  // 2) legacy signup tracking (non blocking for success)
  try {
    const { data: existingSignup } = await supabase
      .from('webinar_signups')
      .select('id')
      .eq('webinar_id', entry.webinar_id)
      .eq('mobile_number', entry.phone)
      .maybeSingle();

    if (!existingSignup) {
      await supabase
        .from('webinar_signups')
        .insert([{ webinar_id: entry.webinar_id, mobile_number: entry.phone }]);
    }
  } catch {
    /* ignore */
  }

  // 3) external webhook (best effort)
  try {
    await fetch('https://hook.us1.make.com/v8w9f6i37sca42qt1g1mwng1dt1xh616', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webinar_title: entry.webinar_title,
        webinar_id: entry.webinar_id,
        webinar_slug: entry.webinar_slug,
        webinar_start_date: entry.webinar_start_date,
        mobile_number: entry.phone,
        login_time: entry.entered_at,
        event_type: 'webinar_login',
      }),
    });
  } catch {
    /* ignore */
  }

  return true;
}

let syncing = false;

/** Flush every pending local entry to Supabase. Failures stay queued. */
export async function syncWebinarEntries(): Promise<void> {
  if (syncing) return;
  const pending = readQueue().filter(e => !e.synced);
  if (pending.length === 0) return;

  syncing = true;
  try {
    const done = new Set<string>();
    for (const entry of pending) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await pushEntry(entry).catch(() => false);
      if (ok) done.add(`${entry.webinar_id}|${entry.phone}`);
    }
    if (done.size) {
      writeQueue(readQueue().filter(e => !done.has(`${e.webinar_id}|${e.phone}`)));
    }
  } finally {
    syncing = false;
  }
}

/**
 * Sync entered users every 5 minutes until the webinar ends.
 * `isEnded` is re-evaluated on each tick so the loop stops by itself.
 */
export function startWebinarEntrySync(isEnded: () => boolean): () => void {
  void syncWebinarEntries();

  const timer = window.setInterval(() => {
    if (isEnded()) {
      window.clearInterval(timer);
      return;
    }
    void syncWebinarEntries();
  }, WEBINAR_ENTRY_SYNC_MS);

  const onOnline = () => void syncWebinarEntries();
  window.addEventListener('online', onOnline);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener('online', onOnline);
  };
}
