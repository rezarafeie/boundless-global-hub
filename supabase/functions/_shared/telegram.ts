// Shared Telegram Bot API helpers
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
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

export type ReplyKeyboardButton = string | { text: string; request_contact?: boolean; request_location?: boolean };
export type ReplyKeyboardLayout = ReplyKeyboardButton[][];

export function sendMessage(
  chat_id: number | string,
  text: string,
  opts: {
    keyboard?: InlineKeyboard;
    replyKeyboard?: ReplyKeyboardLayout;
    removeKeyboard?: boolean;
    parse_mode?: 'HTML' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    one_time_keyboard?: boolean;
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
  } else if (opts.replyKeyboard) {
    payload.reply_markup = {
      keyboard: opts.replyKeyboard.map(row => row.map(b => (typeof b === 'string' ? { text: b } : b))),
      resize_keyboard: true,
      is_persistent: !opts.one_time_keyboard,
      one_time_keyboard: !!opts.one_time_keyboard,
    };
  } else if (opts.removeKeyboard) {
    payload.reply_markup = { remove_keyboard: true };
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

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
};

function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 6) {
    const head = new TextDecoder().decode(bytes.slice(0, 6));
    if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif';
  }
  if (bytes.length >= 12) {
    const riff = new TextDecoder().decode(bytes.slice(0, 4));
    const webp = new TextDecoder().decode(bytes.slice(8, 12));
    if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
    const ftyp = new TextDecoder().decode(bytes.slice(4, 8));
    if (ftyp === 'ftyp') return 'video/mp4';
  }
  if (bytes.length >= 4) {
    const ebml = [0x1a, 0x45, 0xdf, 0xa3];
    if (ebml.every((b, i) => bytes[i] === b)) return 'video/webm';
  }
  return null;
}

export async function downloadFile(file_id: string): Promise<{ bytes: Uint8Array; mime: string; filename?: string; ext?: string } | null> {
  const res = await tgCall('getFile', { file_id });
  const path = res?.result?.file_path;
  if (!path) return null;
  const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const bytes = new Uint8Array(await r.arrayBuffer());
  const filename = path.split('/').pop() || undefined;
  const ext = filename?.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || undefined;
  const headerMime = r.headers.get('content-type') ?? '';
  const mime = headerMime && headerMime !== 'application/octet-stream'
    ? headerMime.split(';')[0]
    : (ext && EXT_MIME[ext]) || sniffMime(bytes) || 'application/octet-stream';
  return { bytes, mime, filename, ext };
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

// ---------------- Rich messages (media + buttons) ----------------

export type MediaType = 'photo' | 'video' | 'document' | 'audio' | 'voice' | 'animation' | '';

export interface MessageButton {
  text: string;
  url?: string;
  type?: string;
}

// Build an inline keyboard (one button per row) from a stored buttons array.
export function buildButtonsKeyboard(
  buttons: unknown,
  resolve?: (b: MessageButton) => string | null,
): InlineKeyboard | undefined {
  if (!Array.isArray(buttons)) return undefined;
  const rows: InlineKeyboard = [];
  for (const raw of buttons as MessageButton[]) {
    if (!raw?.text) continue;
    const url = resolve ? resolve(raw) : (raw.url ?? null);
    if (!url || !isTelegramButtonUrl(String(url))) continue;
    rows.push([{ text: String(raw.text), url: String(url) }]);
  }
  return rows.length ? rows : undefined;
}

function isTelegramButtonUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'tg:';
  } catch {
    return false;
  }
}

// Guess a Telegram media method from a media type or file URL.
export function resolveMediaType(mediaType: string | null | undefined, url: string | null | undefined): MediaType {
  const t = (mediaType ?? '').toLowerCase();
  if (t.startsWith('photo') || t.startsWith('image')) return 'photo';
  if (t.startsWith('video')) return 'video';
  if (t.startsWith('voice')) return 'voice';
  if (t.startsWith('audio') || t.startsWith('music')) return 'audio';
  if (t.startsWith('animation') || t === 'gif') return 'animation';
  if (t.startsWith('document') || t.startsWith('file') || t.startsWith('application')) return 'document';
  const ext = (url ?? '').split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'photo';
  if (ext === 'gif') return 'animation';
  if (['mp4', 'mov', 'm4v', 'webm'].includes(ext)) return 'video';
  if (['ogg', 'oga'].includes(ext)) return 'voice';
  if (['mp3', 'm4a', 'wav', 'flac', 'aac'].includes(ext)) return 'audio';
  return url ? 'document' : '';
}

