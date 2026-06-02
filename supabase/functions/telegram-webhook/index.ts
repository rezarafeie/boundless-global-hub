// Telegram Bot webhook — full role-based CRM/Lead bot
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  sendMessage,
  editMessage,
  answerCallback,
  escapeHtml,
  formatTehran,
  type InlineKeyboard,
} from '../_shared/telegram.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const WEBHOOK_SECRET = (Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '').replace(/[^A-Za-z0-9_-]/g, '');
const PAGE_SIZE = 5;

// ============ Types ============
type Role = 'admin' | 'sales_manager' | 'sales_agent' | 'student' | null;
interface BotUser {
  id: number;
  name: string;
  role: Role;
  telegram_chat_id: number;
}
interface Filters {
  course_id?: string;
  crm_status?: string; // crm status id or 'no_crm' or undefined
  period?: 'today' | 'week' | 'month' | 'all';
  unassigned?: boolean;
}

// ============ User resolution ============
async function resolveUser(chat_id: number): Promise<BotUser | null> {
  const { data } = await supabase
    .from('chat_users')
    .select('id, name, role, is_messenger_admin, telegram_chat_id')
    .eq('telegram_chat_id', chat_id)
    .maybeSingle();
  if (!data) return null;
  let role: Role = (data.role as Role) ?? 'student';
  if (data.is_messenger_admin) role = 'admin';
  return { id: data.id, name: data.name, role, telegram_chat_id: chat_id };
}

// ============ Session state ============
async function getSession(chat_id: number) {
  const { data } = await supabase.from('telegram_bot_sessions').select('*').eq('chat_id', chat_id).maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  return data;
}

async function setSession(chat_id: number, user_id: number, state: string | null, context: any = {}) {
  const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await supabase.from('telegram_bot_sessions').upsert({
    chat_id, user_id, state, context, expires_at, updated_at: new Date().toISOString(),
  });
}

async function getFilters(chat_id: number): Promise<Filters> {
  const s = await getSession(chat_id);
  return (s?.context?.filters ?? {}) as Filters;
}

async function saveFilters(chat_id: number, user_id: number, filters: Filters) {
  const s = await getSession(chat_id);
  const ctx = { ...(s?.context ?? {}), filters };
  await setSession(chat_id, user_id, s?.state ?? null, ctx);
}

async function clearSession(chat_id: number) {
  await supabase.from('telegram_bot_sessions').delete().eq('chat_id', chat_id);
}

// ============ Menus ============
function mainMenu(role: Role): InlineKeyboard {
  if (role === 'admin') {
    return [
      [{ text: '📋 لیدهای من', callback_data: 'menu:my_leads' }],
      [{ text: '👥 همه لیدها', callback_data: 'menu:all_leads' }],
      [{ text: '🎯 تخصیص دسته‌جمعی', callback_data: 'bulk:start' }],
      [{ text: '📊 گزارش‌ها', callback_data: 'menu:reports' }],
      [{ text: '⚙️ مدیریت سیستم', callback_data: 'admin:menu' }],
    ];
  }
  if (role === 'sales_manager') {
    return [
      [{ text: '📋 لیدهای من', callback_data: 'menu:my_leads' }],
      [{ text: '👥 همه لیدها', callback_data: 'menu:all_leads' }],
      [{ text: '🎯 تخصیص دسته‌جمعی', callback_data: 'bulk:start' }],
      [{ text: '📊 عملکرد تیم', callback_data: 'menu:reports' }],
    ];
  }
  if (role === 'sales_agent') {
    return [
      [{ text: '📋 لیدهای من', callback_data: 'menu:my_leads' }],
      [{ text: '📊 عملکرد امروز', callback_data: 'menu:reports' }],
    ];
  }
  return [];
}

function welcomeText(user: BotUser): string {
  const roleNames: Record<string, string> = {
    admin: 'مدیر کل',
    sales_manager: 'مدیر فروش',
    sales_agent: 'کارشناس فروش',
    student: 'دانشجو',
  };
  return [
    `سلام <b>${escapeHtml(user.name)}</b> 👋`,
    `نقش شما: <b>${roleNames[user.role ?? 'student']}</b>`,
    ``,
    `از منوی زیر استفاده کنید:`,
  ].join('\n');
}

