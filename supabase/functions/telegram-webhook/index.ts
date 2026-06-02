// Telegram Bot webhook — full role-based CRM/Lead bot
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  sendMessage,
  editMessage,
  answerCallback,
  escapeHtml,
  formatTehran,
  downloadFile,
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

async function setSession(chat_id: number, user_id: number | null, state: string | null, context: any = {}) {
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
  // Default: student
  return [
    [{ text: '🎓 دوره‌های من', callback_data: 'student:my_courses' }],
    [{ text: '🧪 آزمون‌های من', callback_data: 'student:my_tests' }],
    [{ text: '🛒 ثبت‌نام در دوره جدید', callback_data: 'student:browse:0' }],
    [{ text: '👤 پروفایل', callback_data: 'student:profile' }],
  ];
}

function loginMenu(): InlineKeyboard {
  return [[{ text: '🔐 ورود با شماره موبایل', callback_data: 'login:start' }]];
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

// ============ Student / Login flow ============
const ACADEMY_BASE = 'https://academy.rafiei.co';

function normalizePhoneIR(input: string): { local: string; formatted: string } | null {
  // local: 9XXXXXXXXX (no leading 0)  formatted: +989XXXXXXXXX
  const digits = input.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('98')) local = local.slice(2);
  if (local.startsWith('0')) local = local.slice(1);
  if (!/^9\d{9}$/.test(local)) return null;
  return { local, formatted: `+98${local}` };
}

async function findChatUserByPhone(local: string) {
  const variants = [local, `0${local}`, `+98${local}`, `98${local}`];
  const { data } = await supabase.from('chat_users')
    .select('id, name, phone, email, role, is_messenger_admin')
    .in('phone', variants).limit(1);
  return data?.[0] ?? null;
}

async function startLogin(chat_id: number) {
  await setSession(chat_id, null, 'awaiting_phone', {});
  await sendMessage(chat_id, [
    `🔐 <b>ورود به حساب</b>`, ``,
    `لطفاً شماره موبایل خود را ارسال کنید (مثال: <code>09120000000</code>)`, ``,
    `/cancel برای انصراف`,
  ].join('\n'));
}

async function handlePhoneInput(chat_id: number, text: string) {
  const norm = normalizePhoneIR(text);
  if (!norm) {
    await sendMessage(chat_id, '❌ شماره معتبر نیست. لطفاً به فرمت <code>09120000000</code> ارسال کنید.');
    return;
  }
  const user = await findChatUserByPhone(norm.local);
  if (!user) {
    await sendMessage(chat_id, '❌ کاربری با این شماره در سایت یافت نشد. ابتدا در سایت ثبت‌نام کنید.');
    return;
  }
  // Call send-otp
  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ phone: norm.local, countryCode: '+98' }),
    });
    const json = await res.json();
    if (!res.ok) {
      await sendMessage(chat_id, `❌ ارسال کد ناموفق: ${escapeHtml(json?.error ?? 'خطا')}`);
      return;
    }
  } catch (e: any) {
    await sendMessage(chat_id, `❌ خطا در ارسال پیامک: ${escapeHtml(e?.message)}`);
    return;
  }
  await setSession(chat_id, user.id, 'awaiting_otp', { phone_local: norm.local, phone_formatted: norm.formatted, chat_user_id: user.id });
  await sendMessage(chat_id, `📨 کد ۴ رقمی برای <b>${escapeHtml(user.name)}</b> ارسال شد.\n\nلطفاً کد را ارسال کنید:`);
}

async function handleOtpInput(chat_id: number, text: string) {
  const session = await getSession(chat_id);
  if (!session?.context?.phone_local) { await sendMessage(chat_id, '❌ جلسه منقضی شده. /start را بزنید.'); return; }
  const code = text.trim().replace(/\D/g, '');
  if (!/^\d{4}$/.test(code)) { await sendMessage(chat_id, '❌ کد باید ۴ رقم باشد.'); return; }

  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    body: JSON.stringify({ phone: session.context.phone_local, otpCode: code }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    await sendMessage(chat_id, `❌ کد نامعتبر یا منقضی. دوباره تلاش کنید یا /cancel.`);
    return;
  }

  // Unlink any other account holding this chat_id, then link this user
  await supabase.from('chat_users').update({ telegram_chat_id: null }).eq('telegram_chat_id', chat_id);
  const { error } = await supabase.from('chat_users')
    .update({ telegram_chat_id: chat_id, telegram_linked_at: new Date().toISOString() })
    .eq('id', session.context.chat_user_id);
  if (error) { await sendMessage(chat_id, `❌ خطا در لینک حساب: ${error.message}`); return; }

  await clearSession(chat_id);
  const user = await resolveUser(chat_id);
  if (user) {
    await sendMessage(chat_id, `✅ <b>ورود موفق!</b>\n\n${welcomeText(user)}`, { keyboard: mainMenu(user.role) });
  }
}