const MEDIA_METHOD: Record<string, { method: string; field: string }> = {
  photo: { method: 'sendPhoto', field: 'photo' },
  video: { method: 'sendVideo', field: 'video' },
  audio: { method: 'sendAudio', field: 'audio' },
  voice: { method: 'sendVoice', field: 'voice' },
  animation: { method: 'sendAnimation', field: 'animation' },
  document: { method: 'sendDocument', field: 'document' },
};

// Telegram's documented caption limit is 1024 characters after entity parsing.
// Keep a small safety margin for HTML entities and multi-byte captions.
const CAPTION_LIMIT = 950;

export interface MediaItem { url: string; type?: string | null }

// Split long HTML text at a safe boundary so the first part can be used as a caption.
function splitForCaption(text: string): { caption: string; rest: string } {
  if (!text || text.length <= CAPTION_LIMIT) return { caption: text ?? '', rest: '' };
  const head = text.slice(0, CAPTION_LIMIT);
  let cut = head.lastIndexOf('\n');
  if (cut < CAPTION_LIMIT * 0.4) cut = head.lastIndexOf(' ');
  if (cut < CAPTION_LIMIT * 0.4) cut = CAPTION_LIMIT;
  // Avoid cutting inside an html tag
  const lastOpen = head.lastIndexOf('<');
  const lastClose = head.lastIndexOf('>');
  if (lastOpen > lastClose && lastOpen < cut) cut = lastOpen;
  return { caption: text.slice(0, cut).trim(), rest: text.slice(cut).trim() };
}

// media_group supports only photo/video/audio/document
const GROUPABLE: Record<string, string> = { photo: 'photo', video: 'video', audio: 'audio', document: 'document' };

/**
 * Send a message that may carry one or more media attachments and inline buttons.
 * Works for both the bot and Telegram Business (pass business_connection_id).
 * The text is always attached to the media as a caption; only the overflow beyond
 * Telegram's 1024-char caption limit is sent as an extra message.
 */
export async function sendRichMessage(
  chat_id: number | string,
  text: string,
  opts: {
    mediaUrl?: string | null;
    mediaType?: string | null;
    mediaItems?: MediaItem[] | null;
    keyboard?: InlineKeyboard;
    business_connection_id?: string | null;
    parse_mode?: 'HTML' | 'MarkdownV2';
    reply_to_message_id?: number;
  } = {},
): Promise<any> {
  const parse_mode = opts.parse_mode ?? 'HTML';
  const base: Record<string, unknown> = { chat_id, parse_mode };
  if (opts.business_connection_id) base.business_connection_id = opts.business_connection_id;
  if (opts.reply_to_message_id) base.reply_to_message_id = opts.reply_to_message_id;
  const reply_markup = opts.keyboard?.length ? { inline_keyboard: opts.keyboard } : undefined;

  const plain = (extra?: Record<string, unknown>) =>
    sendWithButtons({ ...base, text, disable_web_page_preview: true, ...(extra ?? {}) }, opts.keyboard, text, parse_mode);

  const items: MediaItem[] = [];
  for (const it of (opts.mediaItems ?? [])) {
    const u = (it?.url ?? '').trim();
    if (u) items.push({ url: u, type: it?.type ?? null });
  }
  if (!items.length) {
    const single = (opts.mediaUrl ?? '').trim();
    if (single) items.push({ url: single, type: opts.mediaType ?? null });
  }

  if (!items.length) return plain();

  const { caption, rest } = splitForCaption(text ?? '');

  // ---- Multiple attachments: album when possible ----
  if (items.length > 1) {
    const kinds = items.map(i => resolveMediaType(i.type, i.url));
    const groupable = kinds.every(k => GROUPABLE[k]);
    let lastRes: any = null;

    if (groupable) {
      const media = items.map((it, i) => ({
        type: GROUPABLE[kinds[i]],
        media: it.url,
        ...(i === 0 && caption ? { caption, parse_mode } : {}),
      }));
      lastRes = await tgCall('sendMediaGroup', { ...base, media });
      if (lastRes?.ok === false) {
        // fall back to sending one by one
        lastRes = await sendItemsSequentially(base, items, kinds, caption, parse_mode);
      }
    } else {
      lastRes = await sendItemsSequentially(base, items, kinds, caption, parse_mode);
    }

    // Buttons (and any overflow text) go in a trailing message.
    if (rest || reply_markup) {
      return await sendWithButtons(
        { ...base, text: rest || '⬆️', disable_web_page_preview: true },
        opts.keyboard,
        rest || '⬆️',
        parse_mode,
      );
    }
    return lastRes;
  }

  // ---- Single attachment ----
  const kind = resolveMediaType(items[0].type, items[0].url);
  const spec = MEDIA_METHOD[kind] ?? MEDIA_METHOD.document;

  const mediaRes = await sendWithButtons(
    {
      ...base,
      [spec.field]: items[0].url,
      ...(caption ? { caption } : {}),
    },
    rest ? undefined : opts.keyboard,
    caption,
    parse_mode,
    spec.method,
  );

  // If Telegram rejected the media (e.g. a voice note that isn't OGG/OPUS),
  // retry with a more permissive method before giving up on the attachment.
  if (mediaRes?.ok === false && kind !== 'document') {
    const fallbackKind = kind === 'voice' ? 'audio' : 'document';
    const fbSpec = MEDIA_METHOD[fallbackKind];
    const retry = await sendWithButtons(
      { ...base, [fbSpec.field]: items[0].url, ...(caption ? { caption } : {}) },
      rest ? undefined : opts.keyboard,
      caption,
      parse_mode,
      fbSpec.method,
    );
    if (retry?.ok !== false) {
      if (rest) {
        return await sendWithButtons({ ...base, text: rest, disable_web_page_preview: true }, opts.keyboard, rest, parse_mode);
      }
      return retry;
    }
  }
  if (mediaRes?.ok === false) return plain();

  if (rest || (reply_markup && rest)) {
    return await sendWithButtons(
      { ...base, text: rest, disable_web_page_preview: true },
      opts.keyboard,
      rest,
      parse_mode,
    );
  }
  return mediaRes;
}