// ============ Filter helpers ============
function periodSince(p?: string): string | null {
  const now = new Date();
  if (p === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  if (p === 'week') return new Date(now.getTime() - 7 * 86400000).toISOString();
  if (p === 'month') return new Date(now.getTime() - 30 * 86400000).toISOString();
  return null;
}

async function getCrmStatusMap() {
  const { data } = await supabase.from('crm_statuses').select('id, label').eq('is_active', true).order('order_index');
  return data ?? [];
}

async function filterByCrmStatus(enrollmentIds: string[], statusFilter: string): Promise<Set<string>> {
  if (!enrollmentIds.length) return new Set();
  // Get phones from enrollments
  const { data: enrs } = await supabase.from('enrollments').select('id, phone').in('id', enrollmentIds);
  const phoneMap = new Map<string, string>(); // phone -> enrollment_id
  enrs?.forEach(e => phoneMap.set(e.phone, e.id));
  const phones = Array.from(phoneMap.keys());
  if (!phones.length) return new Set();

  const { data: users } = await supabase.from('chat_users').select('id, phone').in('phone', phones);
  const userIdToEnr = new Map<number, string>();
  users?.forEach(u => { const e = phoneMap.get(u.phone); if (e) userIdToEnr.set(u.id, e); });

  if (statusFilter === 'no_crm') {
    const withCrm = new Set<string>();
    if (userIdToEnr.size) {
      const { data: notes } = await supabase.from('crm_notes').select('user_id').in('user_id', Array.from(userIdToEnr.keys()));
      notes?.forEach(n => { const e = userIdToEnr.get(n.user_id); if (e) withCrm.add(e); });
    }
    return new Set(enrollmentIds.filter(id => !withCrm.has(id)));
  }

  const statuses = await getCrmStatusMap();
  const target = statuses.find(s => s.id.startsWith(statusFilter));
  if (!target) return new Set();

  const matched = new Set<string>();
  if (userIdToEnr.size) {
    const { data: notes } = await supabase.from('crm_notes')
      .select('user_id, status, created_at').in('user_id', Array.from(userIdToEnr.keys()))
      .order('created_at', { ascending: false });
    const latestByUser = new Map<number, string>();
    notes?.forEach(n => { if (!latestByUser.has(n.user_id)) latestByUser.set(n.user_id, n.status ?? ''); });
    latestByUser.forEach((status, uid) => {
      if (status === target.label) { const e = userIdToEnr.get(uid); if (e) matched.add(e); }
    });
  }
  return matched;
}

// ============ Lead listing ============
async function getAgentLeads(agent_user_id: number, page: number, filters: Filters) {
  const { data: sa } = await supabase.from('sales_agents').select('id').eq('user_id', agent_user_id).maybeSingle();
  if (!sa) return { items: [], total: 0 };

  // Get all assignments for this agent (we need to post-filter by enrollment fields)
  const { data: assignments } = await supabase
    .from('lead_assignments').select('enrollment_id, assigned_at')
    .eq('sales_agent_id', sa.id).order('assigned_at', { ascending: false }).limit(500);

  let enrollmentIds = (assignments ?? []).map(a => a.enrollment_id);
  if (!enrollmentIds.length) return { items: [], total: 0 };

  let q = supabase.from('enrollments')
    .select('id, full_name, phone, payment_amount, created_at, course_id, courses(title)')
    .in('id', enrollmentIds);
  if (filters.course_id) q = q.eq('course_id', filters.course_id);
  const since = periodSince(filters.period);
  if (since) q = q.gte('created_at', since);
  const { data: enrolls } = await q;
  let list = enrolls ?? [];

  if (filters.crm_status) {
    const matched = await filterByCrmStatus(list.map(e => e.id), filters.crm_status);
    list = list.filter(e => matched.has(e.id));
  }

  // Sort by assignment order
  const order = new Map(enrollmentIds.map((id, i) => [id, i]));
  list.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));

  const total = list.length;
  return { items: list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), total };
}

async function getAllLeads(page: number, filters: Filters) {
  let q = supabase.from('enrollments')
    .select('id, full_name, phone, payment_amount, created_at, course_id, courses(title)', { count: 'exact' })
    .in('payment_status', ['success', 'completed']);
  if (filters.course_id) q = q.eq('course_id', filters.course_id);
  const since = periodSince(filters.period);
  if (since) q = q.gte('created_at', since);

  if (filters.unassigned) {
    const { data: assigned } = await supabase.from('lead_assignments').select('enrollment_id').limit(5000);
    const assignedIds = (assigned ?? []).map(a => a.enrollment_id);
    if (assignedIds.length) q = q.not('id', 'in', `(${assignedIds.map(i => `"${i}"`).join(',')})`);
  }

  if (filters.crm_status) {
    // Fetch larger batch then filter
    const { data: candidates } = await q.order('created_at', { ascending: false }).limit(200);
    let list = candidates ?? [];
    const matched = await filterByCrmStatus(list.map(e => e.id), filters.crm_status);
    list = list.filter(e => matched.has(e.id));
    return { items: list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), total: list.length };
  }

  const { data, count } = await q.order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  return { items: data ?? [], total: count ?? 0 };
}

function filtersSummary(f: Filters, courseTitle?: string): string {
  const parts: string[] = [];
  if (f.course_id) parts.push(`📚 ${courseTitle ?? f.course_id.slice(0, 8)}`);
  if (f.period && f.period !== 'all') {
    const p: any = { today: 'امروز', week: 'هفته اخیر', month: 'ماه اخیر' };
    parts.push(`🗓 ${p[f.period]}`);
  }
  if (f.crm_status) parts.push(`🏷 ${f.crm_status === 'no_crm' ? 'بدون CRM' : 'وضعیت خاص'}`);
  if (f.unassigned) parts.push(`🆓 تخصیص‌نشده`);
  return parts.length ? `\n<i>فیلتر: ${parts.join(' • ')}</i>` : '';
}