// ----- Student menu actions -----
async function studentProfile(chat_id: number, message_id: number, user: BotUser) {
  const { data: u } = await supabase.from('chat_users')
    .select('name, phone, email, country_code, created_at').eq('id', user.id).maybeSingle();
  if (!u) return;
  const text = [
    `👤 <b>پروفایل</b>`, ``,
    `نام: <b>${escapeHtml(u.name)}</b>`,
    `موبایل: <code>${escapeHtml(u.phone)}</code>`,
    `ایمیل: <code>${escapeHtml(u.email ?? '-')}</code>`,
    `عضو از: ${formatTehran(u.created_at)}`,
  ].join('\n');
  await editMessage(chat_id, message_id, text, [
    [{ text: '🚪 خروج (لغو لینک)', callback_data: 'student:logout' }],
    [{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }],
  ]);
}

async function studentLogout(chat_id: number, message_id: number, user: BotUser) {
  await supabase.from('chat_users').update({ telegram_chat_id: null, telegram_linked_at: null }).eq('id', user.id);
  await clearSession(chat_id);
  await editMessage(chat_id, message_id, '✅ حساب از تلگرام جدا شد. برای ورود مجدد /start را بزنید.', []);
}

async function studentMyCourses(chat_id: number, message_id: number, user: BotUser) {
  const { data: u } = await supabase.from('chat_users').select('phone').eq('id', user.id).maybeSingle();
  if (!u) return;
  const variants = [u.phone, `0${u.phone}`, u.phone.replace(/^0/, '')];
  const { data: enrolls } = await supabase.from('enrollments')
    .select('id, course_id, payment_status, created_at, courses(id, slug, title, redirect_url)')
    .in('phone', variants).in('payment_status', ['success', 'completed'])
    .order('created_at', { ascending: false }).limit(50);

  if (!enrolls?.length) {
    await editMessage(chat_id, message_id, '📭 هنوز در دوره‌ای ثبت‌نام نکرده‌اید.', [
      [{ text: '🛒 مشاهده دوره‌ها', callback_data: 'student:browse:0' }],
      [{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }],
    ]);
    return;
  }
  const keyboard: InlineKeyboard = enrolls.map((e: any) => [{
    text: `📚 ${e.courses?.title ?? '-'}`, callback_data: `student:course:${e.course_id.slice(0, 8)}`,
  }]);
  keyboard.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);
  await editMessage(chat_id, message_id, `🎓 <b>دوره‌های من</b> (${enrolls.length})`, keyboard);
}

async function studentCourseDetail(chat_id: number, message_id: number, user: BotUser, coursePrefix: string) {
  const { data: courses } = await supabase.from('courses').select('id, slug, title, description, redirect_url').limit(500);
  const course = (courses ?? []).find((c: any) => c.id.startsWith(coursePrefix));
  if (!course) { await editMessage(chat_id, message_id, '❌ دوره یافت نشد.', [[{ text: '🏠', callback_data: 'menu:home' }]]); return; }

  // Verify user owns this course
  const { data: u } = await supabase.from('chat_users').select('phone').eq('id', user.id).maybeSingle();
  const variants = [u?.phone, `0${u?.phone}`].filter(Boolean) as string[];
  const { data: owns } = await supabase.from('enrollments').select('id')
    .in('phone', variants).eq('course_id', course.id).in('payment_status', ['success', 'completed']).limit(1);
  if (!owns?.length) { await editMessage(chat_id, message_id, '🚫 شما در این دوره ثبت‌نام نکرده‌اید.', [[{ text: '🏠', callback_data: 'menu:home' }]]); return; }

  const { data: lessons } = await supabase.from('course_lessons')
    .select('id, title, lesson_number, order_index').eq('course_id', course.id)
    .order('order_index', { ascending: true }).limit(30);

  const text = [
    `📚 <b>${escapeHtml(course.title)}</b>`,
    course.description ? escapeHtml(String(course.description).slice(0, 200)) : '',
    ``,
    lessons?.length ? `<b>درس‌ها (${lessons.length}):</b>` : '📭 درسی ثبت نشده.',
  ].filter(Boolean).join('\n');

  const keyboard: InlineKeyboard = (lessons ?? []).map((l: any) => [{
    text: `▶️ ${l.lesson_number ? `${l.lesson_number}. ` : ''}${l.title}`,
    url: `${ACADEMY_BASE}/app/course/${course.slug}/lesson/${l.lesson_number ?? l.order_index ?? 1}`,
  }]);
  keyboard.push([{ text: '🌐 صفحه دوره', url: course.redirect_url || `${ACADEMY_BASE}/course/${course.slug}` }]);
  keyboard.push([{ text: '⬅️ بازگشت', callback_data: 'student:my_courses' }, { text: '🏠', callback_data: 'menu:home' }]);
  await editMessage(chat_id, message_id, text, keyboard);
}

