// Shared helpers for the daily report feature (Telegram + admin summaries).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

export type ReportRole = 'sales' | 'support';

export interface FieldDef {
  key: string;
  label: string;
  emoji: string;
}

export const SALES_FIELDS: FieldDef[] = [
  { key: 'calls_made', emoji: '📞', label: 'تعداد تماس‌های برقرار شده امروز' },
  { key: 'crm_entries', emoji: '📝', label: 'تعداد ورودی‌های CRM ثبت‌شده' },
  { key: 'successful_conversions', emoji: '✅', label: 'تعداد تبدیل‌های موفق' },
  { key: 'failed_leads', emoji: '❌', label: 'تعداد لیدهای ناموفق / بدون پاسخ' },
  { key: 'followups_scheduled', emoji: '⏰', label: 'تعداد پیگیری‌های برنامه‌ریزی‌شده' },
];

export const SUPPORT_FIELDS: FieldDef[] = [
  { key: 'telegram_academy_replies', emoji: '💬', label: 'پاسخ‌های پشتیبانی تلگرام آکادمی' },
  { key: 'telegram_boundless_replies', emoji: '💬', label: 'پاسخ‌های پشتیبانی تلگرام بدون‌مرز' },
  { key: 'website_support_replies', emoji: '🌐', label: 'پاسخ‌های پشتیبانی سایت' },
];

export function getFields(role: ReportRole): FieldDef[] {
  return role === 'sales' ? SALES_FIELDS : SUPPORT_FIELDS;
}

const ROLE_LABEL: Record<ReportRole, string> = {
  sales: 'فروش',
  support: 'پشتیبانی',
};

export async function saveDailyReport(
  user_id: number,
  role: ReportRole,
  data: Record<string, number>,
  notes: string | null,
) {
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('daily_reports')
    .select('id')
    .eq('user_id', user_id)
    .eq('report_date', today)
    .eq('role', role)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('daily_reports')
      .update({ data, notes, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return { id: existing.id, updated: true };
  }
  const { data: inserted } = await supabase.from('daily_reports')
    .insert({ user_id, role, report_date: today, data, notes })
    .select('id').single();
  return { id: inserted?.id, updated: false };
}

export async function fetchPreviousReports(
  user_id: number,
  role: ReportRole,
  days = 7,
) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data } = await supabase
    .from('daily_reports')
    .select('report_date, data, notes')
    .eq('user_id', user_id)
    .eq('role', role)
    .gte('report_date', from.toISOString().split('T')[0])
    .order('report_date', { ascending: false });
  return data ?? [];
}

function formatReportSummary(role: ReportRole, data: Record<string, number>): string {
  return getFields(role)
    .map(f => `${f.emoji} ${f.label}: ${data[f.key] ?? 0}`)
    .join('\n');
}

export function renderReportCardHtml(
  userName: string,
  role: ReportRole,
  data: Record<string, number>,
  notes: string | null,
): string {
  const lines = [
    `📋 <b>گزارش روزانه — ${ROLE_LABEL[role]}</b>`,
    `👤 ${userName}`,
    '',
    formatReportSummary(role, data),
  ];
  if (notes) lines.push('', `📝 ${notes}`);
  return lines.join('\n');
}

async function aiCall(system: string, user: string): Promise<string> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return 'تحلیل هوش مصنوعی در دسترس نیست (کلید تنظیم نشده).';
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) return `خطای تحلیل: ${res.status}`;
    const j = await res.json();
    return j?.choices?.[0]?.message?.content?.trim() || '—';
  } catch (e) {
    return `خطای تحلیل: ${(e as Error).message}`;
  }
}

export async function generateUserAnalysis(
  userName: string,
  role: ReportRole,
  todayData: Record<string, number>,
  notes: string | null,
  history: { report_date: string; data: any }[],
): Promise<string> {
  const historyText = history.length
    ? history.map(h => `- ${h.report_date}: ${JSON.stringify(h.data)}`).join('\n')
    : 'سابقه‌ای موجود نیست.';
  const sys = `تو یک تحلیلگر عملکرد تیم آکادمی رفیعی هستی. یک پاراگراف کوتاه، صمیمی و به زبان فارسی روان بنویس (حداکثر ۴ جمله). عملکرد امروز کاربر را ارزیابی کن، با روزهای قبل مقایسه کن (رشد یا افت)، و در یک جمله پیشنهاد کاربردی برای فردا بده. از ایموجی متعادل استفاده کن.`;
  const usr = [
    `کاربر: ${userName} — نقش: ${ROLE_LABEL[role]}`,
    `گزارش امروز: ${JSON.stringify(todayData)}`,
    notes ? `یادداشت کاربر: ${notes}` : '',
    `سابقه ۷ روز اخیر:\n${historyText}`,
  ].filter(Boolean).join('\n');
  return aiCall(sys, usr);
}

