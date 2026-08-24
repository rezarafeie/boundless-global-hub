import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Realtime Broadcast layer for webinars.
 *
 * Why: `postgres_changes` re-runs RLS authorization per subscriber per row.
 * At 500 concurrent viewers this saturates the Realtime workers and silently
 * drops events (measured ~86% loss). Broadcast is a plain pub/sub fan-out with
 * no per-row RLS evaluation, so it scales to thousands of subscribers.
 *
 * Database writes stay exactly the same — the writer simply also emits a
 * broadcast event on the shared webinar channel. Viewers listen to broadcast
 * only; light periodic refetches act as a safety net for missed events.
 */

export type WebinarBroadcastEvent =
  | 'chat'
  | 'chat_delete'
  | 'reaction'
  | 'interaction'
  | 'question'
  | 'response';

type Handler = (payload: any) => void;

export type WebinarConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

interface Entry {
  channel: RealtimeChannel;
  generation: number;
  refs: number;
  handlers: Map<WebinarBroadcastEvent, Set<Handler>>;
  joined: boolean;
  status: WebinarConnectionStatus;
  statusListeners: Set<(s: WebinarConnectionStatus) => void>;
  retries: number;
  retryTimer: number | null;
}


const registry = new Map<string, Entry>();

const EVENTS: WebinarBroadcastEvent[] = [
  'chat',
  'chat_delete',
  'reaction',
  'interaction',
  'question',
  'response',
];

function notifyStatus(webinarId: string, entry: Entry, status: WebinarConnectionStatus) {
  entry.status = status;
  entry.statusListeners.forEach(fn => {
    try {
      fn(status);
    } catch (e) {
      console.error('[webinarBroadcast] status listener error', e);
    }
  });
}

function bindChannel(webinarId: string, entry: Entry) {
  const generation = entry.generation + 1;
  entry.generation = generation;
  const channel = supabase.channel(`wb:${webinarId}`, {
    config: { broadcast: { self: false, ack: false } },
  });

  EVENTS.forEach(event => {
    channel.on('broadcast', { event }, ({ payload }) => {
      entry.handlers.get(event)?.forEach(fn => {
        try {
          fn(payload);
        } catch (e) {
          console.error('[webinarBroadcast] handler error', event, e);
        }
      });
    });
  });

  entry.channel = channel;
  entry.joined = false;

  channel.subscribe(status => {
    // removeChannel() also emits CLOSED. Ignore callbacks from a channel that
    // has already been replaced, otherwise an old channel can put a healthy
    // replacement into a permanent reconnect loop.
    if (entry.generation !== generation || entry.channel !== channel) return;
    if (status === 'SUBSCRIBED') {
      entry.joined = true;
      entry.retries = 0;
      if (entry.retryTimer) {
        window.clearTimeout(entry.retryTimer);
        entry.retryTimer = null;
      }
      notifyStatus(webinarId, entry, 'connected');
      return;
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      entry.joined = false;
      scheduleRejoin(webinarId, entry);
    }
  });
}

function scheduleRejoin(webinarId: string, entry: Entry) {
  if (entry.retryTimer || entry.refs <= 0) return;
  notifyStatus(webinarId, entry, 'reconnecting');

  const delay = Math.min(15000, 1000 * Math.pow(1.6, entry.retries)) + Math.random() * 500;
  entry.retries += 1;

  entry.retryTimer = window.setTimeout(() => {
    entry.retryTimer = null;
    if (entry.refs <= 0 || !registry.has(webinarId)) return;
    try {
      supabase.removeChannel(entry.channel);
    } catch {
      /* ignore */
    }
    bindChannel(webinarId, entry);
  }, delay);
}

function getEntry(webinarId: string): Entry {
  let entry = registry.get(webinarId);
  if (entry) return entry;

  const handlers = new Map<WebinarBroadcastEvent, Set<Handler>>();
  EVENTS.forEach(e => handlers.set(e, new Set()));

  entry = {
    channel: null as unknown as RealtimeChannel,
    generation: 0,
    refs: 0,
    handlers,
    joined: false,
    status: 'connecting',
    statusListeners: new Set(),
    retries: 0,
    retryTimer: null,
  };
  registry.set(webinarId, entry);
  bindChannel(webinarId, entry);

  return entry;
}

/**
 * Observe the realtime connection health for a webinar. Reconnection is
 * automatic with exponential backoff — this is purely for UI feedback.
 */
export function subscribeWebinarConnection(
  webinarId: string,
  cb: (status: WebinarConnectionStatus) => void,
): () => void {
  const entry = getEntry(webinarId);
  entry.refs += 1;
  entry.statusListeners.add(cb);
  cb(entry.status);

  return () => {
    entry.statusListeners.delete(cb);
    releaseEntry(webinarId, entry);
  };
}

/** Force an immediate reconnect attempt (used by "retry now" buttons). */
export function reconnectWebinarBroadcast(webinarId: string) {
  const entry = registry.get(webinarId);
  if (!entry) return;
  if (entry.retryTimer) {
    clearTimeout(entry.retryTimer);
    entry.retryTimer = null;
  }
  entry.retries = 0;
  try {
    supabase.removeChannel(entry.channel);
  } catch {
    /* ignore */
  }
  notifyStatus(webinarId, entry, 'reconnecting');
  bindChannel(webinarId, entry);
}

function releaseEntry(webinarId: string, entry: Entry) {
  entry.refs -= 1;
  if (entry.refs <= 0) {
    if (entry.retryTimer) clearTimeout(entry.retryTimer);
    registry.delete(webinarId);
    try {
      supabase.removeChannel(entry.channel);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Subscribe to broadcast events for a webinar. Returns an unsubscribe fn.
 * The underlying channel is shared and ref-counted across all callers.
 */
export function subscribeWebinarBroadcast(
  webinarId: string,
  handlers: Partial<Record<WebinarBroadcastEvent, Handler>>,
): () => void {
  const entry = getEntry(webinarId);
  entry.refs += 1;

  const registered: Array<[WebinarBroadcastEvent, Handler]> = [];
  (Object.keys(handlers) as WebinarBroadcastEvent[]).forEach(event => {
    const fn = handlers[event];
    if (!fn) return;
    entry.handlers.get(event)?.add(fn);
    registered.push([event, fn]);
  });

  return () => {
    registered.forEach(([event, fn]) => entry.handlers.get(event)?.delete(fn));
    releaseEntry(webinarId, entry);
  };
}


/**
 * Emit an event to everyone listening on the webinar channel.
 * Safe to call even if this client has no active subscription — a short-lived
 * channel is created for the send in that case.
 */
export async function broadcastWebinarEvent(
  webinarId: string,
  event: WebinarBroadcastEvent,
  payload: unknown,
): Promise<void> {
  try {
    const existing = registry.get(webinarId);
    if (existing?.joined) {
      await existing.channel.send({ type: 'broadcast', event, payload });
      return;
    }

    const temp = supabase.channel(`wb:${webinarId}`, {
      config: { broadcast: { self: false, ack: false } },
    });
    await new Promise<void>(resolve => {
      temp.subscribe(status => {
        if (status === 'SUBSCRIBED') resolve();
      });
      setTimeout(resolve, 3000);
    });
    await temp.send({ type: 'broadcast', event, payload });
    supabase.removeChannel(temp);
  } catch (e) {
    console.error('[webinarBroadcast] send failed', event, e);
  }
}
