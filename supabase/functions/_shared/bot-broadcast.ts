// Broadcast (اطلاعیه همگانی) queue with Telegram-safe rate limiting.
import { sendMessage, editMessage, escapeHtml, type InlineKeyboard } from '../_shared/telegram.ts';

export interface BroadcastButton { text: string; url: string }

// Telegram global limit is ~30 msg/sec; stay at 22/sec for safety.
const RATE_PER_SECOND = 22;

export function parseBroadcastButtons(input: string): BroadcastButton[] {
  const buttons: BroadcastButton[] = [];
  for (const raw of input.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const sep = line.includes('|') ? '|' : (line.includes('-') && /https?:\/\//i.test(line) ? '-' : '|');
    const idx = line.indexOf(sep);
    if (idx <= 0) continue;
    const text = line.slice(0, idx).trim();
    const url = line.slice(idx + 1).trim();
    if (!text || !/^https?:\/\/\S+$/i.test(url)) continue;
    buttons.push({ text: text.slice(0, 64), url });
    if (buttons.length >= 10) break;
  }
  return buttons;
}

export function buttonsToKeyboard(buttons: BroadcastButton[]): InlineKeyboard | undefined {
  if (!buttons.length) return undefined;
  return buttons.map(b => [{ text: b.text, url: b.url }]) as InlineKeyboard;
}

export function renderBroadcastText(text: string): string {
  return `📢 <b>اطلاعیه:</b>\n\n${escapeHtml(text)}`;
}

export async function fetchBroadcastTargets(supabase: any): Promise<number[]> {
  const ids = new Set<number>();
  const pageSize = 1000;
  for (let from = 0; from < 50000; from += pageSize) {
    const { data, error } = await supabase
      .from('chat_users')
      .select('telegram_chat_id')
      .not('telegram_chat_id', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) { console.error('fetchBroadcastTargets error:', error); break; }
    if (!data?.length) break;
    for (const r of data) {
      const id = Number((r as any).telegram_chat_id);
      if (Number.isFinite(id) && id !== 0) ids.add(id);
    }
    if (data.length < pageSize) break;
  }
  return Array.from(ids);
}

function progressBar(done: number, total: number): string {
  const pct = total ? Math.round((done / total) * 100) : 100;
  const filled = Math.round(pct / 10);
  return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${pct}%`;
}

export async function runBroadcastQueue(opts: {
  adminChatId: number;
  progressMessageId: number;
  text: string;
  buttons: BroadcastButton[];
  targets: number[];
}) {
  const { adminChatId, progressMessageId, text, buttons, targets } = opts;
  const body = renderBroadcastText(text);
  const keyboard = buttonsToKeyboard(buttons);
  const total = targets.length;
  const startedAt = Date.now();

  let sent = 0, failed = 0, blocked = 0, done = 0;
  let lastEdit = 0;

  const updateProgress = async (force = false) => {
    if (!force && Date.now() - lastEdit < 3000) return;
    lastEdit = Date.now();
    const remaining = total - done;
    const eta = Math.ceil(remaining / RATE_PER_SECOND);
    await editMessage(adminChatId, progressMessageId, [
      `📤 <b>در حال ارسال اطلاعیه…</b>`,
      ``,
      progressBar(done, total),
      ``,
      `👥 کل صف: <b>${total}</b>`,
      `✅ ارسال‌شده: <b>${sent}</b>`,
      `🚫 مسدود/حذف‌شده: <b>${blocked}</b>`,
      `❌ ناموفق: <b>${failed}</b>`,
      `⏳ باقی‌مانده: <b>${remaining}</b>`,
      `🕐 تخمین زمان: ~${eta} ثانیه`,
      `⚡️ سرعت: ${RATE_PER_SECOND} پیام در ثانیه`,
    ].join('\n')).catch(() => {});
  };

  await updateProgress(true);

  const sendOne = async (chat_id: number, attempt = 0): Promise<void> => {
    try {
      const r: any = await sendMessage(chat_id, body, keyboard ? { keyboard } : {});
      if (r?.ok) { sent++; return; }
      const code = r?.error_code;
      const desc = String(r?.description ?? '');
      if (code === 429 && attempt < 2) {
        const wait = Number(r?.parameters?.retry_after ?? 2);
        await new Promise(res => setTimeout(res, (wait + 1) * 1000));
        return sendOne(chat_id, attempt + 1);
      }
      if (code === 403 || /bot was blocked|user is deactivated|chat not found/i.test(desc)) blocked++;
      else failed++;
    } catch (_e) {
      failed++;
    }
  };

  for (let i = 0; i < total; i += RATE_PER_SECOND) {
    const batch = targets.slice(i, i + RATE_PER_SECOND);
    const batchStart = Date.now();
    await Promise.all(batch.map(id => sendOne(id)));
    done += batch.length;
    await updateProgress();
    const elapsed = Date.now() - batchStart;
    if (elapsed < 1000 && i + RATE_PER_SECOND < total) {
      await new Promise(res => setTimeout(res, 1000 - elapsed));
    }
  }

  const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const report = [
    `✅ <b>گزارش نهایی ارسال اطلاعیه</b>`,
    ``,
    `👥 کل مخاطبان صف: <b>${total}</b>`,
    `✅ ارسال موفق: <b>${sent}</b>`,
    `🚫 مسدود کرده/غیرفعال: <b>${blocked}</b>`,
    `❌ خطای ارسال: <b>${failed}</b>`,
    `📈 نرخ موفقیت: <b>${total ? Math.round((sent / total) * 100) : 0}%</b>`,
    `🔘 تعداد دکمه‌ها: <b>${buttons.length}</b>`,
    `⏱ مدت ارسال: <b>${seconds}</b> ثانیه (${RATE_PER_SECOND}/ثانیه)`,
  ].join('\n');

  await editMessage(adminChatId, progressMessageId, report).catch(() => {});
  await sendMessage(adminChatId, report).catch(() => {});
}