export async function generateAdminPeriodSummary(
  period: 'today' | 'week' | 'month',
): Promise<{ text: string; stats: any }> {
  const now = new Date();
  const start = new Date(now);
  if (period === 'today') start.setHours(0, 0, 0, 0);
  else if (period === 'week') start.setDate(now.getDate() - 7);
  else start.setDate(now.getDate() - 30);
  const startDate = start.toISOString().split('T')[0];

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('user_id, role, report_date, data, notes, chat_users:user_id(name)')
    .gte('report_date', startDate)
    .order('report_date', { ascending: false });

  const list = reports ?? [];
  const sales = list.filter((r: any) => r.role === 'sales');
  const support = list.filter((r: any) => r.role === 'support');

  const sumField = (arr: any[], k: string) =>
    arr.reduce((s, r) => s + (Number(r.data?.[k]) || 0), 0);

  const stats = {
    total_reports: list.length,
    unique_users: new Set(list.map((r: any) => r.user_id)).size,
    sales: {
      count: sales.length,
      calls: sumField(sales, 'calls_made'),
      crm: sumField(sales, 'crm_entries'),
      conversions: sumField(sales, 'successful_conversions'),
      failed: sumField(sales, 'failed_leads'),
      followups: sumField(sales, 'followups_scheduled'),
    },
    support: {
      count: support.length,
      academy: sumField(support, 'telegram_academy_replies'),
      boundless: sumField(support, 'telegram_boundless_replies'),
      website: sumField(support, 'website_support_replies'),
    },
  };

  const periodLabel = period === 'today' ? 'امروز' : period === 'week' ? '۷ روز اخیر' : '۳۰ روز اخیر';
  const sys = `تو تحلیلگر ارشد آکادمی رفیعی هستی. با داده‌های گزارش‌های روزانه تیم فروش و پشتیبانی، یک تحلیل مدیریتی جامع بنویس (حداکثر ۶ جمله، فارسی روان). نکات کلیدی، ضعف‌ها، نقاط قوت و توصیه عملی برای مدیر مطرح کن. از ایموجی کم استفاده کن.`;
  const usr = [
    `دوره: ${periodLabel}`,
    `تعداد گزارش‌ها: ${stats.total_reports} (${stats.unique_users} کاربر)`,
    `فروش — تماس: ${stats.sales.calls}، CRM: ${stats.sales.crm}، تبدیل موفق: ${stats.sales.conversions}، ناموفق: ${stats.sales.failed}، پیگیری: ${stats.sales.followups}`,
    `پشتیبانی — آکادمی: ${stats.support.academy}، بدون‌مرز: ${stats.support.boundless}، سایت: ${stats.support.website}`,
  ].join('\n');
  const ai = await aiCall(sys, usr);

  const header = [
    `📊 <b>خلاصه ${periodLabel}</b>`,
    `تعداد گزارش‌ها: <b>${stats.total_reports}</b> از <b>${stats.unique_users}</b> کاربر`,
    '',
    `🏷 <b>فروش</b>`,
    `📞 تماس‌ها: ${stats.sales.calls} | 📝 CRM: ${stats.sales.crm}`,
    `✅ موفق: ${stats.sales.conversions} | ❌ ناموفق: ${stats.sales.failed} | ⏰ پیگیری: ${stats.sales.followups}`,
    '',
    `🎧 <b>پشتیبانی</b>`,
    `💬 آکادمی: ${stats.support.academy} | 💬 بدون‌مرز: ${stats.support.boundless} | 🌐 سایت: ${stats.support.website}`,
    '',
    `🤖 <b>تحلیل AI:</b>`,
    ai,
  ].join('\n');
  return { text: header, stats };
}

export async function getAdminChatIds(): Promise<number[]> {
  const { data } = await supabase
    .from('chat_users')
    .select('telegram_chat_id')
    .eq('is_messenger_admin', true)
    .not('telegram_chat_id', 'is', null);
  return (data ?? []).map((r: any) => Number(r.telegram_chat_id)).filter(Boolean);
}
