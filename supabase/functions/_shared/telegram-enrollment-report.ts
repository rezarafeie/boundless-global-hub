import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { answerCallback, editMessage, escapeHtml, formatTehran, sendMessage, type InlineKeyboard } from './telegram.ts';

const PREFIX = 'enrollment-report:';
const COMMAND = '/enrollment_report';
const PAGE_SIZE = 12;
const PERIODS = {
  hour: { hours: 1, label: 'یک ساعت اخیر' },
  day: { hours: 24, label: '۲۴ ساعت اخیر' },
  week: { hours: 168, label: '۷ روز اخیر' },
  month: { hours: 720, label: '۳۰ روز اخیر' },
} as const;
type Period = keyof typeof PERIODS;
type Range =
  | { period: Period; end: number }
  | { period: 'custom'; firstDay: string; lastDay: string };
type Chat = { id?: number; type?: string };
type Sender = { id?: number; is_bot?: boolean };
type Update = {
  message?: { chat?: Chat; from?: Sender; text?: string };
  callback_query?: {
    id: string;
    from?: Sender;
    data?: string;
    message?: { chat?: Chat; message_id?: number };
  };
};
type Request = {
  chat?: Chat;
  sender?: Sender;
  callbackId?: string;
  messageId?: number;
} & (
  | { action: 'report' | 'grant' | 'revoke'; input: string }
  | { action: 'button'; input: string }
);
type ReportRow = { title: string; total: number; completed: number };
type Report = { starts_at: string; ends_at: string; total: number; completed: number; courses: ReportRow[] };