async function renderLeadsList(
  chat_id: number, message_id: number | null, user: BotUser,
  scope: 'my' | 'all', page = 0,
) {
  const filters = await getFilters(chat_id);
  let courseTitle: string | undefined;
  if (filters.course_id) {
    const { data: c } = await supabase.from('courses').select('title').eq('id', filters.course_id).maybeSingle();
    courseTitle = c?.title;
  }

  const { items, total } = scope === 'my'
    ? await getAgentLeads(user.id, page, filters)
    : await getAllLeads(page, filters);

  const headerText = `📋 <b>${scope === 'my' ? 'لیدهای من' : 'همه لیدها'}</b>${filtersSummary(filters, courseTitle)}`;

  const keyboard: InlineKeyboard = [];
  keyboard.push([{ text: '🔍 فیلترها', callback_data: `filters:open:${scope}` }]);

  if (items.length === 0) {
    keyboard.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);
    const text = `${headerText}\n\n📭 لیدی یافت نشد.`;
    if (message_id) await editMessage(chat_id, message_id, text, keyboard);
    else await sendMessage(chat_id, text, { keyboard });
    return;
  }

  const lines = [headerText, ``, `صفحه ${page + 1} از ${Math.max(1, Math.ceil(total / PAGE_SIZE))} (${total} مورد)`, ''];
  for (const e of items as any[]) {
    const courseTitle2 = e.courses?.title ?? '-';
    lines.push(`• <b>${escapeHtml(e.full_name)}</b> — ${escapeHtml(courseTitle2)}`);
    keyboard.push([{ text: `👁 ${e.full_name}`, callback_data: `lead:view:${e.id}` }]);
  }

  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️ قبلی', callback_data: `leads:${scope}:${page - 1}` });
  if ((page + 1) * PAGE_SIZE < total) nav.push({ text: 'بعدی ➡️', callback_data: `leads:${scope}:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);

  const text = lines.join('\n');
  if (message_id) await editMessage(chat_id, message_id, text, keyboard);
  else await sendMessage(chat_id, text, { keyboard });
}

// ============ Filter menus ============
async function renderFiltersMenu(chat_id: number, message_id: number, scope: 'my' | 'all') {
  const f = await getFilters(chat_id);
  const keyboard: InlineKeyboard = [
    [{ text: `📚 دوره ${f.course_id ? '✅' : ''}`, callback_data: `filters:course:${scope}:0` }],
    [{ text: `🏷 وضعیت CRM ${f.crm_status ? '✅' : ''}`, callback_data: `filters:crm:${scope}` }],
    [{ text: `🗓 بازه زمانی ${f.period && f.period !== 'all' ? '✅' : ''}`, callback_data: `filters:period:${scope}` }],
  ];
  if (scope === 'all') {
    keyboard.push([{ text: `🆓 فقط تخصیص‌نشده ${f.unassigned ? '✅' : ''}`, callback_data: `filters:toggle_unassigned:${scope}` }]);
  }
  keyboard.push([{ text: '🗑 پاک کردن فیلترها', callback_data: `filters:clear:${scope}` }]);
  keyboard.push([{ text: '⬅️ بازگشت به لیست', callback_data: `leads:${scope}:0` }]);
  await editMessage(chat_id, message_id, '🔍 <b>فیلترها:</b>', keyboard);
}

async function renderCoursePicker(chat_id: number, message_id: number, scope: 'my' | 'all', page: number, prefix: string) {
  const { data: courses, count } = await supabase.from('courses').select('id, title', { count: 'exact' })
    .order('created_at', { ascending: false }).range(page * 8, page * 8 + 7);
  const keyboard: InlineKeyboard = (courses ?? []).map(c => [{
    text: c.title, callback_data: `${prefix}:pick:${scope}:${c.id.slice(0, 8)}`,
  }]);
  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️', callback_data: `${prefix}:list:${scope}:${page - 1}` });
  if ((page + 1) * 8 < (count ?? 0)) nav.push({ text: '➡️', callback_data: `${prefix}:list:${scope}:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: '❌ بدون فیلتر دوره', callback_data: `${prefix}:pick:${scope}:none` }]);
  keyboard.push([{ text: '⬅️ بازگشت', callback_data: `filters:open:${scope}` }]);
  await editMessage(chat_id, message_id, '📚 <b>دوره را انتخاب کنید:</b>', keyboard);
}

async function renderCrmStatusPicker(chat_id: number, message_id: number, scope: 'my' | 'all') {
  const statuses = await getCrmStatusMap();
  const keyboard: InlineKeyboard = statuses.map(s => [{
    text: s.label, callback_data: `filters:crm_pick:${scope}:${s.id.slice(0, 8)}`,
  }]);
  keyboard.push([{ text: '🚫 بدون CRM', callback_data: `filters:crm_pick:${scope}:no_crm` }]);
  keyboard.push([{ text: '❌ بدون فیلتر', callback_data: `filters:crm_pick:${scope}:none` }]);
  keyboard.push([{ text: '⬅️ بازگشت', callback_data: `filters:open:${scope}` }]);
  await editMessage(chat_id, message_id, '🏷 <b>وضعیت CRM:</b>', keyboard);
}

async function renderPeriodPicker(chat_id: number, message_id: number, scope: 'my' | 'all') {
  const keyboard: InlineKeyboard = [
    [{ text: 'امروز', callback_data: `filters:period_pick:${scope}:today` }],
    [{ text: 'هفته اخیر', callback_data: `filters:period_pick:${scope}:week` }],
    [{ text: 'ماه اخیر', callback_data: `filters:period_pick:${scope}:month` }],
    [{ text: 'همه', callback_data: `filters:period_pick:${scope}:all` }],
    [{ text: '⬅️ بازگشت', callback_data: `filters:open:${scope}` }],
  ];
  await editMessage(chat_id, message_id, '🗓 <b>بازه زمانی:</b>', keyboard);
}