async function studentMyTests(chat_id: number, message_id: number, user: BotUser) {
  const { data: u } = await supabase.from('chat_users').select('phone').eq('id', user.id).maybeSingle();
  const variants = [u?.phone, `0${u?.phone}`].filter(Boolean) as string[];
  const { data: tests } = await supabase.from('test_enrollments')
    .select('id, payment_status, enrollment_status, created_at, tests(title, slug)')
    .in('phone', variants).order('created_at', { ascending: false }).limit(30);

  if (!tests?.length) {
    await editMessage(chat_id, message_id, '📭 هنوز در آزمونی ثبت‌نام نکرده‌اید.', [[{ text: '🏠', callback_data: 'menu:home' }]]);
    return;
  }
  const lines = [`🧪 <b>آزمون‌های من</b>`, ``];
  tests.forEach((t: any, i) => {
    const status = t.enrollment_status || t.payment_status || '-';
    lines.push(`${i + 1}. <b>${escapeHtml(t.tests?.title ?? '-')}</b> — ${escapeHtml(status)}`);
  });
  await editMessage(chat_id, message_id, lines.join('\n'), [
    [{ text: '🌐 مرکز سنجش', url: `${ACADEMY_BASE}/assessment-center` }],
    [{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }],
  ]);
}

async function studentBrowse(chat_id: number, message_id: number, page: number) {
  const { data: courses, count } = await supabase.from('courses')
    .select('id, slug, title, price, is_active', { count: 'exact' })
    .eq('is_active', true).order('created_at', { ascending: false })
    .range(page * 6, page * 6 + 5);

  if (!courses?.length) {
    await editMessage(chat_id, message_id, '📭 دوره‌ای موجود نیست.', [[{ text: '🏠', callback_data: 'menu:home' }]]);
    return;
  }
  const lines = [`🛒 <b>دوره‌های موجود</b> — صفحه ${page + 1}`, ''];
  const keyboard: InlineKeyboard = [];
  courses.forEach((c: any) => {
    const price = c.price > 0 ? `${Number(c.price).toLocaleString('fa-IR')} تومان` : 'رایگان';
    lines.push(`• <b>${escapeHtml(c.title)}</b> — ${price}`);
    keyboard.push([{ text: `📖 ${c.title}`, callback_data: `student:enroll:${c.id.slice(0, 8)}` }]);
  });
  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️', callback_data: `student:browse:${page - 1}` });
  if ((page + 1) * 6 < (count ?? 0)) nav.push({ text: '➡️', callback_data: `student:browse:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);
  await editMessage(chat_id, message_id, lines.join('\n'), keyboard);
}

async function studentEnroll(chat_id: number, message_id: number, user: BotUser, coursePrefix: string) {
  const { data: courses } = await supabase.from('courses').select('id, slug, title, price, redirect_url').eq('is_active', true).limit(500);
  const course = (courses ?? []).find((c: any) => c.id.startsWith(coursePrefix));
  if (!course) { await editMessage(chat_id, message_id, '❌ دوره یافت نشد.', [[{ text: '🏠', callback_data: 'menu:home' }]]); return; }

  const { data: u } = await supabase.from('chat_users').select('name, phone, email, country_code').eq('id', user.id).maybeSingle();
  if (!u) return;

  if (Number(course.price) > 0) {
    const url = course.redirect_url || `${ACADEMY_BASE}/course/${course.slug}`;
    await editMessage(chat_id, message_id,
      `💳 <b>${escapeHtml(course.title)}</b>\n\nقیمت: <b>${Number(course.price).toLocaleString('fa-IR')} تومان</b>\n\nبرای ثبت‌نام و پرداخت روی دکمه زیر بزنید:`,
      [
        [{ text: '🛒 ثبت‌نام و پرداخت', url }],
        [{ text: '⬅️ بازگشت', callback_data: 'student:browse:0' }],
      ]);
    return;
  }

  // Free course → enroll directly
  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-enrollment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({
        course_id: course.id,
        full_name: u.name,
        email: u.email || `${u.phone}@telegram.local`,
        phone: u.phone,
        country_code: u.country_code || '+98',
        payment_amount: 0,
        payment_method: 'free',
        payment_status: 'completed',
        chat_user_id: user.id,
        force_create: true,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      await editMessage(chat_id, message_id, `❌ خطا: ${escapeHtml(json?.error ?? 'ناموفق')}`,
        [[{ text: '⬅️ بازگشت', callback_data: 'student:browse:0' }]]);
      return;
    }
    await editMessage(chat_id, message_id,
      `✅ <b>ثبت‌نام موفق</b>\n\nشما در «${escapeHtml(course.title)}» ثبت‌نام شدید.`,
      [
        [{ text: '🎓 مشاهده دوره', callback_data: `student:course:${course.id.slice(0, 8)}` }],
        [{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }],
      ]);
  } catch (e: any) {
    await editMessage(chat_id, message_id, `❌ خطا: ${escapeHtml(e?.message)}`,
      [[{ text: '🏠', callback_data: 'menu:home' }]]);
  }
}

// ============ Forms System ============
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';

async function getActiveForms() {
  const { data } = await supabase.from('telegram_forms')
    .select('id, title, description, require_login')
    .eq('is_active', true).order('created_at', { ascending: false }).limit(20);
  return data ?? [];
}

async function formsKeyboardRows(): Promise<InlineKeyboard> {
  const forms = await getActiveForms();
  return forms.map((f: any) => [{ text: `📝 ${f.title}`, callback_data: `form:start:${f.id.slice(0, 8)}` }]);
}

async function buildStartKeyboard(authed: boolean, role: Role): Promise<InlineKeyboard> {
  const formRows = await formsKeyboardRows();
  const base = authed ? mainMenu(role) : loginMenu();
  return [...formRows, ...base];
}

async function findFormByPrefix(prefix: string) {
  const { data } = await supabase.from('telegram_forms').select('*').eq('is_active', true).limit(500);
  return (data ?? []).find((f: any) => f.id.startsWith(prefix));
}

async function getFormFields(form_id: string) {
  const { data } = await supabase.from('telegram_form_fields')
    .select('*').eq('form_id', form_id).order('order_index');
  return data ?? [];
}

function fieldPrompt(field: any, index: number, total: number): string {
  const req = field.required ? ' <i>(الزامی)</i>' : ' <i>(اختیاری — برای رد کردن /skip)</i>';
  const hint = field.help_text ? `\n<i>${escapeHtml(field.help_text)}</i>` : '';
  const typeHints: Record<string, string> = {
    text: '✍️ پاسخ متنی کوتاه بنویسید.',
    long_text: '✍️ پاسخ متنی خود را بنویسید.',
    phone: '📱 شماره موبایل را ارسال کنید (مثال: 09120000000).',
    email: '📧 ایمیل را ارسال کنید.',
    number: '🔢 یک عدد ارسال کنید.',
    dropdown: '👇 یکی از گزینه‌های زیر را انتخاب کنید:',
    image: '🖼 یک عکس ارسال کنید.',
    voice: '🎤 یک پیام صوتی ضبط و ارسال کنید.',
    file: '📎 یک فایل ارسال کنید.',
  };
  return [
    `📝 سؤال ${index + 1} از ${total}`,
    ``,
    `<b>${escapeHtml(field.label)}</b>${req}${hint}`,
    ``,
    typeHints[field.field_type] || typeHints.text,
    ``,
    `/cancel برای انصراف`,
  ].join('\n');
}

async function startForm(chat_id: number, message_id: number, formId: string, user: BotUser | null) {
  const form = await findFormByPrefix(formId);
  if (!form) {
    await editMessage(chat_id, message_id, '❌ فرم یافت نشد.', [[{ text: '🏠', callback_data: 'menu:home' }]]);
    return;
  }
  if (form.require_login && !user) {
    await editMessage(chat_id, message_id,
      `🔒 برای شرکت در «${escapeHtml(form.title)}» باید وارد حساب کاربری خود شوید.`,
      [[{ text: '🔐 ورود', callback_data: 'login:start' }]]);
    return;
  }
  const fields = await getFormFields(form.id);
  if (!fields.length) {
    await editMessage(chat_id, message_id, '⚠️ این فرم هیچ فیلدی ندارد.', [[{ text: '🏠', callback_data: 'menu:home' }]]);
    return;
  }
  const { data: sub, error } = await supabase.from('telegram_form_submissions').insert({
    form_id: form.id, chat_id, chat_user_id: user?.id ?? null, status: 'in_progress',
  }).select('id').single();
  if (error || !sub) {
    await editMessage(chat_id, message_id, `❌ خطا: ${escapeHtml(error?.message ?? '')}`, [[{ text: '🏠', callback_data: 'menu:home' }]]);
    return;
  }
  await setSession(chat_id, user?.id ?? null, 'awaiting_form_field', {
    submission_id: sub.id, form_id: form.id, field_index: 0,
  });
  await editMessage(chat_id, message_id,
    `📋 <b>${escapeHtml(form.title)}</b>\n${form.description ? escapeHtml(form.description) : ''}`,
    [[{ text: '⬅️ انصراف', callback_data: 'form:cancel' }]]);
  await askField(chat_id, sub.id, form.id, 0);
}

async function askField(chat_id: number, submission_id: string, form_id: string, index: number) {
  const fields = await getFormFields(form_id);
  const field = fields[index];
  if (!field) return;
  const text = fieldPrompt(field, index, fields.length);
  if (field.field_type === 'dropdown') {
    const opts: string[] = Array.isArray(field.options) ? field.options : (field.options?.values ?? []);
    const kbd: InlineKeyboard = opts.map((o, i) => [{ text: o, callback_data: `form:opt:${i}` }]);
    kbd.push([{ text: '❌ انصراف', callback_data: 'form:cancel' }]);
    await sendMessage(chat_id, text, { keyboard: kbd });
  } else {
    await sendMessage(chat_id, text, { keyboard: [[{ text: '❌ انصراف', callback_data: 'form:cancel' }]] });
  }
}

function validateFieldValue(field: any, text: string): { ok: boolean; value?: string; error?: string } {
  const t = text.trim();
  if (field.field_type === 'phone') {
    const norm = normalizePhoneIR(t);
    if (!norm) return { ok: false, error: 'شماره معتبر نیست (مثال: 09120000000).' };
    return { ok: true, value: norm.formatted };
  }
  if (field.field_type === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return { ok: false, error: 'ایمیل معتبر نیست.' };
    return { ok: true, value: t };
  }
  if (field.field_type === 'number') {
    if (!/^-?\d+(\.\d+)?$/.test(t)) return { ok: false, error: 'لطفاً فقط عدد ارسال کنید.' };
    return { ok: true, value: t };
  }
  return { ok: true, value: t };
}

async function uploadTelegramFile(submission_id: string, field_id: string, file_id: string, bucket: string, ext: string) {
  const f = await downloadFile(file_id);
  if (!f) return null;
  const path = `telegram-forms/${submission_id}/${field_id}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, f.bytes, {
    contentType: f.mime, upsert: true,
  });
  if (error) { console.error('upload error:', error); return null; }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, mime: f.mime };
}

