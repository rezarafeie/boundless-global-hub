// Activation messages: multi-message, media/voice, per-message delay.
// Delayed messages are stored in bot_scheduled_messages and sent by
// support-activation-followup-cron (runs every few minutes).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendRichMessage, escapeHtml, type MediaItem } from './telegram.ts';
import { runWithChannel, currentChannel, type Channel } from './channel.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

export type ActivationEvent = 'welcome' | 'activated';

export interface ExtraActivationMessage {
  event?: ActivationEvent;
  target?: 'bot' | 'business' | 'both';
  enabled?: boolean;
  text?: string;
  media_items?: MediaItem[];
  buttons?: { text: string; url: string }[];
  delay_minutes?: number;
}

export function cleanItems(items: unknown): MediaItem[] {
  return (Array.isArray(items) ? items : [])
    .filter((i: any) => i && typeof i.url === 'string' && i.url.trim())
    .map((i: any) => ({ url: String(i.url).trim(), type: i.type ?? null }));
}

/** Send now (delay <= 0) or queue for later. */
export async function sendOrQueue(p: {
  chatId: number;
  text: string;
  mediaItems?: MediaItem[];
  mediaUrl?: string | null;
  mediaType?: string | null;
  keyboard?: any;
  businessConnectionId?: string | null;
  replyTo?: number;
  delayMinutes?: number;
  channel?: Channel;
  source?: string;
}) {
  const channel = p.channel ?? currentChannel();
  let items = cleanItems(p.mediaItems);
  if (!items.length && p.mediaUrl?.trim()) items = [{ url: p.mediaUrl.trim(), type: p.mediaType ?? null }];
  const delay = Math.max(0, Number(p.delayMinutes) || 0);
  if (delay > 0) {
    const { error } = await supabase.from('bot_scheduled_messages').insert({
      channel,
      chat_id: p.chatId,
      business_connection_id: p.businessConnectionId ?? null,
      text: p.text ?? '',
      media_items: items,
      keyboard: p.keyboard?.length ? p.keyboard : null,
      send_at: new Date(Date.now() + delay * 60_000).toISOString(),
      source: p.source ?? null,
    });
    if (error) console.error('queue activation message failed', error);
    return { queued: true };
  }
  return await runWithChannel(channel, () => sendRichMessage(p.chatId, p.text ?? '', {
    mediaItems: items,
    keyboard: p.keyboard?.length ? p.keyboard : undefined,
    business_connection_id: p.businessConnectionId ?? undefined,
    reply_to_message_id: p.replyTo,
  }));
}

async function businessConnectionId(): Promise<string | null> {
  const { data } = await supabase.from('admin_settings').select('telegram_business_connection_id').eq('id', 1).maybeSingle();
  return (data as any)?.telegram_business_connection_id ?? null;
}

/**
 * Send the course's extra messages for one activation event.
 * userChatId = the user's private chat id in the current messenger (bot chat).
 * Business sends go to the same user id through the Telegram Business account (Telegram only).
 */
export async function sendExtraActivationMessages(
  course: any,
  event: ActivationEvent,
  ctx: { userChatId: number | null; name: string; courseTitle: string; bcid?: string | null },
) {
  const list: ExtraActivationMessage[] = Array.isArray(course?.activation_extra_messages) ? course.activation_extra_messages : [];
  const msgs = list.filter(m => (m.event ?? 'activated') === event && m.enabled !== false);
  if (!msgs.length || !ctx.userChatId) return;
  const channel = currentChannel();
  let bcid = ctx.bcid ?? null;
  for (const m of msgs) {
    const text = String(m.text ?? '')
      .replace(/\{\{name\}\}/g, escapeHtml(ctx.name))
      .replace(/\{\{course_title\}\}/g, escapeHtml(ctx.courseTitle));
    const items = cleanItems(m.media_items);
    if (!text.trim() && !items.length) continue;
    const keyboard = (m.buttons ?? []).filter(b => b?.text && b?.url).map(b => [{ text: String(b.text), url: String(b.url) }]);
    const target = m.target ?? 'bot';
    const common = { chatId: ctx.userChatId, text, mediaItems: items, keyboard, delayMinutes: m.delay_minutes, channel, source: `course_${event}` };
    try {
      if (target === 'bot' || target === 'both' || channel === 'bale') {
        await sendOrQueue(common);
      }
      if ((target === 'business' || target === 'both') && channel === 'telegram') {
        if (bcid === null) bcid = await businessConnectionId();
        if (bcid) await sendOrQueue({ ...common, businessConnectionId: bcid });
      }
    } catch (e) { console.warn('extra activation message failed', e); }
  }
}

/** Deliver due queued messages. Called by the followup cron. */
export async function processScheduledBotMessages(limit = 200) {
  const { data: rows } = await supabase
    .from('bot_scheduled_messages')
    .select('*')
    .is('sent_at', null)
    .lte('send_at', new Date().toISOString())
    .lt('attempts', 3)
    .order('send_at', { ascending: true })
    .limit(limit);
  let sent = 0;
  for (const r of (rows as any[]) ?? []) {
    // claim
    const { data: claimed } = await supabase.from('bot_scheduled_messages')
      .update({ attempts: (r.attempts ?? 0) + 1 })
      .eq('id', r.id).eq('attempts', r.attempts ?? 0).is('sent_at', null)
      .select('id');
    if (!claimed?.length) continue;
    try {
      const res: any = await runWithChannel((r.channel as Channel) || 'telegram', () => sendRichMessage(r.chat_id, r.text ?? '', {
        mediaItems: cleanItems(r.media_items),
        keyboard: Array.isArray(r.keyboard) && r.keyboard.length ? r.keyboard : undefined,
        business_connection_id: r.business_connection_id ?? undefined,
      }));
      if (res?.ok === false) throw new Error(res?.description || 'send failed');
      await supabase.from('bot_scheduled_messages').update({ sent_at: new Date().toISOString(), last_error: null }).eq('id', r.id);
      sent++;
    } catch (e) {
      await supabase.from('bot_scheduled_messages').update({ last_error: String(e).slice(0, 500) }).eq('id', r.id);
    }
  }
  return { due: rows?.length ?? 0, sent };
}