// ============ Lead detail ============
async function renderLeadDetail(chat_id: number, message_id: number | null, user: BotUser, enrollment_id: string) {
  const { data: enr, error } = await supabase.from('enrollments')
    .select('id, full_name, phone, payment_amount, created_at, course_id, courses(title)')
    .eq('id', enrollment_id).maybeSingle();
  if (error || !enr) {
    const text = `❌ لید یافت نشد.${error ? `\n<code>${escapeHtml(error.message)}</code>` : ''}`;
    if (message_id) await editMessage(chat_id, message_id, text, [[{ text: '🏠', callback_data: 'menu:home' }]]);
    else await sendMessage(chat_id, text);
    return;
  }

  if (user.role === 'sales_agent') {
    const { data: ok } = await supabase.rpc('check_sales_agent_lead_access', {
      p_agent_user_id: user.id, p_enrollment_id: enrollment_id,
    });
    if (!ok) {
      const text = '🚫 شما به این لید دسترسی ندارید.';
      if (message_id) await editMessage(chat_id, message_id, text, [[{ text: '🏠', callback_data: 'menu:home' }]]);
      else await sendMessage(chat_id, text);
      return;
    }
  }

  const { data: chatUser } = await supabase.from('chat_users').select('id').eq('phone', enr.phone).maybeSingle();
  let latestNote: any = null;
  let currentStatus = '-';
  let notesCount = 0;
  if (chatUser?.id) {
    const { data: notes } = await supabase.from('crm_notes')
      .select('content, status, created_at').eq('user_id', chatUser.id)
      .order('created_at', { ascending: false }).limit(5);
    if (notes && notes[0]) {
      latestNote = notes[0];
      currentStatus = notes[0].status ?? '-';
      notesCount = notes.length;
    }
  }

  // Current assignment
  const { data: assign } = await supabase.from('lead_assignments')
    .select('sales_agent_id, sales_agents(chat_users(name))')
    .eq('enrollment_id', enrollment_id).order('assigned_at', { ascending: false }).limit(1);
  const assignedAgent = (assign as any)?.[0]?.sales_agents?.chat_users?.name;

  const lines = [
    `👤 <b>${escapeHtml(enr.full_name)}</b>`,
    `📞 <code>${escapeHtml(enr.phone)}</code>`,
    `📚 ${escapeHtml((enr as any).courses?.title ?? '-')}`,
    `💰 ${enr.payment_amount?.toLocaleString('fa-IR') ?? '-'} تومان`,
    `📅 ${formatTehran(enr.created_at)}`,
    ``,
    `<b>وضعیت فعلی:</b> ${escapeHtml(currentStatus)}`,
    assignedAgent ? `<b>کارشناس:</b> ${escapeHtml(assignedAgent)}` : '<b>کارشناس:</b> تخصیص نیافته',
    `<b>تعداد یادداشت‌ها:</b> ${notesCount}`,
  ];
  if (latestNote?.content) {
    lines.push('', `<b>آخرین یادداشت:</b>`, escapeHtml(latestNote.content.slice(0, 300)));
  }

  const keyboard: InlineKeyboard = [
    [{ text: '✏️ تغییر وضعیت', callback_data: `status:pick:${enrollment_id}` }],
    [{ text: '📝 افزودن یادداشت', callback_data: `note:add:${enrollment_id}` }],
    [{ text: '📜 یادداشت‌ها', callback_data: `notes:list:${enrollment_id}` }],
  ];

  if (user.role === 'admin' || user.role === 'sales_manager') {
    keyboard.push([{ text: '👤 تخصیص به کارشناس', callback_data: `assign:pick:${enrollment_id}` }]);
  }
  keyboard.push([{ text: '⬅️ بازگشت', callback_data: `leads:my:0` }, { text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);

  const text = lines.join('\n');
  if (message_id) await editMessage(chat_id, message_id, text, keyboard);
  else await sendMessage(chat_id, text, { keyboard });
}

async function renderNotesList(chat_id: number, message_id: number, enrollment_id: string) {
  const { data: enr } = await supabase.from('enrollments').select('phone').eq('id', enrollment_id).maybeSingle();
  if (!enr) return;
  const { data: chatUser } = await supabase.from('chat_users').select('id').eq('phone', enr.phone).maybeSingle();
  if (!chatUser) {
    await editMessage(chat_id, message_id, '📭 یادداشتی یافت نشد.', [[{ text: '⬅️ بازگشت', callback_data: `lead:view:${enrollment_id}` }]]);
    return;
  }
  const { data: notes } = await supabase.from('crm_notes')
    .select('content, status, created_at, type').eq('user_id', chatUser.id)
    .order('created_at', { ascending: false }).limit(10);
  const lines = ['📜 <b>یادداشت‌ها (۱۰ مورد اخیر):</b>', ''];
  (notes ?? []).forEach((n, i) => {
    lines.push(`<b>${i + 1}.</b> ${formatTehran(n.created_at)}`);
    if (n.status) lines.push(`   🏷 ${escapeHtml(n.status)}`);
    if (n.content) lines.push(`   ${escapeHtml(n.content.slice(0, 200))}`);
    lines.push('');
  });
  if (!notes?.length) lines.push('یادداشتی یافت نشد.');
  await editMessage(chat_id, message_id, lines.join('\n'), [[{ text: '⬅️ بازگشت', callback_data: `lead:view:${enrollment_id}` }]]);
}

// ============ Status picker ============
async function renderStatusPicker(chat_id: number, message_id: number, enrollment_id: string) {
  const statuses = await getCrmStatusMap();
  const keyboard: InlineKeyboard = statuses.map(s => [{
    text: s.label, callback_data: `status:set:${enrollment_id}:${s.id.slice(0, 8)}`,
  }]);
  keyboard.push([{ text: '⬅️ انصراف', callback_data: `lead:view:${enrollment_id}` }]);
  await editMessage(chat_id, message_id, '✏️ <b>وضعیت جدید را انتخاب کنید:</b>', keyboard);
}

async function setLeadStatus(user: BotUser, enrollment_id: string, statusPrefix: string): Promise<string> {
  const statuses = await getCrmStatusMap();
  const status = statuses.find(s => s.id.startsWith(statusPrefix));
  if (!status) return '❌ وضعیت یافت نشد';

  const { data: enr } = await supabase.from('enrollments').select('phone, course_id').eq('id', enrollment_id).maybeSingle();
  if (!enr) return '❌ لید یافت نشد';
  const { data: chatUser } = await supabase.from('chat_users').select('id').eq('phone', enr.phone).maybeSingle();
  if (!chatUser) return '❌ کاربر یافت نشد';

  const { error } = await supabase.from('crm_notes').insert({
    user_id: chatUser.id, type: 'status_change',
    content: `تغییر وضعیت از طریق تلگرام توسط ${user.name}`,
    status: status.label, course_id: enr.course_id, created_by: String(user.id),
  });
  if (error) return `❌ خطا: ${error.message}`;
  return `✅ وضعیت به «${status.label}» تغییر یافت.`;
}

// ============ Agent picker (single assign) ============
async function renderAgentPicker(chat_id: number, message_id: number, enrollment_id: string) {
  const { data: agents } = await supabase.from('sales_agents')
    .select('user_id, chat_users!inner(id, name)').eq('is_active', true).limit(30);

  const keyboard: InlineKeyboard = (agents ?? []).map((a: any) => [{
    text: a.chat_users.name, callback_data: `assign:do:${enrollment_id}:${a.user_id}`,
  }]);
  keyboard.push([{ text: '⬅️ انصراف', callback_data: `lead:view:${enrollment_id}` }]);
  await editMessage(chat_id, message_id, '👤 <b>کارشناس را انتخاب کنید:</b>', keyboard);
}

async function assignLead(assignerId: number, enrollment_id: string, agent_user_id: number): Promise<string> {
  const { data, error } = await supabase.rpc('distribute_lead_to_agent', {
    p_enrollment_id: enrollment_id, p_agent_user_id: agent_user_id, p_assigned_by: assignerId,
  });
  if (error || !data) return `❌ تخصیص ناموفق${error ? `: ${error.message}` : ''}`;

  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ type: 'lead_assigned', agent_user_id, enrollment_id }),
    });
  } catch (e) { console.error('notify failed:', e); }

  return '✅ لید با موفقیت تخصیص یافت.';
}