async function saveAnswerAndAdvance(
  chat_id: number,
  user_id: number | null,
  submission_id: string,
  form_id: string,
  field: any,
  field_index: number,
  answer: { value_text?: string | null; value_json?: any; file_url?: string | null; file_mime?: string | null },
) {
  await supabase.from('telegram_form_answers').insert({
    submission_id, field_id: field.id,
    value_text: answer.value_text ?? null,
    value_json: answer.value_json ?? null,
    file_url: answer.file_url ?? null,
    file_mime: answer.file_mime ?? null,
  });
  const fields = await getFormFields(form_id);
  const next = field_index + 1;
  if (next >= fields.length) {
    await completeSubmission(chat_id, user_id, submission_id, form_id);
  } else {
    await setSession(chat_id, user_id, 'awaiting_form_field', { submission_id, form_id, field_index: next });
    await askField(chat_id, submission_id, form_id, next);
  }
}

async function completeSubmission(chat_id: number, user_id: number | null, submission_id: string, form_id: string) {
  await supabase.from('telegram_form_submissions').update({
    status: 'completed', completed_at: new Date().toISOString(),
  }).eq('id', submission_id);
  await clearSession(chat_id);
  const { data: form } = await supabase.from('telegram_forms').select('title, ai_prompt').eq('id', form_id).single();
  await sendMessage(chat_id, `✅ <b>فرم با موفقیت ثبت شد!</b>\n\nاز پاسخگویی شما متشکریم. 🙏`,
    { keyboard: [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]] });
  if (form?.ai_prompt) {
    await runFormAIAnalysis(chat_id, submission_id, form.ai_prompt, form.title);
  }
}

