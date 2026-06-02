// Shared Telegram Bot API helpers
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export type InlineKeyboard = InlineKeyboardButton[][];

export async function tgCall(method: string, payload: Record<string, unknown>) {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`Telegram ${method} failed:`, data);
  }
  return data;
}

export function sendMessage(
  chat_id: number | string,
  text: string,
  opts: {
    keyboard?: InlineKeyboard;
    parse_mode?: 'HTML' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
  } = {},
) {
  const payload: Record<string, unknown> = {
    chat_id,
    text,
    parse_mode: opts.parse_mode ?? 'HTML',
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
  };
  if (opts.keyboard) {
    payload.reply_markup = { inline_keyboard: opts.keyboard };
  }
  return tgCall('sendMessage', payload);
}

export function editMessage(
  chat_id: number | string,
  message_id: number,
  text: string,
  keyboard?: InlineKeyboard,
) {
  const payload: Record<string, unknown> = {
    chat_id,
    message_id,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (keyboard) {
    payload.reply_markup = { inline_keyboard: keyboard };
  }
  return tgCall('editMessageText', payload);
}

export function answerCallback(callback_query_id: string, text?: string) {
  return tgCall('answerCallbackQuery', { callback_query_id, text: text ?? '' });
}

export async function getFileUrl(file_id: string): Promise<string | null> {
  const res = await tgCall('getFile', { file_id });
  const path = res?.result?.file_path;
  if (!path) return null;
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`;
}

export async function downloadFile(file_id: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const url = await getFileUrl(file_id);
  if (!url) return null;
  const r = await fetch(url);
  if (!r.ok) return null;
  const mime = r.headers.get('content-type') ?? 'application/octet-stream';
  const bytes = new Uint8Array(await r.arrayBuffer());
  return { bytes, mime };
}

export function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Format date in Tehran timezone (Persian style)
export function formatTehran(d: Date | string | null): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