// ============ Bulk assignment ============
async function bulkStart(chat_id: number, message_id: number, user_id: number, page = 0) {
  const { data: courses, count } = await supabase.from('courses').select('id, title', { count: 'exact' })
    .order('created_at', { ascending: false }).range(page * 8, page * 8 + 7);
  const keyboard: InlineKeyboard = (courses ?? []).map(c => [{
    text: c.title, callback_data: `bulk:course:${c.id.slice(0, 8)}`,
  }]);
  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️', callback_data: `bulk:courses:${page - 1}` });
  if ((page + 1) * 8 < (count ?? 0)) nav.push({ text: '➡️', callback_data: `bulk:courses:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);
  await editMessage(chat_id, message_id, '🎯 <b>تخصیص دسته‌جمعی</b>\n\nگام ۱: دوره را انتخاب کنید:', keyboard);
}

async function bulkPickAgent(chat_id: number, message_id: number, user: BotUser, course_full_id: string) {
  await setSession(chat_id, user.id, 'bulk', { course_id: course_full_id });
  const { data: agents } = await supabase.from('sales_agents')
    .select('user_id, chat_users!inner(id, name)').eq('is_active', true).limit(30);
  const keyboard: InlineKeyboard = (agents ?? []).map((a: any) => [{
    text: a.chat_users.name, callback_data: `bulk:agent:${a.user_id}`,
  }]);
  keyboard.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);

  // Count unassigned in this course
  const { data: enrs } = await supabase.from('enrollments').select('id')
    .eq('course_id', course_full_id).in('payment_status', ['success', 'completed']).limit(2000);
  const allIds = (enrs ?? []).map(e => e.id);
  let unassignedCount = 0;
  if (allIds.length) {
    const { data: assigned } = await supabase.from('lead_assignments').select('enrollment_id').in('enrollment_id', allIds);
    const assignedSet = new Set((assigned ?? []).map(a => a.enrollment_id));
    unassignedCount = allIds.filter(id => !assignedSet.has(id)).length;
  }

  await editMessage(chat_id, message_id,
    `🎯 <b>تخصیص دسته‌جمعی</b>\n\nلیدهای تخصیص‌نشده: <b>${unassignedCount}</b>\n\nگام ۲: کارشناس را انتخاب کنید:`,
    keyboard);
}

async function bulkPickCount(chat_id: number, message_id: number, user: BotUser, agent_user_id: number) {
  const s = await getSession(chat_id);
  const course_id = s?.context?.course_id;
  if (!course_id) { await editMessage(chat_id, message_id, '❌ خطا. لطفاً دوباره شروع کنید.', [[{ text: '🏠', callback_data: 'menu:home' }]]); return; }
  await setSession(chat_id, user.id, 'bulk', { ...s!.context, agent_user_id });

  const keyboard: InlineKeyboard = [
    [{ text: '۱۰', callback_data: 'bulk:run:10' }, { text: '۲۰', callback_data: 'bulk:run:20' }, { text: '۵۰', callback_data: 'bulk:run:50' }],
    [{ text: '۱۰۰', callback_data: 'bulk:run:100' }, { text: 'همه', callback_data: 'bulk:run:all' }],
    [{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }],
  ];
  await editMessage(chat_id, message_id, '🎯 <b>تخصیص دسته‌جمعی</b>\n\nگام ۳: چند لید تخصیص داده شود؟', keyboard);
}

async function bulkRun(chat_id: number, message_id: number, user: BotUser, countStr: string) {
  const s = await getSession(chat_id);
  const course_id = s?.context?.course_id;
  const agent_user_id = s?.context?.agent_user_id;
  if (!course_id || !agent_user_id) {
    await editMessage(chat_id, message_id, '❌ خطا در دریافت پارامترها.', [[{ text: '🏠', callback_data: 'menu:home' }]]);
    return;
  }
  await editMessage(chat_id, message_id, '⏳ در حال تخصیص...', []);

  const { data: enrs } = await supabase.from('enrollments').select('id')
    .eq('course_id', course_id).in('payment_status', ['success', 'completed']).limit(2000);
  const allIds = (enrs ?? []).map(e => e.id);
  const { data: assigned } = await supabase.from('lead_assignments').select('enrollment_id').in('enrollment_id', allIds);
  const assignedSet = new Set((assigned ?? []).map(a => a.enrollment_id));
  let pool = allIds.filter(id => !assignedSet.has(id));
  if (countStr !== 'all') pool = pool.slice(0, parseInt(countStr));

  let ok = 0, fail = 0;
  for (const eid of pool) {
    const { data, error } = await supabase.rpc('distribute_lead_to_agent', {
      p_enrollment_id: eid, p_agent_user_id: agent_user_id, p_assigned_by: user.id,
    });
    if (error || !data) fail++; else ok++;
  }

  await clearSession(chat_id);

  // Notify the agent once
  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ type: 'bulk_assigned', agent_user_id, count: ok }),
    });
  } catch (e) { console.error('notify failed:', e); }

  await sendMessage(chat_id,
    `✅ <b>تخصیص دسته‌جمعی انجام شد</b>\n\n✔️ موفق: <b>${ok}</b>\n❌ ناموفق: <b>${fail}</b>`,
    { keyboard: [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]] });
}

// ============ Admin: System management ============
async function adminMenu(chat_id: number, message_id: number) {
  const keyboard: InlineKeyboard = [
    [{ text: '📊 آمار سیستم', callback_data: 'admin:stats' }],
    [{ text: '👥 کاربران لینک‌شده', callback_data: 'admin:linked:0' }],
    [{ text: '🔗 لینک کاربر با شماره موبایل', callback_data: 'admin:link_phone' }],
    [{ text: '📢 ارسال پیام همگانی', callback_data: 'admin:broadcast' }],
    [{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }],
  ];
  await editMessage(chat_id, message_id, '⚙️ <b>مدیریت سیستم</b>', keyboard);
}

async function adminStats(chat_id: number, message_id: number) {
  const [{ count: totalLeads }, { count: totalAgents }, { count: linked }, { count: pendingC }] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('payment_status', ['success', 'completed']),
    supabase.from('sales_agents').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('chat_users').select('id', { count: 'exact', head: true }).not('telegram_chat_id', 'is', null),
    supabase.from('consultation_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  const text = [
    `📊 <b>آمار کلی سیستم</b>`,
    ``,
    `🎯 کل لیدهای موفق: <b>${totalLeads ?? 0}</b>`,
    `👥 کارشناسان فعال: <b>${totalAgents ?? 0}</b>`,
    `🤖 کاربران لینک‌شده تلگرام: <b>${linked ?? 0}</b>`,
    `📅 مشاوره‌های در انتظار: <b>${pendingC ?? 0}</b>`,
  ].join('\n');
  await editMessage(chat_id, message_id, text, [[{ text: '⬅️ بازگشت', callback_data: 'admin:menu' }]]);
}

async function adminListLinked(chat_id: number, message_id: number, page: number) {
  const { data, count } = await supabase.from('chat_users')
    .select('id, name, phone, role, telegram_chat_id', { count: 'exact' })
    .not('telegram_chat_id', 'is', null).order('telegram_linked_at', { ascending: false })
    .range(page * 10, page * 10 + 9);
  const lines = [`👥 <b>کاربران لینک‌شده</b> — ${count ?? 0} کاربر`, ``];
  (data ?? []).forEach(u => {
    lines.push(`• ${escapeHtml(u.name)} — ${escapeHtml(u.role ?? '-')} — <code>${u.telegram_chat_id}</code>`);
  });
  const keyboard: InlineKeyboard = [];
  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️', callback_data: `admin:linked:${page - 1}` });
  if ((page + 1) * 10 < (count ?? 0)) nav.push({ text: '➡️', callback_data: `admin:linked:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: '⬅️ بازگشت', callback_data: 'admin:menu' }]);
  await editMessage(chat_id, message_id, lines.join('\n'), keyboard);
}