export function getEnrollmentReportRequest(update: Update | null): Request | null {
  const callback = update?.callback_query;
  if (callback?.data?.startsWith(PREFIX)) {
    return {
      action: 'button',
      input: callback.data.slice(PREFIX.length),
      chat: callback.message?.chat,
      sender: callback.from,
      callbackId: callback.id,
      messageId: callback.message?.message_id,
    };
  }
  const message = update?.message;
  const match = message?.text?.match(/^\/enrollment_report(?:_(grant|revoke))?(?:@[a-z0-9_]+)?(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const command = match[1]?.toLowerCase();
  return {
    action: command === 'grant' || command === 'revoke' ? command : 'report',
    input: match[2]?.trim() ?? '',
    chat: message?.chat,
    sender: message?.from,
  };
}

export async function enrollmentReportWebhookSecret(configured: string, botToken: string | undefined) {
  if (configured) return configured.slice(0, 256);
  if (!botToken) return '';
  // Match the fallback used by telegram-set-webhook.
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('webhook:' + botToken));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function asciiDigits(text: string) {
  return text.replace(/[۰-۹٠-٩]/g, (digit) => String(digit.charCodeAt(0) & 15));
}

function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function customRange(firstDay: string, lastDay: string): Range | null {
  if (!validDay(firstDay) || !validDay(lastDay) || firstDay > lastDay) return null;
  return { period: 'custom', firstDay, lastDay };
}

function isPeriod(value: string): value is Period {
  return Object.hasOwn(PERIODS, value);
}

const menuKeyboard: InlineKeyboard = [
  [
    { text: PERIODS.hour.label, callback_data: PREFIX + 'hour' },
    { text: PERIODS.day.label, callback_data: PREFIX + 'day' },
  ],
  [
    { text: PERIODS.week.label, callback_data: PREFIX + 'week' },
    { text: PERIODS.month.label, callback_data: PREFIX + 'month' },
  ],
  [{ text: 'بازهٔ اختصاصی', callback_data: PREFIX + 'custom' }],
];

const customHelp = [
  'تاریخ ابتدا و انتها را به میلادی و به صورت <code>YYYY-MM-DD</code> وارد کنید.',
  'هر دو روز کامل به وقت تهران در گزارش حساب می‌شوند.',
  `نمونه: <code>${COMMAND} 2026-11-01 2026-11-15</code>`,
].join('\n');

function showMenu(chatId: number, messageId: number | undefined, isAdmin: boolean, custom = false) {
  const message = custom
    ? customHelp
    : [
      '📊 <b>گزارش ثبت‌نام دوره‌ها</b>',
      'بازهٔ گزارش را انتخاب کنید.',
      ...(isAdmin ? [
        '',
        `دادن دسترسی مشاهده: <code>${COMMAND}_grant 123456789</code>`,
        `لغو دسترسی: <code>${COMMAND}_revoke 123456789</code>`,
      ] : []),
    ].join('\n');
  return messageId ? editMessage(chatId, messageId, message, menuKeyboard) : sendMessage(chatId, message, { keyboard: menuKeyboard });
}

async function showReport(supabase: SupabaseClient, chatId: number, messageId: number | undefined, range: Range, page: number) {
  const args = range.period === 'custom'
    ? { p_first_day: range.firstDay, p_last_day: range.lastDay }
    : {
      p_start_at: new Date(range.end - PERIODS[range.period].hours * 3_600_000).toISOString(),
      p_end_at: new Date(range.end).toISOString(),
    };
  const { data, error } = await supabase.rpc('get_telegram_enrollment_report', args);
  if (error || !data) throw error ?? new Error('Missing enrollment report');
  const report: Report = data;
  const pages = Math.max(1, Math.ceil(report.courses.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const title = range.period === 'custom' ? 'بازهٔ اختصاصی' : PERIODS[range.period].label;
  const lastMoment = new Date(new Date(report.ends_at).getTime() - (range.period === 'custom' ? 1 : 0));
  const lines = [
    `📊 <b>گزارش ثبت‌نام | ${title}</b>`,
    `از ${formatTehran(report.starts_at)} تا ${formatTehran(lastMoment)} · وقت تهران`,
    '',
    `کل ثبت‌نام‌ها: <b>${report.total}</b> | تکمیل‌شده: <b>${report.completed}</b> | سایر وضعیت‌ها: <b>${report.total - report.completed}</b>`,
    '',
    'به تفکیک دوره · کل / تکمیل‌شده',
    ...report.courses.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((course) =>
      `• ${escapeHtml(course.title.replace(/\s+/g, ' ').slice(0, 120))} — <b>${course.total} / ${course.completed}</b>`
    ),
  ];
  if (!report.courses.length) lines.push('دوره‌ای برای نمایش وجود ندارد.');
  const keyboard: InlineKeyboard = [];
  if (pages > 1) {
    lines.push('', `صفحهٔ ${currentPage + 1} از ${pages}`);
    const rangeKey = range.period === 'custom'
      ? `custom:${range.firstDay}:${range.lastDay}`
      : `${range.period}:${range.end}`;
    const navigation = [];
    if (currentPage > 0) navigation.push({ text: '◀️ قبلی', callback_data: `${PREFIX}${rangeKey}:${currentPage - 1}` });
    if (currentPage + 1 < pages) navigation.push({ text: 'بعدی ▶️', callback_data: `${PREFIX}${rangeKey}:${currentPage + 1}` });
    keyboard.push(navigation);
  }
  keyboard.push([{ text: 'انتخاب بازهٔ دیگر', callback_data: PREFIX + 'menu' }]);
  const message = lines.join('\n');
  if (messageId) await editMessage(chatId, messageId, message, keyboard);
  else await sendMessage(chatId, message, { keyboard });
}

export async function handleEnrollmentReportRequest(
  request: Request,
  supabase: SupabaseClient,
  isBotAdmin: (chatId: number) => Promise<boolean>,
) {
  const chatId = request.chat?.id;
  if (request.chat?.type !== 'private' || !Number.isSafeInteger(chatId) || !chatId ||
      chatId !== request.sender?.id || request.sender?.is_bot) {
    if (request.callbackId) await answerCallback(request.callbackId, 'گزارش فقط در چت خصوصی قابل مشاهده است.');
    return;
  }

  if (request.callbackId) await answerCallback(request.callbackId);
  const { action, input, messageId } = request;
  try {
    const admin = await isBotAdmin(chatId);
    const managesAccess = action === 'grant' || action === 'revoke';
    let canView = admin;
    if (!admin && !managesAccess) {
      const { data, error } = await supabase.from('telegram_enrollment_report_access')
        .select('telegram_user_id').eq('telegram_user_id', chatId).maybeSingle();
      if (error) throw error;
      canView = Boolean(data);
    }
    if (!canView) {
      await sendMessage(chatId, '⛔ به گزارش ثبت‌نام دسترسی ندارید.');
      return;
    }
    if (managesAccess) {
      const targetId = asciiDigits(input);
      const target = Number(targetId);
      if (!/^\d+$/.test(targetId) || !Number.isSafeInteger(target) || target <= 0) {
        await sendMessage(chatId, 'شناسهٔ عددی تلگرام را وارد کنید. کاربر می‌تواند آن را با /myid از ربات بگیرد.');
        return;
      }
      const access = supabase.from('telegram_enrollment_report_access');
      const { error } = action === 'grant'
        ? await access.upsert({ telegram_user_id: target }, { onConflict: 'telegram_user_id', ignoreDuplicates: true })
        : await access.delete().eq('telegram_user_id', target);
      if (error) throw error;
      await sendMessage(chatId, action === 'grant'
        ? `✅ دسترسی مشاهدهٔ گزارش برای <code>${target}</code> فعال است.`
        : `✅ دسترسی واگذارشده برای <code>${target}</code> لغو شد.`);
      return;
    }

    if ((action === 'report' && !input) || (action === 'button' && input === 'menu')) {
      await showMenu(chatId, messageId, admin);
      return;
    }
    if (action === 'report') {
      const parts = asciiDigits(input).split(/\s+/);
      const range = parts.length === 2 ? customRange(parts[0], parts[1]) : null;
      if (range) await showReport(supabase, chatId, undefined, range, 0);
      else await sendMessage(chatId, `⚠️ بازه معتبر نیست.\n\n${customHelp}`, { keyboard: menuKeyboard });
      return;
    }
    if (input === 'custom') {
      await showMenu(chatId, messageId, admin, true);
      return;
    }

    const [period, start, endOrPage, customPage] = input.split(':');
    const now = Date.now();
    const end = start ? Number(start) : now;
    const range = period === 'custom'
      ? customRange(start ?? '', endOrPage ?? '')
      : isPeriod(period) && Number.isSafeInteger(end) && end > 0 && end <= now
      ? { period, end }
      : null;
    const page = Number((period === 'custom' ? customPage : endOrPage) ?? 0);
    if (range && Number.isSafeInteger(page) && page >= 0) {
      await showReport(supabase, chatId, messageId, range, page);
    }
  } catch (error) {
    console.error('Telegram enrollment report failed:', error);
    await sendMessage(chatId, '❌ انجام درخواست ممکن نشد. دوباره تلاش کنید.');
  }
}
