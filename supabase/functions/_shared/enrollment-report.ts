import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { sendMessage, answerCallback, escapeHtml, type InlineKeyboard } from './telegram.ts';
import { currentChannel } from './channel.ts';
import { reportRange, customReportRange, reportAllowed, numericChatId, type ReportPeriod } from './enrollment-report-policy.ts';

type Access = { active: boolean; can_manage: boolean };
const labels: Record<ReportPeriod, string> = { hour: 'یک ساعت اخیر', day: '۲۴ ساعت اخیر', week: '۷ روز اخیر', month: '۳۰ روز اخیر' };
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
  const sum = (key: string) => rows.reduce((s: number, r: Record<string, unknown>) => s + Number(r[key] ?? 0), 0);
  const header = `📊 <b>گزارش ثبت‌نام — ${escapeHtml(label)}</b>\nاز ${date(range.from)}\nتا ${date(range.to)} (پایان بازه خارج از شمارش)\n🕒 ساعت تهران\n\nکل ثبت‌نام‌ها: <b>${n(sum('total'))}</b>\nتکمیل‌شده: ${n(sum('completed'))} | در انتظار: ${n(sum('pending'))}\nناموفق/رد/لغو: ${n(sum('failed'))} | سایر: ${n(sum('other'))}\nتکمیل رایگان: ${n(sum('free_completed'))} | تکمیل با مبلغ: ${n(sum('paid_completed'))}\nمبلغ ثبت‌نام‌های تکمیل‌شده: <b>${n(sum('completed_amount'))} تومان</b>\n\nمبنای بازه: زمان ایجاد ثبت‌نام؛ هر رکورد یک ثبت‌نام است، نه یک فرد یکتا. مبلغ فوق گزارش تراکنش‌های دریافتی در این بازه نیست.`;
  const first = await sendMessage(chatId, header);
  if (!first?.ok) throw new Error('ارسال گزارش به تلگرام انجام نشد؛ دوباره تلاش کنید');
  let chunk = '';
  for (const r of rows) {
    const block = `\n🎓 <b>${escapeHtml(String(r.title))}</b>\nکل: ${n(r.total)} | تکمیل: ${n(r.completed)} | انتظار: ${n(r.pending)}\nناموفق/رد/لغو: ${n(r.failed)} | سایر: ${n(r.other)}\nتکمیل رایگان: ${n(r.free_completed)} | تکمیل با مبلغ: ${n(r.paid_completed)}\nمبلغ تکمیل‌شده: ${n(r.completed_amount)} تومان\n`;
    if (chunk.length + block.length > 3400) {
      const sent = await sendMessage(chatId, chunk);
      if (!sent?.ok) throw new Error('ارسال بخشی از گزارش ناموفق بود');
      chunk = '';
    }
    chunk += block;
  }
  if (chunk) {
    const sent = await sendMessage(chatId, chunk);
    if (!sent?.ok) throw new Error('ارسال بخشی از گزارش ناموفق بود');
  }
  console.info('Enrollment report delivered', { courses: rows.length, total: sum('total'), from: range.from, to: range.to });
  await menu(chatId, access);
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
  const command = !!commandMatch || text === '/start enrollment_reports';
  const callback = cq?.data?.startsWith('ereg:');
  const { data: session, error: sessionError } = await db.from('telegram_bot_sessions').select('state,expires_at').eq('chat_id', chatId).eq('channel', 'telegram').maybeSingle();
  if (sessionError) throw sessionError;
  const activeState = session?.state?.startsWith('enrollment_report_') && new Date(session.expires_at) > new Date() ? session.state : null;
  if (!command && !callback && !activeState && text !== '/start') return false;
  const access = await enrollmentReportAccess(db, chatId);
  if (!command && !callback && !activeState && (text !== '/start' || !reportAllowed(access) || access?.can_manage)) return false;
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
        await sendMessage(chatId, revoke ? '✅ دسترسی گزارش این شناسه لغو شد.' : '✅ دسترسی مشاهده فعال شد؛ فرد پس از شروع ربات، /enrollments را بفرستد.');
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