async function buildFormDataText(submission_id: string): Promise<string> {
  const { data: sub } = await supabase.from('telegram_form_submissions')
    .select('id, form_id, chat_id, telegram_form_answers(value_text, value_json, file_url, telegram_form_fields(label, field_type, order_index))')
    .eq('id', submission_id).single();
  if (!sub) return '';
  const answers = (sub as any).telegram_form_answers ?? [];
  answers.sort((a: any, b: any) => (a.telegram_form_fields?.order_index ?? 0) - (b.telegram_form_fields?.order_index ?? 0));
  return answers.map((a: any) => {
    const label = a.telegram_form_fields?.label ?? '?';
    const val = a.value_text ?? (a.file_url ? `[فایل: ${a.file_url}]` : (a.value_json ? JSON.stringify(a.value_json) : '-'));
    return `${label}: ${val}`;
  }).join('\n');
}

async function runFormAIAnalysis(chat_id: number, submission_id: string, prompt: string, formTitle: string) {
  if (!LOVABLE_API_KEY) {
    await sendMessage(chat_id, '⚠️ تحلیل هوش مصنوعی فعال نیست (کلید پیکربندی نشده).');
    return;
  }
  const dataText = await buildFormDataText(submission_id);
  const userContent = `پاسخ‌های ارسال‌شده در فرم «${formTitle}»:\n\n${dataText}`;

  // Send initial message to edit later
  const init = await sendMessage(chat_id, '🤖 <i>در حال تحلیل پاسخ‌ها با هوش مصنوعی...</i>');
  const msgId = (init as any)?.result?.message_id;
  if (!msgId) return;

  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userContent },
        ],
        stream: true,
      }),
    });

    if (!resp.ok || !resp.body) {
      const errText = await resp.text().catch(() => '');
      await editMessage(chat_id, msgId, `❌ خطای AI: ${escapeHtml(errText.slice(0, 200))}`);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    let lastEdit = 0;

    const flush = async (final = false) => {
      const now = Date.now();
      if (!final && now - lastEdit < 1300) return;
      lastEdit = now;
      const shown = full.length > 3800 ? full.slice(-3800) : full;
      try {
        await editMessage(chat_id, msgId, `🤖 <b>تحلیل هوش مصنوعی:</b>\n\n${escapeHtml(shown)}${final ? '' : ' ▌'}`);
      } catch (e) {
        // Telegram errors on identical content — ignore
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const l = line.trim();
        if (!l.startsWith('data:')) continue;
        const payload = l.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const j = JSON.parse(payload);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            await flush(false);
          }
        } catch {}
      }
    }
    await flush(true);
    await supabase.from('telegram_form_submissions').update({
      ai_response: full, status: 'analyzed',
    }).eq('id', submission_id);
  } catch (e: any) {
    await editMessage(chat_id, msgId, `❌ خطا در تحلیل: ${escapeHtml(e?.message ?? String(e))}`);
  }
}

