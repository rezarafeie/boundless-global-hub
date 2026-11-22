import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { sendMessage, answerCallback, escapeHtml, type InlineKeyboard } from './telegram.ts';
import { currentChannel } from './channel.ts';
import { reportRange, customReportRange, reportAllowed, numericChatId, type ReportPeriod } from './enrollment-report-policy.ts';

type Access = { active: boolean; can_manage: boolean };
const labels: Record<ReportPeriod, string> = { hour: 'یک ساعت اخیر', day: '۲۴ ساعت اخیر', week: '۷ روز اخیر', month: '۳۰ روز اخیر' };
export const ENROLLMENT_REPORT_BUTTON = '📊 آمار ثبت‌نام دوره‌ها';
export async function showEnrollmentReportButton(chatId: number, access: Access | null) {
  if (!reportAllowed(access)) return;
  await sendMessage(chatId, '📊 گزارش ثبت‌نام دوره‌ها', { replyKeyboard: [[ENROLLMENT_REPORT_BUTTON]] });
}
export async function enrollmentReportAccess(db: SupabaseClient, chatId: number): Promise<Access | null> {
  if (currentChannel() !== 'telegram') return null;
  const { data, error } = await db.from('telegram_enrollment_report_access').select('active,can_manage').eq('chat_id', chatId).maybeSingle();
  if (error) throw error;
  return data;
}
function keyboard(access: Access): InlineKeyboard {
  return [
    [{ text: 'یک ساعت', callback_data: 'ereg:hour' }, { text: 'یک روز', callback_data: 'ereg:day' }],
    [{ text: 'یک هفته', callback_data: 'ereg:week' }, { text: 'یک ماه (۳۰ روز)', callback_data: 'ereg:month' }],
    [{ text: 'بازه اختصاصی', callback_data: 'ereg:custom' }],
    ...(access.can_manage ? [[{ text: 'مدیریت دسترسی گزارش', callback_data: 'ereg:access' }]] : []),
  ];
}
const n = (value: unknown) => Number(value ?? 0).toLocaleString('fa-IR');
const date = (value: string) => new Date(value).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'short', timeStyle: 'short' });
async function menu(chatId: number, access: Access) {
  await sendMessage(chatId, '📊 <b>گزارش ثبت‌نام دوره‌ها</b>\nبازه زمانی را انتخاب کنید.', { keyboard: keyboard(access) });
}
async function state(db: SupabaseClient, chatId: number, action: string | null) {
  const { error } = await db.from('telegram_bot_sessions').upsert({ chat_id: chatId, channel: 'telegram', user_id: null, state: action, context: {}, expires_at: new Date(Date.now() + 1800000).toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'chat_id,channel' });
  if (error) throw error;
}
export async function deliverEnrollmentReport(db: SupabaseClient, chatId: number, range: { from: string; to: string }, label: string, access: Access) {
  const { data, error } = await db.rpc('telegram_enrollment_report', { p_from: range.from, p_to: range.to });
  if (error) throw error;
  const rows = data ?? [];
  const summary = summarizeEnrollmentReport(rows);
  const chunks: string[] = [];
  let chunk = `📊 <b>ثبت‌نام — ${escapeHtml(label)}</b>\n${date(range.from)} ← ${date(range.to)}\n🕒 ساعت تهران\n\nجمع ثبت‌نام‌ها: <b>${n(summary.total)}</b>\n`;
  for (const r of summary.nonzero) {
    const block = `\n🎓 ${escapeHtml(String(r.title))}: <b>${n(r.total)}</b>\n`;
    if (chunk.length + block.length > 3400) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += block;
  }
  const footer = summary.zeroCount > 0 ? `\n<i>${summary.nonzero.length ? 'سایر ' : ''}${n(summary.zeroCount)} دوره: صفر ثبت‌نام</i>` : '';
  if (chunk.length + footer.length > 3400) { chunks.push(chunk); chunk = ''; }
  chunks.push(chunk + footer);
  for (const [index, text] of chunks.entries()) {
    const sent = await sendMessage(chatId, text, index === chunks.length - 1 ? { keyboard: keyboard(access) } : {});
    if (!sent?.ok) throw new Error('ارسال گزارش به تلگرام انجام نشد؛ دوباره تلاش کنید');
  }
  console.info('Enrollment report delivered', { courses: rows.length, listedCourses: summary.nonzero.length, zeroCourses: summary.zeroCount, total: summary.total, from: range.from, to: range.to });
}

export function summarizeEnrollmentReport<T extends { total?: unknown; title?: unknown }>(rows: T[]) {
  return {
    total: rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0),
    nonzero: rows.filter(row => Number(row.total ?? 0) > 0),
    zeroCount: rows.filter(row => Number(row.total ?? 0) === 0).length,
  };
}