// ============ Reports ============
async function renderReports(chat_id: number, message_id: number | null, user: BotUser) {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  let text: string;
  if (user.role === 'sales_agent') {
    const { data: sa } = await supabase.from('sales_agents').select('id').eq('user_id', user.id).maybeSingle();
    const { count: todayLeads } = await supabase.from('lead_assignments').select('id', { count: 'exact', head: true })
      .eq('sales_agent_id', sa?.id ?? 0).gte('assigned_at', iso);
    const { count: notesCount } = await supabase.from('crm_notes').select('id', { count: 'exact', head: true })
      .eq('created_by', String(user.id)).gte('created_at', iso);
    const { count: totalAssigned } = await supabase.from('lead_assignments').select('id', { count: 'exact', head: true })
      .eq('sales_agent_id', sa?.id ?? 0);
    text = [
      `📊 <b>عملکرد امروز شما</b>`, ``,
      `🎯 لیدهای جدید امروز: <b>${todayLeads ?? 0}</b>`,
      `📝 یادداشت‌های امروز: <b>${notesCount ?? 0}</b>`,
      `📋 کل لیدهای تخصیص یافته: <b>${totalAssigned ?? 0}</b>`,
    ].join('\n');
  } else {
    const { count: totalLeads } = await supabase.from('enrollments').select('id', { count: 'exact', head: true })
      .in('payment_status', ['success', 'completed']).gte('created_at', iso);
    const { count: totalAgents } = await supabase.from('sales_agents').select('id', { count: 'exact', head: true }).eq('is_active', true);
    const { count: pendingConsultations } = await supabase.from('consultation_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: assignedToday } = await supabase.from('lead_assignments').select('id', { count: 'exact', head: true }).gte('assigned_at', iso);
    text = [
      `📊 <b>گزارش کلی امروز</b>`, ``,
      `🎯 لیدهای جدید امروز: <b>${totalLeads ?? 0}</b>`,
      `🎯 تخصیص‌های امروز: <b>${assignedToday ?? 0}</b>`,
      `👥 کارشناسان فعال: <b>${totalAgents ?? 0}</b>`,
      `📅 مشاوره‌های در انتظار: <b>${pendingConsultations ?? 0}</b>`,
    ].join('\n');
  }

  const keyboard: InlineKeyboard = [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]];
  if (message_id) await editMessage(chat_id, message_id, text, keyboard);
  else await sendMessage(chat_id, text, { keyboard });
}

