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

export function sendPhoto(
  chat_id: number | string,
  photo: string,
  opts: {
    caption?: string;
    keyboard?: InlineKeyboard;
    parse_mode?: 'HTML' | 'MarkdownV2';
  } = {},
) {
  const payload: Record<string, unknown> = {
    chat_id,
    photo,
    parse_mode: opts.parse_mode ?? 'HTML',
  };
  if (opts.caption) payload.caption = opts.caption;
  if (opts.keyboard) {
    payload.reply_markup = { inline_keyboard: opts.keyboard };
  }
  return tgCall('sendPhoto', payload);

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

// Convert common Markdown (as produced by LLMs) into Telegram-safe HTML.
// Telegram HTML supports: <b>, <i>, <u>, <s>, <code>, <pre>, <a href="">.
// No headings/lists — we approximate them with bold + bullets.
export function mdToTelegramHtml(input: string): string {
  if (!input) return '';
  let s = input.replace(/\r\n/g, '\n');

  // Protect fenced code blocks
  const codeBlocks: string[] = [];
  s = s.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_m, _lang, body) => {
    const idx = codeBlocks.push(`<pre>${escapeHtml(String(body).replace(/\n$/, ''))}</pre>`) - 1;
    return `\u0000CB${idx}\u0000`;
  });

  // Protect inline code
  const inlineCodes: string[] = [];
  s = s.replace(/`([^`\n]+)`/g, (_m, body) => {
    const idx = inlineCodes.push(`<code>${escapeHtml(String(body))}</code>`) - 1;
    return `\u0000IC${idx}\u0000`;
  });

  // Escape remaining text
  s = escapeHtml(s);

  // Headings → bold
  s = s.replace(/^(#{1,6})\s+(.+)$/gm, (_m, _h, t) => `<b>${String(t).trim()}</b>`);

  // Bold
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/__([^_\n]+)__/g, '<b>$1</b>');

  // Italic
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,!?:;)]|$)/g, '$1<i>$2</i>');
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,!?:;)]|$)/g, '$1<i>$2</i>');

  // Strikethrough
  s = s.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');

  // Links
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

  // Bullet lists
  s = s.replace(/^[\s]*[-*+]\s+/gm, '• ');

  // Restore code placeholders
  s = s.replace(/\u0000IC(\d+)\u0000/g, (_m, i) => inlineCodes[Number(i)] ?? '');
  s = s.replace(/\u0000CB(\d+)\u0000/g, (_m, i) => codeBlocks[Number(i)] ?? '');

  // Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
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