async function cancelForm(chat_id: number, message_id: number) {
  const session = await getSession(chat_id);
  const subId = session?.context?.submission_id;
  if (subId) {
    await supabase.from('telegram_form_submissions').update({ status: 'cancelled' }).eq('id', subId);
  }
  await clearSession(chat_id);
  const user = await resolveUser(chat_id);
  const kbd = await buildStartKeyboard(!!user, user?.role ?? null);
  await editMessage(chat_id, message_id, '❌ فرم لغو شد.', kbd);
}

// ============ Update routing ============

async function handleUpdate(update: any) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chat_id = cq.message.chat.id;
    const message_id = cq.message.message_id;
    const data: string = cq.data;
    await answerCallback(cq.id);

    // Handle login + form callbacks before user-resolution
    if (data === 'login:start') { await startLogin(chat_id); return; }
    if (data === 'form:cancel') { await cancelForm(chat_id, message_id); return; }

    const userEarly = await resolveUser(chat_id);
    if (data.startsWith('form:start:')) {
      const prefix = data.split(':')[2];
      await startForm(chat_id, message_id, prefix, userEarly);
      return;
    }
    if (data.startsWith('form:opt:')) {
      const session = await getSession(chat_id);
      if (session?.state !== 'awaiting_form_field') {
        await sendMessage(chat_id, '⚠️ جلسه فرم منقضی شده. /start را بزنید.');
        return;
      }
      const idx = parseInt(data.split(':')[2]);
      const fields = await getFormFields(session.context.form_id);
      const field = fields[session.context.field_index];
      if (!field || field.field_type !== 'dropdown') return;
      const opts: string[] = Array.isArray(field.options) ? field.options : (field.options?.values ?? []);
      const choice = opts[idx];
      if (!choice) return;
      await sendMessage(chat_id, `✅ انتخاب شد: <b>${escapeHtml(choice)}</b>`);
      await saveAnswerAndAdvance(chat_id, session.user_id, session.context.submission_id, session.context.form_id, field, session.context.field_index, { value_text: choice });
      return;
    }

    const user = userEarly;
    if (!user) {
      await sendMessage(chat_id, '🚫 حساب شما لینک نشده. /start را بزنید.');
      return;
    }


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

      if (action === 'student') {
        const sub = rest[0];
        if (sub === 'my_courses') { await studentMyCourses(chat_id, message_id, user); return; }
        if (sub === 'my_tests') { await studentMyTests(chat_id, message_id, user); return; }
        if (sub === 'browse') { await studentBrowse(chat_id, message_id, parseInt(rest[1] ?? '0')); return; }
        if (sub === 'course') { await studentCourseDetail(chat_id, message_id, user, rest[1]); return; }
        if (sub === 'enroll') { await studentEnroll(chat_id, message_id, user, rest[1]); return; }
        if (sub === 'profile') { await studentProfile(chat_id, message_id, user); return; }
        if (sub === 'logout') { await studentLogout(chat_id, message_id, user); return; }
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
  if (text === '/cancel') {
    await clearSession(chat_id);
  }

  const user = await resolveUser(chat_id);

  // Unlinked user flow
  if (!user) {
    const session = await getSession(chat_id);
    if (text === '/cancel' || text === '/start') {
      await clearSession(chat_id);
      const kbd = await buildStartKeyboard(false, null);
      await sendMessage(chat_id, [
        `👋 <b>به ربات آکادمی رفیعی خوش آمدید</b>`, ``,
        `از فرم‌های زیر استفاده کنید یا با شماره موبایل وارد شوید.`, ``,
        `Chat ID شما: <code>${chat_id}</code>`,
      ].join('\n'), { keyboard: kbd });
      return;
    }
    if (session?.state === 'awaiting_phone' && text) { await handlePhoneInput(chat_id, text); return; }
    if (session?.state === 'awaiting_otp' && text) { await handleOtpInput(chat_id, text); return; }
    if (session?.state === 'awaiting_form_field') { await handleFormMessage(chat_id, null, msg, session); return; }
    const kbd = await buildStartKeyboard(false, null);
    await sendMessage(chat_id, 'برای ورود /start را بزنید.', { keyboard: kbd });
    return;
  }

  if (text === '/start') {
    await clearSession(chat_id);
    const kbd = await buildStartKeyboard(true, user.role);
    await sendMessage(chat_id, welcomeText(user), { keyboard: kbd });
    return;
  }

  if (text === '/cancel') {
    await sendMessage(chat_id, '✅ لغو شد.', { keyboard: mainMenu(user.role) });
    return;
  }
  if (text === '/help') {
    await sendMessage(chat_id, `<b>دستورات:</b>\n/start — منوی اصلی\n/cancel — لغو\n/myid — Chat ID\n/help — راهنما`);
    return;
  }

  const session = await getSession(chat_id);
  if (session?.state === 'awaiting_form_field') {
    await handleFormMessage(chat_id, user.id, msg, session);
    return;
  }

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