// ============ Update routing ============
async function handleUpdate(update: any) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chat_id = cq.message.chat.id;
    const message_id = cq.message.message_id;
    const data: string = cq.data;
    await answerCallback(cq.id);

    const user = await resolveUser(chat_id);
    if (!user) { await sendMessage(chat_id, '🚫 حساب شما لینک نشده.'); return; }

    const [action, ...rest] = data.split(':');

    try {
      if (action === 'menu') {
        const sub = rest[0];
        if (sub === 'home') {
          await clearSession(chat_id);
          await editMessage(chat_id, message_id, welcomeText(user), mainMenu(user.role));
        } else if (sub === 'my_leads') {
          await renderLeadsList(chat_id, message_id, user, 'my', 0);
        } else if (sub === 'all_leads') {
          if (user.role === 'sales_agent') {
            await editMessage(chat_id, message_id, '🚫 دسترسی ندارید.', [[{ text: '🏠', callback_data: 'menu:home' }]]);
          } else {
            await renderLeadsList(chat_id, message_id, user, 'all', 0);
          }
        } else if (sub === 'reports') {
          await renderReports(chat_id, message_id, user);
        }
        return;
      }

      if (action === 'leads') {
        const scope = rest[0] as 'my' | 'all';
        const page = parseInt(rest[1] ?? '0');
        if (scope === 'all' && user.role === 'sales_agent') return;
        await renderLeadsList(chat_id, message_id, user, scope, page);
        return;
      }

      if (action === 'lead' && rest[0] === 'view') {
        await renderLeadDetail(chat_id, message_id, user, rest[1]);
        return;
      }
      if (action === 'notes' && rest[0] === 'list') {
        await renderNotesList(chat_id, message_id, rest[1]);
        return;
      }

      if (action === 'status') {
        if (rest[0] === 'pick') await renderStatusPicker(chat_id, message_id, rest[1]);
        else if (rest[0] === 'set') {
          const msg = await setLeadStatus(user, rest[1], rest[2]);
          await editMessage(chat_id, message_id, msg, [[{ text: '⬅️ بازگشت به لید', callback_data: `lead:view:${rest[1]}` }]]);
        }
        return;
      }

      if (action === 'note' && rest[0] === 'add') {
        await setSession(chat_id, user.id, 'awaiting_note', { enrollment_id: rest[1] });
        await editMessage(chat_id, message_id, '📝 لطفاً متن یادداشت را ارسال کنید:\n\n/cancel برای انصراف',
          [[{ text: '⬅️ انصراف', callback_data: `lead:view:${rest[1]}` }]]);
        return;
      }

      if (action === 'assign') {
        if (user.role === 'sales_agent') return;
        if (rest[0] === 'pick') await renderAgentPicker(chat_id, message_id, rest[1]);
        else if (rest[0] === 'do') {
          const msg = await assignLead(user.id, rest[1], parseInt(rest[2]));
          await editMessage(chat_id, message_id, msg, [[{ text: '⬅️ بازگشت به لید', callback_data: `lead:view:${rest[1]}` }]]);
        }
        return;
      }

      if (action === 'filters') {
        const sub = rest[0];
        const scope = rest[1] as 'my' | 'all';
        if (sub === 'open') { await renderFiltersMenu(chat_id, message_id, scope); return; }
        if (sub === 'clear') { await saveFilters(chat_id, user.id, {}); await renderFiltersMenu(chat_id, message_id, scope); return; }
        if (sub === 'course') { await renderCoursePicker(chat_id, message_id, scope, parseInt(rest[2] ?? '0'), 'filters'); return; }
        if (sub === 'list') { await renderCoursePicker(chat_id, message_id, scope, parseInt(rest[2] ?? '0'), 'filters'); return; }
        if (sub === 'pick') {
          const prefix = rest[2];
          const f = await getFilters(chat_id);
          if (prefix === 'none') delete f.course_id;
          else {
            const { data: courses } = await supabase.from('courses').select('id').limit(1000);
            const match = (courses ?? []).find((c: any) => c.id.startsWith(prefix));
            if (match) f.course_id = match.id;
          }
          await saveFilters(chat_id, user.id, f);
          await renderFiltersMenu(chat_id, message_id, scope);
          return;
        }
        if (sub === 'crm') { await renderCrmStatusPicker(chat_id, message_id, scope); return; }
        if (sub === 'crm_pick') {
          const v = rest[2];
          const f = await getFilters(chat_id);
          if (v === 'none') delete f.crm_status; else f.crm_status = v;
          await saveFilters(chat_id, user.id, f);
          await renderFiltersMenu(chat_id, message_id, scope);
          return;
        }
        if (sub === 'period') { await renderPeriodPicker(chat_id, message_id, scope); return; }
        if (sub === 'period_pick') {
          const f = await getFilters(chat_id);
          f.period = rest[2] as any;
          await saveFilters(chat_id, user.id, f);
          await renderFiltersMenu(chat_id, message_id, scope);
          return;
        }
        if (sub === 'toggle_unassigned') {
          const f = await getFilters(chat_id);
          f.unassigned = !f.unassigned;
          await saveFilters(chat_id, user.id, f);
          await renderFiltersMenu(chat_id, message_id, scope);
          return;
        }
      }

      if (action === 'bulk') {
        if (user.role === 'sales_agent') return;
        const sub = rest[0];
        if (sub === 'start') { await bulkStart(chat_id, message_id, user.id, 0); return; }
        if (sub === 'courses') { await bulkStart(chat_id, message_id, user.id, parseInt(rest[1] ?? '0')); return; }
        if (sub === 'course') {
          const prefix = rest[1];
          const { data: courses } = await supabase.from('courses').select('id').limit(1000);
          const match = (courses ?? []).find((c: any) => c.id.startsWith(prefix));
          if (match) await bulkPickAgent(chat_id, message_id, user, match.id);
          return;
        }
        if (sub === 'agent') { await bulkPickCount(chat_id, message_id, user, parseInt(rest[1])); return; }
        if (sub === 'run') { await bulkRun(chat_id, message_id, user, rest[1]); return; }
      }

      if (action === 'admin') {
        if (user.role !== 'admin') return;
        const sub = rest[0];
        if (sub === 'menu') { await adminMenu(chat_id, message_id); return; }
        if (sub === 'stats') { await adminStats(chat_id, message_id); return; }
        if (sub === 'linked') { await adminListLinked(chat_id, message_id, parseInt(rest[1] ?? '0')); return; }
        if (sub === 'link_phone') {
          await setSession(chat_id, user.id, 'awaiting_link_phone', {});
          await editMessage(chat_id, message_id, '🔗 شماره موبایل کاربر و سپس Chat ID را با فرمت زیر ارسال کنید:\n\n<code>09xxxxxxxxx 123456789</code>\n\n/cancel برای انصراف',
            [[{ text: '⬅️ انصراف', callback_data: 'admin:menu' }]]);
          return;
        }
        if (sub === 'broadcast') {
          await setSession(chat_id, user.id, 'awaiting_broadcast', {});
          await editMessage(chat_id, message_id, '📢 متن پیام همگانی را ارسال کنید (به تمام کاربران لینک‌شده ارسال می‌شود):\n\n/cancel برای انصراف',
            [[{ text: '⬅️ انصراف', callback_data: 'admin:menu' }]]);
          return;
        }
      }
    } catch (e: any) {
      console.error('callback error:', e, 'data:', data);
      try {
        await editMessage(chat_id, message_id, `❌ خطا: <code>${escapeHtml(String(e?.message ?? e))}</code>`,
          [[{ text: '🏠', callback_data: 'menu:home' }]]);
      } catch {}
    }
    return;
  }

  // Messages
  const msg = update.message ?? update.edited_message;
  if (!msg?.chat?.id) return;
  const chat_id = msg.chat.id;
  const text: string = msg.text ?? '';

  if (text === '/myid') {
    await sendMessage(chat_id, `🆔 Chat ID شما: <code>${chat_id}</code>`);
    return;
  }

  const user = await resolveUser(chat_id);
  if (!user) {
    await sendMessage(chat_id, [
      `🚫 <b>حساب شما لینک نشده است.</b>`, ``,
      `Chat ID شما: <code>${chat_id}</code>`, ``,
      `این عدد را به مدیر سیستم بدهید.`,
    ].join('\n'));
    return;
  }

  if (text === '/start') {
    await clearSession(chat_id);
    await sendMessage(chat_id, welcomeText(user), { keyboard: mainMenu(user.role) });
    return;
  }
  if (text === '/cancel') {
    await clearSession(chat_id);
    await sendMessage(chat_id, '✅ لغو شد.', { keyboard: mainMenu(user.role) });
    return;
  }
  if (text === '/help') {
    await sendMessage(chat_id, `<b>دستورات:</b>\n/start — منوی اصلی\n/cancel — لغو\n/myid — Chat ID\n/help — راهنما`);
    return;
  }

  const session = await getSession(chat_id);
  if (session?.state === 'awaiting_note' && text) {
    const enrollment_id = session.context.enrollment_id;
    const { data: enr } = await supabase.from('enrollments').select('phone, course_id').eq('id', enrollment_id).maybeSingle();
    if (enr) {
      const { data: chatUser } = await supabase.from('chat_users').select('id').eq('phone', enr.phone).maybeSingle();
      if (chatUser) {
        await supabase.from('crm_notes').insert({
          user_id: chatUser.id, type: 'note', content: text,
          course_id: enr.course_id, created_by: String(user.id),
        });
        await clearSession(chat_id);
        await sendMessage(chat_id, '✅ یادداشت ثبت شد.',
          { keyboard: [[{ text: '⬅️ بازگشت به لید', callback_data: `lead:view:${enrollment_id}` }]] });
        return;
      }
    }
    await clearSession(chat_id);
    await sendMessage(chat_id, '❌ خطا در ثبت یادداشت.');
    return;
  }

  if (session?.state === 'awaiting_link_phone' && text && user.role === 'admin') {
    const parts = text.trim().split(/\s+/);
    if (parts.length !== 2 || !/^\d+$/.test(parts[1])) {
      await sendMessage(chat_id, '❌ فرمت اشتباه. مثال: <code>09120000000 123456789</code>');
      return;
    }
    const phoneInput = parts[0].replace(/^0/, '');
    const linkChatId = parseInt(parts[1]);
    const { data: u } = await supabase.from('chat_users').select('id, name').eq('phone', phoneInput).maybeSingle();
    if (!u) { await sendMessage(chat_id, '❌ کاربری با این شماره یافت نشد.'); return; }
    const { error } = await supabase.from('chat_users')
      .update({ telegram_chat_id: linkChatId, telegram_linked_at: new Date().toISOString() })
      .eq('id', u.id);
    await clearSession(chat_id);
    if (error) await sendMessage(chat_id, `❌ خطا: ${error.message}`);
    else await sendMessage(chat_id, `✅ <b>${escapeHtml(u.name)}</b> به Chat ID <code>${linkChatId}</code> لینک شد.`,
      { keyboard: mainMenu(user.role) });
    return;
  }

  if (session?.state === 'awaiting_broadcast' && text && user.role === 'admin') {
    const { data: targets } = await supabase.from('chat_users')
      .select('telegram_chat_id').not('telegram_chat_id', 'is', null).limit(2000);
    let ok = 0, fail = 0;
    for (const t of (targets ?? [])) {
      try {
        const r = await sendMessage(t.telegram_chat_id as number, `📢 <b>اطلاعیه:</b>\n\n${escapeHtml(text)}`);
        if ((r as any)?.ok) ok++; else fail++;
      } catch { fail++; }
    }
    await clearSession(chat_id);
    await sendMessage(chat_id, `✅ ارسال شد. موفق: <b>${ok}</b> — ناموفق: <b>${fail}</b>`,
      { keyboard: mainMenu(user.role) });
    return;
  }

  await sendMessage(chat_id, 'برای مشاهده منو /start را ارسال کنید.');
}

// ============ HTTP entry ============
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
  if (WEBHOOK_SECRET && secretHeader !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }
  try {
    const update = await req.json();
    handleUpdate(update).catch(e => console.error('handleUpdate error:', e));
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('webhook error:', e);
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