export async function handleEnrollmentReport(db: SupabaseClient, update: any): Promise<boolean> {
  if (currentChannel() !== 'telegram') return false;
  const cq = update.callback_query;
  const msg = cq?.message ?? update.message;
  const sender = cq?.from ?? msg?.from;
  if (!msg?.chat || msg.chat.type !== 'private' || sender?.id !== msg.chat.id) {
    if (cq?.data?.startsWith('ereg:')) { await answerCallback(cq.id, 'گزارش فقط در گفت‌وگوی خصوصی ربات قابل مشاهده است.'); return true; }
    return false;
  }
  const chatId = Number(sender.id);
  const text = String(msg.text ?? '').trim();
  const commandMatch = text.match(/^\/(?:enrollments|enrollment_report|reports)(?:@\w+)?(?:\s+(hour|day|week|month))?$/);
  const button = text === ENROLLMENT_REPORT_BUTTON;
  const start = /^\/start(?:@\w+)?$/.test(text);
  const command = !!commandMatch || text === '/start enrollment_reports' || button;
  const callback = cq?.data?.startsWith('ereg:');
  const { data: session, error: sessionError } = await db.from('telegram_bot_sessions').select('state,expires_at').eq('chat_id', chatId).eq('channel', 'telegram').maybeSingle();
  if (sessionError) throw sessionError;
  const activeState = session?.state?.startsWith('enrollment_report_') && new Date(session.expires_at) > new Date() ? session.state : null;
  if (!command && !callback && !activeState && !start) return false;
  const access = await enrollmentReportAccess(db, chatId);
  if (start) {
    await showEnrollmentReportButton(chatId, access);
    // Keep the ordinary account/activation home flow; the report button does not require account linking.
    return false;
  }
  if (callback) await answerCallback(cq.id);
  if (!reportAllowed(access) || !access) {
    if (activeState) await state(db, chatId, null);
    await sendMessage(chatId, '⛔ دسترسی گزارش ثبت‌نام برای شما فعال نیست.');
    return true;
  }
  try {
    if ((command && !commandMatch?.[1]) || text === '/cancel' || text === '/start' || cq?.data === 'ereg:menu') {
      await state(db, chatId, null); await menu(chatId, access); return true;
    }
    const action = callback ? cq.data.slice(5) : commandMatch?.[1] ?? '';
    if (action in labels) {
      await state(db, chatId, null);
      await sendMessage(chatId, '⏳ در حال دریافت آمار ثبت‌نام…');
      await deliverEnrollmentReport(db, chatId, reportRange(action as ReportPeriod), labels[action as ReportPeriod], access);
    } else if (action === 'custom') {
      await state(db, chatId, 'enrollment_report_custom');
      await sendMessage(chatId, 'تاریخ شروع و پایان را به ساعت تهران بفرستید:\n<code>۱۴۰۵/۰۹/۰۱ تا ۱۴۰۵/۰۹/۰۷</code>\nیا با ساعت دقیق:\n<code>2026-11-22 10:00 تا 2026-11-22 15:30</code>\nتاریخ پایان بدون ساعت، شامل کل آن روز است.', { keyboard: [[{ text: 'انصراف', callback_data: 'ereg:menu' }]] });
    } else if (['access', 'grant', 'revoke'].includes(action) || ['enrollment_report_grant', 'enrollment_report_revoke'].includes(activeState)) {
      if (!reportAllowed(access, true)) { await sendMessage(chatId, '⛔ فقط مدیر کل می‌تواند دسترسی گزارش را تغییر دهد.'); return true; }
      if (action === 'access') {
        await state(db, chatId, null);
        const { data: recipients, error } = await db.from('telegram_enrollment_report_access').select('chat_id,can_manage').eq('active', true).order('chat_id');
        if (error) throw error;
        await sendMessage(chatId, `🔐 <b>افراد مجاز گزارش</b>\n${(recipients ?? []).map(r => `<code>${r.chat_id}</code> — ${r.can_manage ? 'مدیر دسترسی' : 'فقط مشاهده'}`).join('\n')}`, { keyboard: [[{ text: 'افزودن شناسه', callback_data: 'ereg:grant' }, { text: 'لغو دسترسی', callback_data: 'ereg:revoke' }], [{ text: 'بازگشت', callback_data: 'ereg:menu' }]] });
      } else if (action === 'grant' || action === 'revoke') {
        await state(db, chatId, `enrollment_report_${action}`);
        await sendMessage(chatId, 'شناسه عددی تلگرام فرد را بفرستید؛ فرد می‌تواند با /myid شناسه خود را از همین ربات بگیرد.', { keyboard: [[{ text: 'انصراف', callback_data: 'ereg:menu' }]] });
      } else {
        const target = numericChatId(text);
        if (!target) throw new Error('شناسه باید عددی باشد، نه نام کاربری یا شناسه گروه');
        const { data: existing, error: lookupError } = await db.from('telegram_enrollment_report_access').select('can_manage').eq('chat_id', target).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing?.can_manage) throw new Error('دسترسی مدیر کل از این بخش قابل تغییر نیست');
        const revoke = activeState === 'enrollment_report_revoke';
        const result = revoke
          ? await db.from('telegram_enrollment_report_access').update({ active: false, granted_by: chatId }).eq('chat_id', target)
          : await db.from('telegram_enrollment_report_access').upsert({ chat_id: target, active: true, can_manage: false, granted_by: chatId });
        if (result.error) throw result.error;
        await state(db, chatId, null);
        if (!revoke) await showEnrollmentReportButton(target, { active: true, can_manage: false });
        await sendMessage(chatId, revoke ? '✅ دسترسی گزارش این شناسه لغو شد.' : '✅ دسترسی مشاهده فعال شد؛ دکمه گزارش برای فرد ارسال شد.');
        await menu(chatId, access);
      }
    } else if (activeState === 'enrollment_report_custom' && !cq) {
      const range = customReportRange(text);
      await deliverEnrollmentReport(db, chatId, range, 'بازه اختصاصی', access);
      await state(db, chatId, null);
    } else if (callback) { await menu(chatId, access); }
    else return false;
  } catch (e) {
    console.error('Enrollment report failed:', e);
    await sendMessage(chatId, `❌ ${escapeHtml(e instanceof Error ? e.message : 'دریافت گزارش ناموفق بود؛ دوباره تلاش کنید.')}`, { keyboard: [[{ text: 'بازگشت', callback_data: 'ereg:menu' }]] });
  }
  return true;
}