async function sendItemsSequentially(
  base: Record<string, unknown>,
  items: MediaItem[],
  kinds: MediaType[],
  caption: string,
  parse_mode: string,
) {
  let res: any = null;
  for (let i = 0; i < items.length; i++) {
    const spec = MEDIA_METHOD[kinds[i]] ?? MEDIA_METHOD.document;
    res = await tgCall(spec.method, {
      ...base,
      [spec.field]: items[i].url,
      ...(i === 0 && caption ? { caption, parse_mode } : {}),
    });
  }
  return res;
}

/**
 * Send a payload with inline buttons. Telegram Business connections normally accept
 * inline keyboards; if a specific account/method rejects them, we retry once with the
 * buttons rendered as links inside the text/caption so the message still goes out.
 */
async function sendWithButtons(
  payload: Record<string, unknown>,
  keyboard: InlineKeyboard | undefined,
  bodyText: string,
  parse_mode: string,
  method = 'sendMessage',
): Promise<any> {
  if (!keyboard?.length) return tgCall(method, payload);

  const res = await tgCall(method, { ...payload, reply_markup: { inline_keyboard: keyboard } });
  if (res?.ok !== false) return res;

  const err = String(res?.description ?? '');
  if (!/reply_markup|button|BUSINESS|keyboard/i.test(err)) return res;

  // A malformed button must never make Telegram drop the media. Retry with only
  // valid URL buttons; if none remain, preserve the media and omit the bad button.
  const validKeyboard = keyboard
    .map(row => row.filter(button => !button.url || isTelegramButtonUrl(button.url)))
    .filter(row => row.length > 0);
  if (validKeyboard.length && JSON.stringify(validKeyboard) !== JSON.stringify(keyboard)) {
    const retry = await tgCall(method, { ...payload, reply_markup: { inline_keyboard: validKeyboard } });
    if (retry?.ok !== false) return retry;
  }

  // Do not turn configured buttons into caption links or replace the attachment
  // with a text-only message. The media is the higher-priority part of delivery.
  return tgCall(method, payload);
}


// Telegram Business messages cannot carry inline keyboards, so buttons are
// appended to the message body as clickable links instead.
export function appendButtonsAsLinks(text: string, keyboard?: InlineKeyboard): string {
  if (!keyboard?.length) return text;
  const links = keyboard
    .flat()
    .filter(b => b?.url && b?.text)
    .map(b => `👉 <a href="${b.url}">${escapeHtml(b.text)}</a>`);
  if (!links.length) return text;
  return `${text}\n\n${links.join('\n')}`;
}
