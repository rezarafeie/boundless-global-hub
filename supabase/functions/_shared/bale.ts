// Shared Bale Bot API helpers (https://docs.bale.ai) — Telegram-compatible surface.
const BOT_TOKEN = Deno.env.get('BALE_BOT_TOKEN') ?? '';
const API_BASE = `https://tapi.bale.ai/bot${BOT_TOKEN}`;

export const BALE_BOT_USERNAME = (Deno.env.get('BALE_BOT_USERNAME') ?? '').replace(/^@/, '');

export interface BaleInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}
export type BaleInlineKeyboard = BaleInlineButton[][];

export function baleConfigured() {
  return !!BOT_TOKEN;
}

export async function baleCall(method: string, payload: Record<string, unknown>) {
  if (!BOT_TOKEN) throw new Error('BALE_BOT_TOKEN is not configured');
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!data.ok) console.error(`Bale ${method} failed:`, JSON.stringify(data));
  return data;
}

export function baleSendMessage(
  chat_id: number | string,
  text: string,
  opts: {
    keyboard?: BaleInlineKeyboard;
    replyKeyboard?: Array<Array<string | { text: string; request_contact?: boolean }>>;
    removeKeyboard?: boolean;
  } = {},
) {
  const payload: Record<string, unknown> = { chat_id, text };
  if (opts.keyboard) {
    payload.reply_markup = { inline_keyboard: opts.keyboard };
  } else if (opts.replyKeyboard) {
    payload.reply_markup = {
      keyboard: opts.replyKeyboard.map((row) => row.map((b) => (typeof b === 'string' ? { text: b } : b))),
      resize_keyboard: true,
    };
  } else if (opts.removeKeyboard) {
    payload.reply_markup = { remove_keyboard: true };
  }
  return baleCall('sendMessage', payload);
}

export function baleAnswerCallback(callback_query_id: string, text?: string) {
  return baleCall('answerCallbackQuery', { callback_query_id, text: text ?? '' });
}

export function baleEditMessage(chat_id: number | string, message_id: number, text: string, keyboard?: BaleInlineKeyboard) {
  return baleCall('editMessageText', {
    chat_id,
    message_id,
    text,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

// Bale deep link, e.g. https://ble.ir/rafiei_bot?start=sact_<token>
export function baleDeepLink(payload: string, username = BALE_BOT_USERNAME) {
  const u = (username || 'rafiei_bot').replace(/^@/, '');
  return `https://ble.ir/${u}?start=${encodeURIComponent(payload)}`;
}

// Bale does not render HTML the same way Telegram does — strip tags for safety.
export function stripHtml(s: string) {
  return String(s ?? '')
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}
