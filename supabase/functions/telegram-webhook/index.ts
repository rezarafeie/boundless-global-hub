// Telegram Bot webhook — full role-based CRM/Lead bot
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  sendMessage,
  editMessage,
  answerCallback,
  escapeHtml,
  formatTehran,
  downloadFile,
  mdToTelegramHtml,
  tgCall,
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
  phone?: string | null;
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
    .select('id, name, role, is_messenger_admin, telegram_chat_id, phone')
    .eq('telegram_chat_id', chat_id)
    .maybeSingle();
  if (!data) return null;
  let role: Role = (data.role as Role) ?? 'student';
  if (data.is_messenger_admin) role = 'admin';
  return { id: data.id, name: data.name, role, telegram_chat_id: chat_id, phone: data.phone };
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
async function mainMenu(user: BotUser | null): Promise<InlineKeyboard> {
  const role = user?.role ?? null;
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
  // Default: student — hide my_courses / my_tests when empty
  const rows: InlineKeyboard = [];
  let courseCount = 0, testCount = 0;
  if (user?.id) {
    const { data: u } = await supabase.from('chat_users').select('phone').eq('id', user.id).maybeSingle();
    const phone = u?.phone ?? user.phone ?? null;
    if (phone) {
      const variants = [phone, `0${phone}`, phone.replace(/^0/, '')];
      const [{ count: cc }, { count: tc }] = await Promise.all([
        supabase.from('enrollments').select('id', { count: 'exact', head: true })
          .in('phone', variants).in('payment_status', ['success', 'completed']),
        supabase.from('test_enrollments').select('id', { count: 'exact', head: true })
          .in('phone', variants),
      ]);
      courseCount = cc ?? 0;
      testCount = tc ?? 0;
    }
  }
  if (courseCount > 0) rows.push([{ text: '🎓 دوره‌های من', callback_data: 'student:my_courses' }]);
  if (testCount > 0) rows.push([{ text: '🧪 آزمون‌های من', callback_data: 'student:my_tests' }]);
  rows.push([{ text: '🛒 ثبت‌نام در دوره جدید', callback_data: 'student:browse:0' }]);
  rows.push([{ text: '👤 پروفایل', callback_data: 'student:profile' }]);
  return rows;
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

function roleLabel(role: string | null | undefined): string {
  const roleNames: Record<string, string> = {
    admin: 'مدیر کل', sales_manager: 'مدیر فروش', sales_agent: 'کارشناس فروش', student: 'دانشجو',
  };
  return roleNames[role ?? 'student'] ?? 'کاربر';
}

async function loadWelcomeTemplates(): Promise<{ logged_in: string | null; logged_out: string | null }> {
  const { data } = await supabase
    .from('admin_settings')
    .select('telegram_bot_welcome_logged_in, telegram_bot_welcome_logged_out')
    .eq('id', 1)
    .maybeSingle();
  return {
    logged_in: (data as any)?.telegram_bot_welcome_logged_in ?? null,
    logged_out: (data as any)?.telegram_bot_welcome_logged_out ?? null,
  };
}

function fmtTehran(kind: 'date' | 'time' | 'datetime'): string {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Tehran' };
  if (kind === 'date' || kind === 'datetime') {
    opts.year = 'numeric'; opts.month = '2-digit'; opts.day = '2-digit';
  }
  if (kind === 'time' || kind === 'datetime') {
    opts.hour = '2-digit'; opts.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('fa-IR', opts).format(now);
}

function applyWelcomePlaceholders(template: string, ctx: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, k) => ctx[k] ?? '');
}

async function buildWelcomeContext(chat_id: number, user: BotUser | null): Promise<Record<string, string>> {
  const ctx: Record<string, string> = {
    chat_id: String(chat_id),
    date: fmtTehran('date'),
    time: fmtTehran('time'),
    datetime: fmtTehran('datetime'),
    name: '', first_name: '', last_name: '', phone: '', email: '', role: '', courses: '',
  };
  if (!user) return ctx;
  const { data: u } = await supabase
    .from('chat_users')
    .select('name, first_name, last_name, phone, email, role')
    .eq('id', user.id)
    .maybeSingle();
  const nm = (u as any) ?? {};
  ctx.name = escapeHtml(nm.name ?? user.name ?? '');
  ctx.first_name = escapeHtml(nm.first_name ?? '');
  ctx.last_name = escapeHtml(nm.last_name ?? '');
  ctx.phone = escapeHtml(nm.phone ?? user.phone ?? '');
  ctx.email = escapeHtml(nm.email ?? '');
  ctx.role = escapeHtml(roleLabel(user.role));
  const phone = nm.phone ?? user.phone;
  if (phone) {
    const variants = [phone, `0${phone}`, String(phone).replace(/^0/, '')];
    const { data: enrs } = await supabase
      .from('enrollments')
      .select('courses(title)')
      .in('phone', variants)
      .in('payment_status', ['success', 'completed'])
      .limit(20);
    const titles = (enrs ?? []).map((e: any) => e.courses?.title).filter(Boolean);
    ctx.courses = escapeHtml(titles.join('، '));
  }
  return ctx;
}

async function renderWelcome(chat_id: number, user: BotUser | null): Promise<string> {
  const templates = await loadWelcomeTemplates();
  const tpl = user ? templates.logged_in : templates.logged_out;
  if (tpl && tpl.trim()) {
    const ctx = await buildWelcomeContext(chat_id, user);
    return applyWelcomePlaceholders(tpl, ctx);
  }
  // Fallback to defaults
  if (user) return welcomeText(user);
  return [
    `👋 <b>به ربات آکادمی رفیعی خوش آمدید</b>`, ``,
    `از فرم‌های زیر استفاده کنید یا با شماره موبایل وارد شوید.`, ``,
    `Chat ID شما: <code>${chat_id}</code>`,
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

async function startLogin(chat_id: number, message_id?: number) {
  const existing = await getSession(chat_id);
  await setSession(chat_id, null, 'awaiting_phone', existing?.context ?? {});
  const txt = [
    `🔐 <b>ورود به حساب</b>`, ``,
    `لطفاً شماره موبایل خود را ارسال کنید (مثال: <code>09120000000</code>)`, ``,
    `/cancel برای انصراف`,
  ].join('\n');
  const kbd: InlineKeyboard = [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]];
  if (message_id) await editMessage(chat_id, message_id, txt, kbd);
  else await sendMessage(chat_id, txt, { keyboard: kbd });
}

const BACK_HOME_KBD: InlineKeyboard = [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]];

async function handlePhoneInput(chat_id: number, text: string) {
  const norm = normalizePhoneIR(text);
  if (!norm) {
    await sendMessage(chat_id, '❌ شماره معتبر نیست. لطفاً به فرمت <code>09120000000</code> ارسال کنید.', { keyboard: BACK_HOME_KBD });
    return;
  }
  const user = await findChatUserByPhone(norm.local);
  // Send OTP regardless (signup or login)
  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ phone: norm.local, countryCode: '+98' }),
    });
    const json = await res.json();
    if (!res.ok) {
      await sendMessage(chat_id, `❌ ارسال کد ناموفق: ${escapeHtml(json?.error ?? 'خطا')}`, { keyboard: BACK_HOME_KBD });
      return;
    }
  } catch (e: any) {
    await sendMessage(chat_id, `❌ خطا در ارسال پیامک: ${escapeHtml(e?.message)}`, { keyboard: BACK_HOME_KBD });
    return;
  }

  const prior = await getSession(chat_id);
  const pending_enroll = prior?.context?.pending_enroll;
  if (user) {
    await setSession(chat_id, user.id, 'awaiting_otp', { phone_local: norm.local, phone_formatted: norm.formatted, chat_user_id: user.id, pending_enroll });
    await sendMessage(chat_id, `📨 کد ۴ رقمی برای <b>${escapeHtml(user.name)}</b> ارسال شد.\n\nلطفاً کد را ارسال کنید:`, { keyboard: BACK_HOME_KBD });
  } else {
    // New user — signup flow
    await setSession(chat_id, null, 'awaiting_signup_otp', { phone_local: norm.local, phone_formatted: norm.formatted, pending_enroll });
    await sendMessage(chat_id,
      `👤 <b>کاربری با این شماره یافت نشد — ساخت حساب جدید</b>\n\n📨 کد ۴ رقمی برای <code>${escapeHtml(norm.formatted)}</code> ارسال شد. لطفاً کد را ارسال کنید:`,
      { keyboard: BACK_HOME_KBD });
  }
}

async function handleOtpInput(chat_id: number, text: string) {
  const session = await getSession(chat_id);
  if (!session?.context?.phone_local) { await sendMessage(chat_id, '❌ جلسه منقضی شده. /start را بزنید.', { keyboard: BACK_HOME_KBD }); return; }
  const code = text.trim().replace(/\D/g, '');
  if (!/^\d{4}$/.test(code)) { await sendMessage(chat_id, '❌ کد باید ۴ رقم باشد.', { keyboard: BACK_HOME_KBD }); return; }

  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    body: JSON.stringify({ phone: session.context.phone_local, otpCode: code }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    await sendMessage(chat_id, `❌ کد نامعتبر یا منقضی. دوباره تلاش کنید یا /cancel.`, { keyboard: BACK_HOME_KBD });
    return;
  }

  // Unlink any other account holding this chat_id, then link this user
  await supabase.from('chat_users').update({ telegram_chat_id: null }).eq('telegram_chat_id', chat_id);
  const { error } = await supabase.from('chat_users')
    .update({ telegram_chat_id: chat_id, telegram_linked_at: new Date().toISOString() })
    .eq('id', session.context.chat_user_id);
  if (error) { await sendMessage(chat_id, `❌ خطا در لینک حساب: ${error.message}`, { keyboard: BACK_HOME_KBD }); return; }

  const pending_enroll = session.context?.pending_enroll as string | undefined;
  await clearSession(chat_id);
  const user = await resolveUser(chat_id);
  if (user) {
    await sendMessage(chat_id, `✅ <b>ورود موفق!</b>\n\n${await renderWelcome(chat_id, user)}`, { keyboard: await buildStartKeyboard(user) });
    if (pending_enroll) await tryLinkEnrollment(chat_id, pending_enroll, user);
  }
}

// ============ Signup flow (new user) ============
async function handleSignupOtpInput(chat_id: number, text: string) {
  const session = await getSession(chat_id);
  if (!session?.context?.phone_local) { await sendMessage(chat_id, '❌ جلسه منقضی شده. /start را بزنید.', { keyboard: BACK_HOME_KBD }); return; }
  const code = text.trim().replace(/\D/g, '');
  if (!/^\d{4}$/.test(code)) { await sendMessage(chat_id, '❌ کد باید ۴ رقم باشد.', { keyboard: BACK_HOME_KBD }); return; }
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    body: JSON.stringify({ phone: session.context.phone_local, otpCode: code }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    await sendMessage(chat_id, `❌ کد نامعتبر یا منقضی. دوباره تلاش کنید یا /cancel.`, { keyboard: BACK_HOME_KBD });
    return;
  }
  await setSession(chat_id, null, 'awaiting_signup_first_name', { ...session.context });
  await sendMessage(chat_id, `✅ کد تایید شد.\n\n👤 لطفاً <b>نام</b> خود را ارسال کنید:`, { keyboard: BACK_HOME_KBD });
}

async function handleSignupFirstName(chat_id: number, text: string) {
  const session = await getSession(chat_id);
  const name = (text ?? '').trim();
  if (!name || name.length < 2 || name.length > 50) {
    await sendMessage(chat_id, '❌ نام باید بین ۲ تا ۵۰ کاراکتر باشد.', { keyboard: BACK_HOME_KBD });
    return;
  }
  await setSession(chat_id, null, 'awaiting_signup_last_name', { ...session?.context, first_name: name });
  await sendMessage(chat_id, `👤 لطفاً <b>نام خانوادگی</b> خود را ارسال کنید:`, { keyboard: BACK_HOME_KBD });
}

async function handleSignupLastName(chat_id: number, text: string) {
  const session = await getSession(chat_id);
  const name = (text ?? '').trim();
  if (!name || name.length < 2 || name.length > 50) {
    await sendMessage(chat_id, '❌ نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد.', { keyboard: BACK_HOME_KBD });
    return;
  }
  await setSession(chat_id, null, 'awaiting_signup_email', { ...session?.context, last_name: name });
  await sendMessage(chat_id, `📧 لطفاً <b>ایمیل</b> خود را ارسال کنید:\n\n(برای رد کردن /skip ارسال کنید)`, { keyboard: BACK_HOME_KBD });
}

async function handleSignupEmail(chat_id: number, text: string) {
  const session = await getSession(chat_id);
  if (!session?.context?.phone_local) { await sendMessage(chat_id, '❌ جلسه منقضی شده.', { keyboard: BACK_HOME_KBD }); return; }
  const raw = (text ?? '').trim();
  let email: string | null = null;
  if (raw !== '/skip') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || raw.length > 255) {
      await sendMessage(chat_id, '❌ ایمیل معتبر نیست. دوباره ارسال کنید یا /skip بزنید.', { keyboard: BACK_HOME_KBD });
      return;
    }
    email = raw.toLowerCase();
  }

  const ctx = session.context;
  const firstName = String(ctx.first_name ?? '').trim();
  const lastName = String(ctx.last_name ?? '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const phoneLocal = String(ctx.phone_local);

  // Generate unique user_id
  const { data: uidData, error: uidErr } = await supabase.rpc('generate_unique_user_id');
  if (uidErr) { await sendMessage(chat_id, `❌ خطا: ${escapeHtml(uidErr.message)}`, { keyboard: BACK_HOME_KBD }); return; }

  // Double-check no race
  const existing = await findChatUserByPhone(phoneLocal);
  let newUserId: number | null = existing?.id ?? null;

  if (!existing) {
    const { data: ins, error: insErr } = await supabase.from('chat_users').insert({
      name: fullName || firstName,
      phone: phoneLocal,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      user_id: uidData,
      country_code: '+98',
      signup_source: 'telegram_bot',
      is_approved: true,
      role: 'user',
      telegram_chat_id: chat_id,
      telegram_linked_at: new Date().toISOString(),
    }).select('id').single();
    if (insErr) { await sendMessage(chat_id, `❌ خطا در ساخت حساب: ${escapeHtml(insErr.message)}`, { keyboard: BACK_HOME_KBD }); return; }
    newUserId = ins.id;
  } else {
    // Existing — just link telegram
    await supabase.from('chat_users').update({ telegram_chat_id: null }).eq('telegram_chat_id', chat_id);
    await supabase.from('chat_users')
      .update({ telegram_chat_id: chat_id, telegram_linked_at: new Date().toISOString() })
      .eq('id', existing.id);
  }

  const pending_enroll = session.context?.pending_enroll as string | undefined;
  await clearSession(chat_id);
  const user = await resolveUser(chat_id);
  if (user) {
    await sendMessage(chat_id, `🎉 <b>حساب شما با موفقیت ساخته شد!</b>\n\n${await renderWelcome(chat_id, user)}`, { keyboard: await buildStartKeyboard(user) });
    if (pending_enroll) await tryLinkEnrollment(chat_id, pending_enroll, user);
  }
}

// ============ Enrollment follow-up linking ============

async function getFollowupSettings() {
  const { data } = await supabase.from('admin_settings')
    .select('telegram_bot_username, telegram_miniapp_base_url, telegram_followup_ai_prompt')
    .eq('id', 1).maybeSingle();
  return {
    botUsername: ((data as any)?.telegram_bot_username ?? 'rafiei_bot').replace(/^@/, ''),
    miniappBase: ((data as any)?.telegram_miniapp_base_url ?? 'https://academy.rafiei.co').replace(/\/+$/, ''),
    aiPrompt: (data as any)?.telegram_followup_ai_prompt ?? '',
  };
}

async function generateEnrollmentSsoUrl(enrollmentId: string, email: string | null, redirect: string): Promise<string> {
  if (!email) return redirect;
  try {
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-sso-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ enrollmentId, userEmail: email }),
    });
    const j = await r.json();
    const academy = j?.tokens?.find?.((t: any) => t.type === 'academy');
    if (academy?.url) return `${academy.url}&redirect=${encodeURIComponent(redirect)}`;
  } catch (e) { console.error('sso gen failed', e); }
  return redirect;
}

function normPhone(p: string | null | undefined): string {
  return (p ?? '').replace(/\D/g, '').replace(/^98/, '').replace(/^0/, '');
}

async function tryLinkEnrollment(chat_id: number, enrollment_id: string, user: BotUser): Promise<void> {
  const { data: enr } = await supabase.from('enrollments')
    .select('id, phone, course_id, payment_status, telegram_chat_id')
    .eq('id', enrollment_id).maybeSingle();
  if (!enr) { await sendMessage(chat_id, '❌ ثبت‌نام پیدا نشد.', { keyboard: await buildStartKeyboard(user) }); return; }
  const { data: course } = await supabase.from('courses')
    .select('id, title, slug, rafiei_bot_followup_enabled, support_link, telegram_channel_link')
    .eq('id', enr.course_id).maybeSingle();
  if (!(course as any)?.rafiei_bot_followup_enabled) {
    await sendMessage(chat_id, '⚠️ پیگیری ربات برای این دوره فعال نیست.', { keyboard: await buildStartKeyboard(user) });
    return;
  }
  if (normPhone(user.phone) && normPhone(enr.phone) && normPhone(user.phone) !== normPhone(enr.phone)) {
    await sendMessage(chat_id, '🚫 این ثبت‌نام مربوط به شماره دیگری است. لطفاً با همان حساب وارد شوید.',
      { keyboard: await buildStartKeyboard(user) });
    return;
  }

  await supabase.from('enrollments').update({
    telegram_chat_id: chat_id,
    telegram_linked_at: new Date().toISOString(),
    followup_state: 'linked',
  }).eq('id', enrollment_id);

  const { data: cu } = await supabase.from('chat_users').select('email').eq('id', user.id).maybeSingle();
  const settings = await getFollowupSettings();
  const slugOrId = (course as any).slug ?? (course as any).id;
  const redirect = `${settings.miniappBase}/app/course/${slugOrId}`;
  const ssoUrl = await generateEnrollmentSsoUrl(enrollment_id, cu?.email ?? null, redirect);

  const kbd: InlineKeyboard = [
    [{ text: '📚 شروع دوره (Mini App)', web_app: { url: ssoUrl } }],
    [{ text: '🌐 باز کردن در مرورگر', url: ssoUrl }],
  ];
  kbd.push([{ text: '⏰ تنظیم زمان یادآوری روزانه', callback_data: `enroll:settime:${enrollment_id}` }]);
  kbd.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);

  await sendMessage(chat_id, [
    `🎉 <b>به دوره «${escapeHtml((course as any).title)}» خوش آمدید!</b>`,
    ``,
    `از این پس کوچ شخصی شما در همین ربات کنار شماست تا قدم‌به‌قدم دوره را با شما کامل کند. ✨`,
    ``,
    `👇 برای شروع، یک گزینه را انتخاب کنید:`,
  ].join('\n'), { keyboard: kbd });

  // If the course has telegram support / channel links, prompt the user to join
  // them right here in Telegram so they don't have to return to the academy.
  const supportUrl = (course as any).support_link as string | null;
  const channelUrl = (course as any).telegram_channel_link as string | null;
  if (supportUrl || channelUrl) {
    const joinKbd: InlineKeyboard = [];
    if (supportUrl) joinKbd.push([{ text: '🎧 ورود به پشتیبانی تلگرام', url: supportUrl }]);
    if (channelUrl) joinKbd.push([{ text: '📢 عضویت در کانال دوره', url: channelUrl }]);
    joinKbd.push([{ text: '🎓 بازگشت به آکادمی', web_app: { url: ssoUrl } }]);
    joinKbd.push([{ text: '🌐 بازگشت در مرورگر', url: ssoUrl }]);
    await sendMessage(chat_id, [
      `📌 <b>تکمیل دسترسی به دوره</b>`,
      ``,
      `برای استفاده‌ی کامل از دوره، لطفاً ${supportUrl ? 'به <b>پشتیبانی تلگرام</b>' : ''}${supportUrl && channelUrl ? ' و ' : ''}${channelUrl ? '<b>کانال دوره</b>' : ''} بپیوندید.`,
      ``,
      `✅ پس از عضویت، با همین دکمه‌ی پایین می‌توانید مستقیم به آکادمی برگردید — نیازی به خروج از تلگرام نیست.`,
    ].join('\n'), { keyboard: joinKbd });
  }

  await sendMessage(chat_id,
    [
      `⏰ <b>چه ساعتی از روز برای یادآوری مناسب است؟</b>`,
      `یک عدد بین ۰ تا ۲۳ ارسال کنید (ساعت تهران).`,
      `مثال: <code>21</code> یعنی هر روز ساعت ۹ شب.`,
      ``,
      `برای رد کردن: /skip`,
    ].join('\n'));
  await setSession(chat_id, user.id, 'awaiting_followup_time', { enrollment_id });
}


async function handleFollowupTimeInput(chat_id: number, text: string, user: BotUser) {
  const session = await getSession(chat_id);
  const enrollment_id = session?.context?.enrollment_id;
  if (!enrollment_id) { await clearSession(chat_id); return; }
  if (text.trim() === '/skip') {
    await clearSession(chat_id);
    await sendMessage(chat_id, '✅ بعداً می‌توانید زمان یادآوری را تنظیم کنید.',
      { keyboard: await buildStartKeyboard(user) });
    return;
  }
  const m = text.trim().replace(/\D/g, '');
  const hour = parseInt(m, 10);
  if (isNaN(hour) || hour < 0 || hour > 23) {
    await sendMessage(chat_id, '❌ لطفاً عددی بین ۰ تا ۲۳ ارسال کنید.');
    return;
  }
  await supabase.from('enrollments').update({ followup_hour_tehran: hour }).eq('id', enrollment_id);
  await clearSession(chat_id);
  await sendMessage(chat_id,
    `✅ <b>عالی!</b> هر روز حدود ساعت ${hour}:00 تهران یک پیام شخصی از طرف کوچ شخصی شما دریافت می‌کنید. 🎯`,
    { keyboard: await buildStartKeyboard(user) });
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
  const { data: u } = await supabase.from('chat_users').select('phone, email').eq('id', user.id).maybeSingle();
  const variants = [u?.phone, `0${u?.phone}`].filter(Boolean) as string[];
  const { data: owns } = await supabase.from('enrollments').select('id, email')
    .in('phone', variants).eq('course_id', course.id).in('payment_status', ['success', 'completed']).limit(1);
  if (!owns?.length) { await editMessage(chat_id, message_id, '🚫 شما در این دوره ثبت‌نام نکرده‌اید.', [[{ text: '🏠', callback_data: 'menu:home' }]]); return; }

  const userEmail = u?.email || (owns[0] as any).email;
  const enrollmentId = owns[0].id;

  const { data: lessons } = await supabase.from('course_lessons')
    .select('id, title, lesson_number, order_index').eq('course_id', course.id)
    .order('order_index', { ascending: true }).limit(30);

  const text = [
    `📚 <b>${escapeHtml(course.title)}</b>`,
    course.description ? escapeHtml(String(course.description).slice(0, 200)) : '',
    ``,
    lessons?.length ? `<b>درس‌ها (${lessons.length}):</b>` : '📭 درسی ثبت نشده.',
  ].filter(Boolean).join('\n');

  // Generate one SSO token per link so the user lands directly logged in
  const buildSsoUrl = async (redirectPath: string): Promise<string> => {
    if (!userEmail) return `${ACADEMY_BASE}${redirectPath}`;
    const token = `sso_${crypto.randomUUID().replace(/-/g, '')}_${Date.now()}`;
    const { error } = await supabase.from('sso_tokens').insert({
      user_email: userEmail,
      course_slug: course.slug,
      token,
      type: 'academy',
      enrollment_id: enrollmentId,
    });
    if (error) return `${ACADEMY_BASE}${redirectPath}`;
    return `${ACADEMY_BASE}/sso-access?token=${token}&redirect=${encodeURIComponent(redirectPath)}`;
  };

  const keyboard: InlineKeyboard = [];
  for (const l of (lessons ?? []) as any[]) {
    const lessonPath = `/app/course/${course.slug}/lesson/${l.lesson_number ?? l.order_index ?? 1}`;
    const url = await buildSsoUrl(lessonPath);
    keyboard.push([{ text: `▶️ ${l.lesson_number ? `${l.lesson_number}. ` : ''}${l.title}`, url }]);
  }
  // Always send the user to the in-app (/app) course page so the Mini App stays in the app UI
  const coursePageUrl = await buildSsoUrl(`/app/course/${course.slug}`);
  keyboard.push([{ text: '📱 صفحه دوره (Mini App)', url: coursePageUrl }]);
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

// ============ AI Assistant ============
async function isAiAssistantEnabled(): Promise<boolean> {
  const { data } = await supabase
    .from('admin_settings')
    .select('telegram_ai_assistant_enabled')
    .eq('id', 1)
    .maybeSingle();
  return Boolean((data as any)?.telegram_ai_assistant_enabled);
}

async function aiKeyboardRows(authed: boolean): Promise<InlineKeyboard> {
  if (!authed) return [];
  if (!(await isAiAssistantEnabled())) return [];
  return [[{ text: '🤖 دستیار هوشمند', callback_data: 'ai:start' }]];
}

// Reply keyboard labels (persistent bottom buttons)
const KBD_END_CHAT = '⏹ پایان گفت‌وگو';
const KBD_HOME = '🏠 منوی اصلی';
const KBD_SALES_PAY = '💳 لینک پرداخت دوره';
const KBD_SALES_HUMAN = '📞 مشاور انسانی';

const AI_REPLY_KBD = [[KBD_END_CHAT], [KBD_HOME]];
const SALES_REPLY_KBD_BASE = [[KBD_SALES_HUMAN], [KBD_END_CHAT, KBD_HOME]];
const SALES_REPLY_KBD_WITH_PAY = [[KBD_SALES_PAY], [KBD_SALES_HUMAN], [KBD_END_CHAT, KBD_HOME]];

async function startAiChat(chat_id: number, _message_id: number | null, user: BotUser | null) {
  await setSession(chat_id, user?.id ?? null, 'ai_chat', { messages: [] });
  const txt = [
    `🤖 <b>دستیار هوشمند آکادمی رفیعی</b>`,
    ``,
    `هر سوالی دارید بپرسید — می‌توانید متن، عکس، فایل صوتی یا سند ارسال کنید.`,
    ``,
    `برای خروج از گفت‌وگو روی دکمه «${KBD_END_CHAT}» در پایین صفحه بزنید.`,
  ].join('\n');
  await sendMessage(chat_id, txt, { replyKeyboard: AI_REPLY_KBD });
}

async function endAiChat(chat_id: number, _message_id: number | null, user: BotUser | null) {
  await clearSession(chat_id);
  await sendMessage(chat_id, '✅ گفت‌وگو پایان یافت.', { removeKeyboard: true });
  const homeKbd = await buildStartKeyboard(user);
  await sendMessage(chat_id, await renderWelcome(chat_id, user), { keyboard: homeKbd });
}

const AI_SYSTEM_PROMPT = `شما دستیار هوشمند فارسی‌زبان آکادمی رفیعی هستید. به سوالات کاربران به صورت دقیق، دوستانه و کاربردی پاسخ دهید. اگر کاربر عکس، فایل صوتی یا سند ارسال کرد، محتوای آن را تحلیل و توضیح دهید. پاسخ‌ها را به فارسی، با لحن گرم و در صورت لزوم با استفاده از ایموجی و بولد (**متن مهم**) ارائه کنید. از فهرست‌بندی با خط تیره (-) برای موارد چندتایی استفاده کنید.`;

async function tgSendChatAction(chat_id: number, action: string) {
  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
    await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, action }),
    });
  } catch { /* ignore */ }
}

async function fileToDataUrl(file_id: string): Promise<{ dataUrl: string; mime: string } | null> {
  const f = await downloadFile(file_id);
  if (!f) return null;
  // base64 encode
  let bin = '';
  const bytes = f.bytes;
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(bin);
  return { dataUrl: `data:${f.mime};base64,${b64}`, mime: f.mime };
}

type AiMsg = { role: 'system' | 'user' | 'assistant'; content: any };

async function buildUserContentFromMessage(msg: any): Promise<any> {
  const parts: any[] = [];
  const text: string = msg.caption ?? msg.text ?? '';
  if (text) parts.push({ type: 'text', text });

  // Photo
  if (Array.isArray(msg.photo) && msg.photo.length) {
    const largest = msg.photo[msg.photo.length - 1];
    const f = await fileToDataUrl(largest.file_id);
    if (f) parts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
  }
  // Voice / audio
  if (msg.voice?.file_id) {
    const f = await fileToDataUrl(msg.voice.file_id);
    if (f) {
      const format = f.mime.includes('ogg') ? 'ogg' : (f.mime.includes('mp3') ? 'mp3' : 'ogg');
      const b64 = f.dataUrl.split(',')[1];
      parts.push({ type: 'input_audio', input_audio: { data: b64, format } });
    }
  }
  if (msg.audio?.file_id) {
    const f = await fileToDataUrl(msg.audio.file_id);
    if (f) {
      const b64 = f.dataUrl.split(',')[1];
      const format = f.mime.includes('mp3') || f.mime.includes('mpeg') ? 'mp3' : 'ogg';
      parts.push({ type: 'input_audio', input_audio: { data: b64, format } });
    }
  }
  // Document — image, PDF, text, or note
  if (msg.document?.file_id) {
    const mime = msg.document.mime_type ?? '';
    const fname = msg.document.file_name ?? 'سند';
    if (mime.startsWith('image/')) {
      const f = await fileToDataUrl(msg.document.file_id);
      if (f) parts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
    } else if (mime === 'application/pdf' || fname.toLowerCase().endsWith('.pdf')) {
      // Gemini accepts PDFs as inline data via image_url on the Lovable gateway
      const f = await fileToDataUrl(msg.document.file_id);
      if (f) {
        parts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
        parts.push({ type: 'text', text: `\n\n[فایل PDF پیوست شده: ${fname}]` });
      }
    } else if (mime.startsWith('text/') || mime.includes('json') || mime.includes('csv') || mime.includes('xml') || mime.includes('markdown')) {
      const f = await downloadFile(msg.document.file_id);
      if (f && f.bytes.length < 200_000) {
        const txt = new TextDecoder().decode(f.bytes);
        parts.push({ type: 'text', text: `\n\n[محتوای فایل ${fname}]\n${txt}` });
      } else {
        parts.push({ type: 'text', text: `\n\n[فایل ${fname} (${mime}) خیلی بزرگ است.]` });
      }
    } else {
      parts.push({ type: 'text', text: `\n\n[کاربر فایلی به نام ${fname} با نوع ${mime} ارسال کرد. در حال حاضر این نوع فایل قابل پردازش نیست — لطفاً PDF، تصویر، صوت یا متن ارسال کنید.]` });
    }
  }
  // Video
  if (msg.video?.file_id) {
    parts.push({ type: 'text', text: `\n\n[کاربر ویدیویی ارسال کرد. در حال حاضر پردازش ویدیو ممکن نیست.]` });
  }

  if (!parts.length) parts.push({ type: 'text', text: '(پیام خالی)' });
  return parts;
}

async function streamAiToTelegram(chat_id: number, messages: AiMsg[]): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    await sendMessage(chat_id, '❌ کلید LOVABLE_API_KEY تنظیم نشده است.');
    return '';
  }

  await tgSendChatAction(chat_id, 'typing');

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Lovable-API-Key': apiKey,
      'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      stream: true,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    const errTxt = await res.text().catch(() => '');
    if (res.status === 429) { await sendMessage(chat_id, '⚠️ محدودیت تعداد درخواست. کمی بعد دوباره تلاش کنید.'); return ''; }
    if (res.status === 402) { await sendMessage(chat_id, '⚠️ اعتبار سرویس هوش مصنوعی تمام شده است. لطفاً به مدیر اطلاع دهید.'); return ''; }
    console.error('AI gateway error', res.status, errTxt);
    await sendMessage(chat_id, '❌ خطا در ارتباط با هوش مصنوعی.');
    return '';
  }

  // Send placeholder message we'll keep editing
  const placeholder = await sendMessage(chat_id, '⏳ ...');
  const messageId: number | null = (placeholder as any)?.result?.message_id ?? null;

  let full = '';
  let lastEditedText = '';
  let lastEditAt = 0;
  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  let buf = '';

  const tryEdit = async (force = false) => {
    if (!messageId) return;
    const now = Date.now();
    if (!force && (now - lastEditAt < 600 || full === lastEditedText)) return;
    lastEditAt = now;
    lastEditedText = full;
    const display = (full || '⏳ ...').slice(0, 3900);
    try {
      await editMessage(chat_id, messageId, mdToTelegramHtml(display));
    } catch (e) { /* ignore edit errors (e.g. unchanged) */ }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') break;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === 'string') {
            full += delta;
            await tryEdit(false);
          }
        } catch { /* ignore parse */ }
      }
    }
  } catch (e) {
    console.error('stream read error', e);
  }
  await tryEdit(true);
  if (messageId && full) {
    try {
      await editMessage(chat_id, messageId, mdToTelegramHtml(full).slice(0, 4000));
    } catch { /* ignore */ }
  } else if (!full) {
    await sendMessage(chat_id, '❌ پاسخی دریافت نشد.');
  }
  return full;
}

async function handleAiChat(chat_id: number, user: BotUser | null, msg: any, session: any) {
  const userText: string = msg.caption ?? msg.text ?? '';
  // Reply keyboard button interception
  if (userText === KBD_END_CHAT || userText === KBD_HOME) {
    await endAiChat(chat_id, null, user);
    return;
  }
  // Build user content
  const userContent = await buildUserContentFromMessage(msg);

  // Conversation history
  const history: AiMsg[] = Array.isArray(session?.context?.messages) ? session.context.messages : [];
  const messages: AiMsg[] = [
    { role: 'system', content: AI_SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userContent },
  ];

  const reply = await streamAiToTelegram(chat_id, messages);

  // Persist only text snippets in history (avoid huge base64 blobs)
  const userTextOnly = Array.isArray(userContent)
    ? userContent.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ').slice(0, 2000) || '[رسانه]'
    : String(userContent);
  const newHistory = [...history, { role: 'user' as const, content: userTextOnly }];
  if (reply) newHistory.push({ role: 'assistant' as const, content: reply.slice(0, 2000) });
  // Keep last 12 turns
  const trimmed = newHistory.slice(-12);
  await setSession(chat_id, user?.id ?? null, 'ai_chat', { messages: trimmed });
}

// ============ 🛒 AI Sales Advisor ============
async function getSalesSettings() {
  const { data } = await supabase
    .from('admin_settings')
    .select('telegram_sales_ai_enabled, telegram_sales_ai_prompt, telegram_sales_ai_model, telegram_sales_default_course_id')
    .eq('id', 1).maybeSingle();
  return {
    enabled: Boolean((data as any)?.telegram_sales_ai_enabled),
    prompt: (data as any)?.telegram_sales_ai_prompt as string | null,
    model: (data as any)?.telegram_sales_ai_model || 'google/gemini-2.5-flash',
    defaultCourseId: (data as any)?.telegram_sales_default_course_id as string | null,
  };
}

async function getActiveSalesCoursesText(): Promise<string> {
  const { data } = await supabase
    .from('courses')
    .select('title, slug, price, description')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30);
  if (!data?.length) return '(فهرست دوره موجود نیست)';
  return data.map((c: any) => {
    const price = c.price ? `${Number(c.price).toLocaleString('fa-IR')} تومان` : 'رایگان';
    return `• ${c.title} (slug: ${c.slug}) — ${price}${c.description ? `\n  ${String(c.description).slice(0, 120)}` : ''}`;
  }).join('\n');
}

function extractPhoneFromText(t: string): string | null {
  const m = t.replace(/[٠-٩۰-۹]/g, (d) => String('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹'.indexOf(d) % 10))
    .match(/(?:\+?98|0)?9\d{9}/);
  return m ? m[0] : null;
}

async function getOrCreateSalesLead(chat_id: number, telegram_user: any): Promise<string | null> {
  // Look up existing lead_request keyed by telegram chat
  const tgKey = `telegram:${chat_id}`;
  const { data: existing } = await supabase
    .from('lead_requests')
    .select('id, answers')
    .eq('phone', tgKey)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const name = [telegram_user?.first_name, telegram_user?.last_name].filter(Boolean).join(' ').trim()
    || telegram_user?.username || `Telegram ${chat_id}`;
  const { data: created, error } = await supabase
    .from('lead_requests')
    .insert({
      phone: tgKey,
      name,
      status: 'new',
      answers: {
        source: 'telegram_sales_ai',
        telegram_chat_id: chat_id,
        telegram_username: telegram_user?.username ?? null,
        history: [],
      },
    })
    .select('id').maybeSingle();
  if (error) { console.error('sales lead create failed', error); return null; }
  return created?.id ?? null;
}

async function updateSalesLead(lead_id: string, patch: Record<string, any>, appendHistory?: { role: string; content: string }) {
  if (appendHistory) {
    const { data: cur } = await supabase.from('lead_requests').select('answers').eq('id', lead_id).maybeSingle();
    const answers = (cur?.answers ?? {}) as any;
    const history = Array.isArray(answers.history) ? answers.history : [];
    history.push({ ...appendHistory, at: new Date().toISOString() });
    patch.answers = { ...answers, ...(patch.answers ?? {}), history: history.slice(-40) };
  }
  await supabase.from('lead_requests').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', lead_id);
}

async function notifySalesTeamAboutLead(lead_id: string, summary: string) {
  const { data: lead } = await supabase.from('lead_requests')
    .select('id, name, phone, answers').eq('id', lead_id).maybeSingle();
  if (!lead) return;
  const { data: staff } = await supabase
    .from('chat_users')
    .select('telegram_chat_id, name, role, is_messenger_admin')
    .not('telegram_chat_id', 'is', null)
    .or('is_messenger_admin.eq.true,role.eq.admin,role.eq.sales_manager,role.eq.sales_agent')
    .limit(50);
  const tg = (lead.answers as any)?.telegram_chat_id;
  const username = (lead.answers as any)?.telegram_username;
  const text = [
    `🛒 <b>لید جدید از مشاور هوشمند تلگرام</b>`,
    ``,
    `👤 نام: ${escapeHtml(lead.name ?? '-')}`,
    username ? `🆔 @${escapeHtml(username)}` : '',
    tg ? `💬 Chat ID: <code>${tg}</code>` : '',
    ``,
    `<b>خلاصه گفت‌وگو:</b>`,
    escapeHtml(summary).slice(0, 1500),
  ].filter(Boolean).join('\n');
  const kbd: InlineKeyboard = tg ? [[{ text: '💬 شروع گفت‌وگو در تلگرام', url: `tg://user?id=${tg}` }]] : [];
  for (const s of (staff ?? [])) {
    try { await sendMessage(s.telegram_chat_id as number, text, { keyboard: kbd }); } catch { /* ignore */ }
  }
}

async function startSalesChat(chat_id: number, _message_id: number | null, telegram_user: any) {
  const settings = await getSalesSettings();
  if (!settings.enabled) {
    await sendMessage(chat_id, '⚠️ مشاور هوشمند فروش در حال حاضر غیرفعال است. لطفاً بعداً مراجعه کنید.', { removeKeyboard: true });
    return;
  }
  const lead_id = await getOrCreateSalesLead(chat_id, telegram_user);
  await setSession(chat_id, null, 'sales_chat', { lead_id, messages: [] });
  const txt = [
    `🛒 <b>مشاور دوره‌های آکادمی رفیعی</b>`,
    ``,
    `سلام 👋 من اینجام تا بهترین دوره یا خدمت رو متناسب با هدف و شرایط شما پیشنهاد بدم.`,
    ``,
    `لطفاً در یک یا دو جمله بگید چه هدفی دارید یا دنبال چه چیزی هستید؟`,
  ].join('\n');
  await sendMessage(chat_id, txt, { replyKeyboard: SALES_REPLY_KBD_BASE });
}

async function endSalesChat(chat_id: number, _message_id: number | null) {
  const s = await getSession(chat_id);
  const leadId = s?.context?.lead_id;
  if (leadId) await updateSalesLead(leadId, { status: 'closed' });
  await clearSession(chat_id);
  await sendMessage(chat_id, '✅ گفت‌وگو پایان یافت. ممنون از وقتی که گذاشتید 🙏', { removeKeyboard: true });
  const u = await resolveUser(chat_id);
  const homeKbd = await buildStartKeyboard(u);
  await sendMessage(chat_id, u ? welcomeText(u) : '👋 منوی اصلی', { keyboard: homeKbd });
}

async function showSalesPaymentOptions(chat_id: number, _message_id: number | null) {
  const { data: courses } = await supabase
    .from('courses').select('id, title, slug, price')
    .eq('is_active', true).order('created_at', { ascending: false }).limit(15);
  if (!courses?.length) {
    await sendMessage(chat_id, '❌ دوره‌ای فعال نیست.');
    return;
  }
  const baseUrl = 'https://academy.rafiei.co/enroll';
  const kbd: InlineKeyboard = courses.map((c: any) => [{
    text: `💳 ${c.title}${c.price ? ` — ${Number(c.price).toLocaleString('fa-IR')} ت` : ''}`,
    url: `${baseUrl}?course=${encodeURIComponent(c.slug)}&source=telegram_sales`,
  }]);
  await sendMessage(chat_id,
    '💳 <b>دوره موردنظر را برای دریافت لینک پرداخت انتخاب کنید:</b>\n\nروی هر دوره بزنید تا به صفحه پرداخت هدایت شوید.',
    { keyboard: kbd });
}

async function handoffSalesToHuman(chat_id: number, _message_id: number | null) {
  const s = await getSession(chat_id);
  const leadId = s?.context?.lead_id;
  if (!leadId) {
    await sendMessage(chat_id, '❌ نشست فعال یافت نشد. لطفاً /start را بزنید.', { removeKeyboard: true });
    return;
  }
  const history = Array.isArray(s?.context?.messages) ? s.context.messages : [];
  const summary = history.slice(-10).map((m: any) =>
    `${m.role === 'user' ? '👤 کاربر' : '🤖 مشاور'}: ${typeof m.content === 'string' ? m.content : '[رسانه]'}`).join('\n');
  await updateSalesLead(leadId, { status: 'handoff_requested' });
  await notifySalesTeamAboutLead(leadId, summary || 'بدون گفت‌وگو');
  await sendMessage(chat_id,
    '✅ درخواست شما به تیم فروش ارسال شد. به‌زودی یک کارشناس انسانی با شما تماس می‌گیرد.\n\nاگر سوال دیگری دارید همینجا بنویسید.');
}

// Detect when user is explicitly asking for payment info or agreed to buy
function userWantsPayment(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  const patterns = [
    'پرداخت', 'لینک پرداخت', 'لینک خرید', 'بخرم', 'خرید کنم', 'خرید میکنم',
    'ثبت نام', 'ثبت‌نام', 'موافقم', 'قبول', 'باشه میخرم', 'می‌خرم', 'میخرم',
    'چطور بخرم', 'چجوری ثبت نام', 'هزینه چقدر', 'قیمت', 'تومن', 'تومان',
    'pay', 'buy', 'enroll', 'checkout',
  ];
  return patterns.some(p => t.includes(p));
}

const SALES_PAY_MARKER = '[SHOW_PAY]';

async function handleSalesChat(chat_id: number, msg: any, session: any) {
  const settings = await getSalesSettings();
  if (!settings.enabled) {
    await sendMessage(chat_id, '⚠️ مشاور هوشمند فروش غیرفعال شد.', { removeKeyboard: true });
    await clearSession(chat_id);
    return;
  }
  const leadId: string | null = session?.context?.lead_id ?? null;
  const userText: string = msg.caption ?? msg.text ?? '';

  // Reply keyboard button interception
  if (userText === KBD_END_CHAT) { await endSalesChat(chat_id, null); return; }
  if (userText === KBD_HOME) { await endSalesChat(chat_id, null); return; }
  if (userText === KBD_SALES_HUMAN) { await handoffSalesToHuman(chat_id, null); return; }
  if (userText === KBD_SALES_PAY) { await showSalesPaymentOptions(chat_id, null); return; }

  // Detect phone in user message
  if (leadId && userText) {
    const phone = extractPhoneFromText(userText);
    if (phone) {
      let normalized = phone.replace(/^\+?98/, '').replace(/^0/, '');
      normalized = '0' + normalized;
      await updateSalesLead(leadId, { phone: normalized });
    }
  }

  const userAskedPay = userWantsPayment(userText);
  const courseList = await getActiveSalesCoursesText();
  const basePrompt = settings.prompt || `شما «مشاور فروش هوشمند آکادمی رفیعی» هستید. با لحن گرم، فارسی روان و حرفه‌ای پاسخ دهید. از تکنیک‌های فروش مشاوره‌ای استفاده کنید: ابتدا نیاز و هدف کاربر را بفهمید، سپس دوره مناسب را پیشنهاد دهید و مزایا را شفاف توضیح دهید. هرگز فشار نیاورید.`;
  const systemPrompt = [
    basePrompt,
    ``,
    `📚 فهرست دوره‌های فعال آکادمی:`,
    courseList,
    ``,
    `قوانین مهم پاسخگویی:`,
    `1) از فرمت تلگرام استفاده کنید: **متن مهم** برای بولد، ایموجی مناسب در ابتدای پاراگراف‌های کلیدی، و خط تیره (-) برای فهرست‌ها. از عناوین #/## یا کد بلاک استفاده نکنید.`,
    `2) پاسخ‌ها کوتاه و خوانا باشد (حداکثر ۳-۴ پاراگراف کوتاه).`,
    `3) **هرگز** خودتان لینک پرداخت یا قیمت‌گذاری اضافه نزنید مگر اینکه کاربر صریحاً درخواست خرید/پرداخت/قیمت کند یا با خرید موافقت کند.`,
    `4) فقط زمانی که کاربر صریحاً آماده خرید است یا درخواست پرداخت/قیمت/ثبت‌نام کرد، در انتهای پیام (در یک خط جدا) دقیقاً این علامت را بنویسید: ${SALES_PAY_MARKER}`,
    `   با این علامت سیستم دکمه‌های پرداخت را به کاربر نمایش می‌دهد. در غیر این صورت **این علامت را به هیچ عنوان ننویسید**.`,
    `5) اگر کاربر شماره موبایل یا نام داد، تشکر کنید و ادامه دهید.`,
  ].join('\n');

  const userContent = await buildUserContentFromMessage(msg);
  const history: AiMsg[] = Array.isArray(session?.context?.messages) ? session.context.messages : [];
  const messages: AiMsg[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userContent },
  ];

  // Use the same fast model as the smart assistant for speed
  const rawReply = await streamSalesAiToTelegram(chat_id, messages, 'google/gemini-2.5-flash');
  const showPay = userAskedPay || rawReply.includes(SALES_PAY_MARKER);
  const cleanReply = rawReply.replace(SALES_PAY_MARKER, '').trim();

  if (showPay) {
    await showSalesPaymentOptions(chat_id, null);
  }

  const userTextOnly = Array.isArray(userContent)
    ? userContent.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ').slice(0, 2000) || '[رسانه]'
    : String(userContent);
  const newHistory = [...history, { role: 'user' as const, content: userTextOnly }];
  if (cleanReply) newHistory.push({ role: 'assistant' as const, content: cleanReply.slice(0, 2000) });
  const trimmed = newHistory.slice(-16);
  await setSession(chat_id, null, 'sales_chat', { lead_id: leadId, messages: trimmed });

  if (leadId) {
    await updateSalesLead(leadId, { status: 'in_progress' }, { role: 'user', content: userTextOnly });
    if (cleanReply) await updateSalesLead(leadId, {}, { role: 'assistant', content: cleanReply.slice(0, 800) });
  }
}

async function streamSalesAiToTelegram(chat_id: number, messages: AiMsg[], model: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) { await sendMessage(chat_id, '❌ LOVABLE_API_KEY تنظیم نشده.'); return ''; }
  await tgSendChatAction(chat_id, 'typing');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: true, messages }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) { await sendMessage(chat_id, '⚠️ محدودیت درخواست. کمی بعد دوباره تلاش کنید.'); return ''; }
    if (res.status === 402) { await sendMessage(chat_id, '⚠️ اعتبار سرویس هوش مصنوعی تمام شده.'); return ''; }
    await sendMessage(chat_id, '❌ خطا در ارتباط با هوش مصنوعی.'); return '';
  }
  const placeholder = await sendMessage(chat_id, '⏳ ...');
  const messageId: number | null = (placeholder as any)?.result?.message_id ?? null;
  let full = '', lastEdit = '', lastAt = 0;
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
  const displayText = () => mdToTelegramHtml((full.replace(SALES_PAY_MARKER, '') || '⏳ ...').slice(0, 3900));
  const tryEdit = async (force = false) => {
    if (!messageId) return;
    const now = Date.now();
    // Faster updates: ~600ms throttle instead of 1300ms
    if (!force && (now - lastAt < 600 || full === lastEdit)) return;
    lastAt = now; lastEdit = full;
    try { await editMessage(chat_id, messageId, displayText()); } catch { /* ignore */ }
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') break;
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content;
          if (typeof delta === 'string') { full += delta; await tryEdit(false); }
        } catch { /* ignore */ }
      }
    }
  } catch (e) { console.error('sales stream error', e); }
  await tryEdit(true);
  if (messageId && full) {
    try { await editMessage(chat_id, messageId, mdToTelegramHtml(full.replace(SALES_PAY_MARKER, '')).slice(0, 4000)); } catch { /* ignore */ }
  } else if (!full) {
    await sendMessage(chat_id, '❌ پاسخی دریافت نشد.');
  }
  return full;
}

// ============ Webinars ============
async function getActiveWebinars() {
  const { data } = await supabase
    .from('webinar_entries')
    .select('id, title, slug, start_date, status')
    .neq('status', 'ended')
    .order('start_date', { ascending: true, nullsFirst: false })
    .limit(10);
  const now = Date.now();
  return (data ?? []).filter((w: any) => !w.start_date || new Date(w.start_date).getTime() > now - 2 * 60 * 60 * 1000);
}

async function webinarsKeyboardRows(): Promise<InlineKeyboard> {
  const webinars = await getActiveWebinars();
  return webinars.map((w: any) => [{ text: `🎥 ${w.title}`, callback_data: `webinar:view:${w.id.slice(0, 8)}` }]);
}

async function findWebinarByPrefix(prefix: string) {
  const { data } = await supabase.from('webinar_entries').select('*').neq('status', 'ended').limit(500);
  return (data ?? []).find((w: any) => w.id.startsWith(prefix));
}

function formatWebinarDate(d: string | null): string {
  if (!d) return 'به‌زودی';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran', dateStyle: 'full', timeStyle: 'short',
    }).format(new Date(d));
  } catch { return d; }
}

async function renderWebinar(chat_id: number, message_id: number | null, prefix: string, user: BotUser | null) {
  const w = await findWebinarByPrefix(prefix);
  if (!w) {
    const msg = '❌ وبینار یافت نشد.';
    if (message_id) await editMessage(chat_id, message_id, msg, [[{ text: '🏠', callback_data: 'menu:home' }]]);
    else await sendMessage(chat_id, msg);
    return;
  }
  let alreadyRegistered = false;
  if (user?.phone) {
    const normPhone = normalizeIntlPhone(user.phone);
    const { data: part } = await supabase
      .from('webinar_participants').select('id').eq('webinar_id', w.id).eq('phone', normPhone).maybeSingle();
    alreadyRegistered = !!part;
    if (!alreadyRegistered) {
      const variants = Array.from(new Set([normPhone, user.phone, user.phone.replace(/^\+/, '')]));
      const { data: sig } = await supabase
        .from('webinar_signups').select('id').eq('webinar_id', w.id).in('mobile_number', variants).maybeSingle();
      alreadyRegistered = !!sig;
    }
  }
  const lines = [
    `🎥 <b>${escapeHtml(w.title)}</b>`,
    w.host_name ? `👤 مدرس: ${escapeHtml(w.host_name)}` : '',
    `🗓 ${escapeHtml(formatWebinarDate(w.start_date))}`,
    w.description ? `\n${escapeHtml(w.description)}` : '',
    '',
    alreadyRegistered ? '✅ شما قبلاً ثبت‌نام کرده‌اید.' : (user ? 'برای ثبت‌نام دکمه زیر را بزنید.' : '🔐 برای ثبت‌نام ابتدا وارد حساب شوید.'),
  ].filter(Boolean).join('\n');
  const kbd: InlineKeyboard = [];
  if (user && !alreadyRegistered) {
    kbd.push([{ text: '✅ ثبت‌نام در وبینار', callback_data: `webinar:reg:${prefix}` }]);
  } else if (!user) {
    kbd.push([{ text: '🔐 ورود با شماره موبایل', callback_data: 'login:start' }]);
  }
  if (w.webinar_link && (alreadyRegistered || (w.status === 'live'))) {
    kbd.push([{ text: '🔗 ورود به وبینار', url: w.webinar_link }]);
  }
  if (w.telegram_channel_link) {
    kbd.push([{ text: '📢 کانال تلگرام وبینار', url: w.telegram_channel_link }]);
  }
  kbd.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);
  if (message_id) await editMessage(chat_id, message_id, lines, kbd);
  else await sendMessage(chat_id, lines, { keyboard: kbd });
}

function normalizeIntlPhone(input: string): string {
  let p = (input || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+')) return p;
  if (p.startsWith('00')) return '+' + p.substring(2);
  if (p.startsWith('0')) return '+98' + p.substring(1);
  if (p.startsWith('98')) return '+' + p;
  if (/^9\d{9}$/.test(p)) return '+98' + p;
  return '+' + p;
}

async function registerWebinar(chat_id: number, message_id: number, prefix: string, user: BotUser) {
  const w = await findWebinarByPrefix(prefix);
  if (!w) { await editMessage(chat_id, message_id, '❌ وبینار یافت نشد.', [[{ text: '🏠', callback_data: 'menu:home' }]]); return; }
  if (!user.phone) { await editMessage(chat_id, message_id, '❌ شماره موبایل شما ثبت نشده. لطفاً مجدداً وارد شوید.', [[{ text: '🔐 ورود', callback_data: 'login:start' }]]); return; }

  const normPhone = normalizeIntlPhone(user.phone);

  // 1. webinar_participants (canonical — used by site live page)
  const { error: partErr } = await supabase
    .from('webinar_participants')
    .upsert(
      { webinar_id: w.id, phone: normPhone, display_name: user.name || null },
      { onConflict: 'webinar_id,phone' },
    );
  if (partErr) {
    console.error('webinar_participants upsert failed:', partErr);
    await editMessage(chat_id, message_id, `❌ خطا در ثبت‌نام: ${escapeHtml(partErr.message)}`, [[{ text: '🏠', callback_data: 'menu:home' }]]);
    return;
  }

  // 2. webinar_signups (legacy — used by admin signups view)
  const { data: existing } = await supabase
    .from('webinar_signups').select('id').eq('webinar_id', w.id).eq('mobile_number', normPhone).maybeSingle();
  if (!existing) {
    const { error: sigErr } = await supabase.from('webinar_signups').insert({
      webinar_id: w.id, mobile_number: normPhone,
    });
    if (sigErr) console.error('webinar_signups insert failed:', sigErr);
  }

  // 3. webinar_registrations (used by admin registrations count/view)
  const { data: existingReg } = await supabase
    .from('webinar_registrations').select('id').eq('webinar_id', w.id).eq('mobile_number', normPhone).maybeSingle();
  if (!existingReg) {
    const { error: regErr } = await supabase.from('webinar_registrations').insert({
      webinar_id: w.id, mobile_number: normPhone,
    });
    if (regErr) console.error('webinar_registrations insert failed:', regErr);
  }

  const kbd: InlineKeyboard = [];
  if (w.webinar_link) kbd.push([{ text: '🔗 ورود به وبینار', url: w.webinar_link }]);
  if (w.telegram_channel_link) kbd.push([{ text: '📢 کانال تلگرام وبینار', url: w.telegram_channel_link }]);
  kbd.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);
  await editMessage(chat_id, message_id,
    `✅ <b>ثبت‌نام شما در وبینار انجام شد</b>\n\n🎥 ${escapeHtml(w.title)}\n🗓 ${escapeHtml(formatWebinarDate(w.start_date))}`,
    kbd,
  );
}

async function salesAdvisorRows(): Promise<InlineKeyboard> {
  const s = await getSalesSettings();
  if (!s.enabled) return [];
  return [[{ text: '🛒 مشاور دوره‌های آکادمی', callback_data: 'sales:start' }]];
}

async function buildStartKeyboard(user: BotUser | null): Promise<InlineKeyboard> {
  const authed = !!user;
  const [salesRows, formRows, webinarRows, aiRows, base] = await Promise.all([
    salesAdvisorRows(),
    formsKeyboardRows(),
    webinarsKeyboardRows(),
    aiKeyboardRows(authed),
    authed ? mainMenu(user) : Promise.resolve(loginMenu()),
  ]);
  return [...salesRows, ...aiRows, ...webinarRows, ...formRows, ...base];
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
  const kbd = await buildStartKeyboard(user);
  await editMessage(chat_id, message_id, '❌ فرم لغو شد.', kbd);
}

async function handleFormMessage(chat_id: number, user_id: number | null, msg: any, session: any) {
  const { submission_id, form_id, field_index } = session.context;
  const fields = await getFormFields(form_id);
  const field = fields[field_index];
  if (!field) { await clearSession(chat_id); return; }

  const text: string = msg.text ?? '';
  if (text === '/cancel') {
    await supabase.from('telegram_form_submissions').update({ status: 'cancelled' }).eq('id', submission_id);
    await clearSession(chat_id);
    await sendMessage(chat_id, '❌ فرم لغو شد.');
    return;
  }
  if (text === '/skip') {
    if (field.required) { await sendMessage(chat_id, '⚠️ این فیلد الزامی است و قابل رد کردن نیست.'); return; }
    await saveAnswerAndAdvance(chat_id, user_id, submission_id, form_id, field, field_index, { value_text: null });
    return;
  }

  // Photo
  if (field.field_type === 'image') {
    const photos = msg.photo;
    if (!photos?.length) { await sendMessage(chat_id, '⚠️ لطفاً یک عکس ارسال کنید.'); return; }
    const best = photos[photos.length - 1];
    const up = await uploadTelegramFile(submission_id, field.id, best.file_id, 'messenger-files', 'jpg');
    if (!up) { await sendMessage(chat_id, '❌ خطا در آپلود عکس.'); return; }
    await sendMessage(chat_id, '✅ عکس دریافت شد.');
    await saveAnswerAndAdvance(chat_id, user_id, submission_id, form_id, field, field_index, { file_url: up.url, file_mime: up.mime });
    return;
  }
  if (field.field_type === 'voice') {
    const voice = msg.voice ?? msg.audio;
    if (!voice?.file_id) { await sendMessage(chat_id, '⚠️ لطفاً یک پیام صوتی ارسال کنید.'); return; }
    const up = await uploadTelegramFile(submission_id, field.id, voice.file_id, 'voice-messages', 'ogg');
    if (!up) { await sendMessage(chat_id, '❌ خطا در آپلود صدا.'); return; }
    await sendMessage(chat_id, '✅ پیام صوتی دریافت شد.');
    await saveAnswerAndAdvance(chat_id, user_id, submission_id, form_id, field, field_index, { file_url: up.url, file_mime: up.mime });
    return;
  }
  if (field.field_type === 'file') {
    const doc = msg.document;
    if (!doc?.file_id) { await sendMessage(chat_id, '⚠️ لطفاً یک فایل ارسال کنید.'); return; }
    const ext = (doc.file_name?.split('.').pop() ?? 'bin').toLowerCase();
    const up = await uploadTelegramFile(submission_id, field.id, doc.file_id, 'messenger-files', ext);
    if (!up) { await sendMessage(chat_id, '❌ خطا در آپلود فایل.'); return; }
    await sendMessage(chat_id, '✅ فایل دریافت شد.');
    await saveAnswerAndAdvance(chat_id, user_id, submission_id, form_id, field, field_index, { file_url: up.url, file_mime: up.mime });
    return;
  }
  if (field.field_type === 'dropdown') {
    await sendMessage(chat_id, '👇 لطفاً از دکمه‌های گزینه‌ها انتخاب کنید.');
    return;
  }

  // text-based
  if (!text) { await sendMessage(chat_id, '⚠️ لطفاً یک پاسخ متنی ارسال کنید.'); return; }
  const v = validateFieldValue(field, text);
  if (!v.ok) { await sendMessage(chat_id, `⚠️ ${v.error}`); return; }
  await saveAnswerAndAdvance(chat_id, user_id, submission_id, form_id, field, field_index, { value_text: v.value });
}

// ============ Update routing ============


async function handleUpdate(update: any) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chat_id = cq.message.chat.id;
    const message_id = cq.message.message_id;
    const data: string = cq.data;
    await answerCallback(cq.id);

    // Handle login + form + webinar callbacks before user-resolution
    if (data === 'login:start') { await startLogin(chat_id, message_id); return; }
    if (data === 'form:cancel') { await cancelForm(chat_id, message_id); return; }
    if (data === 'menu:home') {
      await clearSession(chat_id);
      const u = await resolveUser(chat_id);
      const kbd = await buildStartKeyboard(u);
      const txt = u ? welcomeText(u) : '👋 منوی اصلی';
      await editMessage(chat_id, message_id, txt, kbd);
      return;
    }
    if (data === 'ai:start') {
      const u = await resolveUser(chat_id);
      if (!u) {
        await editMessage(chat_id, message_id, '🔐 دستیار هوشمند فقط برای کاربران واردشده فعال است. ابتدا وارد شوید.',
          [[{ text: '🔐 ورود با شماره موبایل', callback_data: 'login:start' }], [{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]]);
        return;
      }
      await startAiChat(chat_id, message_id, u);
      return;
    }
    if (data === 'ai:end') {
      const u = await resolveUser(chat_id);
      await endAiChat(chat_id, message_id, u);
      return;
    }
    if (data === 'sales:start') {
      await startSalesChat(chat_id, message_id, cq.from);
      return;
    }
    if (data === 'sales:end') { await endSalesChat(chat_id, message_id); return; }
    if (data === 'sales:pay') { await showSalesPaymentOptions(chat_id, message_id); return; }
    if (data === 'sales:handoff') { await handoffSalesToHuman(chat_id, message_id); return; }
    if (data === 'sales:back') {
      await sendMessage(chat_id, '✅ ادامه گفت‌وگو — هر سوالی دارید بپرسید.', { replyKeyboard: SALES_REPLY_KBD_BASE });
      return;
    }

    // ===== Support activation: user confirmed sending message → fully activate =====
    if (data.startsWith('sact:sent:')) {
      const actId = data.slice('sact:sent:'.length);
      const { data: cur } = await supabase
        .from('support_activations')
        .select('id, status, user_id, course_id, telegram_id')
        .eq('id', actId)
        .maybeSingle();
      if (cur) {
        if (cur.status !== 'activated') {
          await supabase.from('support_activations').update({
            status: 'activated',
            activated_at: new Date().toISOString(),
            clicked_support_button_at: new Date().toISOString(),
          }).eq('id', actId);
          await supabase.from('support_activation_events').insert({
            support_activation_id: actId,
            user_id: cur.user_id,
            course_id: cur.course_id,
            event_type: 'activated_via_confirm_button',
            payload_json: { via: 'inline_button' },
          });
        }

        // Load course + user, build welcome + buttons
        const [{ data: course }, { data: cu }] = await Promise.all([
          supabase.from('courses').select('title, telegram_bot_activated_message, telegram_bot_activation_buttons, telegram_channel_link, redirect_url, support_link, slug').eq('id', cur.course_id).maybeSingle(),
          supabase.from('chat_users').select('name, first_name').eq('id', cur.user_id).maybeSingle(),
        ]);
        const displayName = (cu as any)?.first_name || (cu as any)?.name || 'دوست عزیز';
        const courseTitle = (course as any)?.title || 'دوره';
        const defaultTpl = [
          'درود بر شما {{name}} 🌱',
          'پشتیبانی اختصاصی شما با موفقیت فعال شد ✅',
          '',
          'دسترسی به دوره «{{course_title}}» از دکمه‌های زیر برای شما فعال است.',
          '',
          'با آرزوی موفقیت',
          'تیم پشتیبانی آکادمی رفیعی',
        ].join('\n');
        const tpl = ((course as any)?.telegram_bot_activated_message as string | null) || defaultTpl;
        const welcome = tpl
          .replace(/\{\{name\}\}/g, escapeHtml(displayName))
          .replace(/\{\{course_title\}\}/g, escapeHtml(courseTitle));

        const buttons: { text: string; url: string }[][] = [];
        const slug = (course as any)?.slug;
        const accessUrl = (course as any)?.redirect_url || (slug ? `https://academy.rafiei.co/access?course=${slug}` : null);
        if (accessUrl) buttons.push([{ text: '🚀 شروع و دسترسی به دوره', url: accessUrl }]);
        const channel = (course as any)?.telegram_channel_link;
        if (channel) buttons.push([{ text: '📢 کانال دوره', url: channel }]);
        const support = (course as any)?.support_link;
        if (support) buttons.push([{ text: '💬 ارتباط با پشتیبان', url: support }]);
        const customButtons = Array.isArray((course as any)?.telegram_bot_activation_buttons)
          ? ((course as any).telegram_bot_activation_buttons as any[])
          : [];
        for (const b of customButtons) {
          if (b?.text && b?.url) buttons.push([{ text: String(b.text), url: String(b.url) }]);
        }

        try {
          await editMessage(chat_id, message_id, '✅ پشتیبانی شما فعال شد.', []);
        } catch {}
        await tgCall('sendMessage', {
          chat_id,
          text: welcome,
          parse_mode: 'HTML',
          reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined,
        });
      } else {
        await editMessage(chat_id, message_id, '❌ فعال‌سازی یافت نشد.', []);
      }
      return;
    }



    const userEarly = await resolveUser(chat_id);
    if (data.startsWith('webinar:view:')) {
      const prefix = data.split(':')[2];
      await renderWebinar(chat_id, message_id, prefix, userEarly);
      return;
    }
    if (data.startsWith('webinar:reg:')) {
      const prefix = data.split(':')[2];
      if (!userEarly) {
        await editMessage(chat_id, message_id, '🔐 برای ثبت‌نام ابتدا وارد حساب شوید.',
          [[{ text: '🔐 ورود با شماره موبایل', callback_data: 'login:start' }], [{ text: '🏠', callback_data: 'menu:home' }]]);
        return;
      }
      await registerWebinar(chat_id, message_id, prefix, userEarly);
      return;
    }
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
          const homeKbd = await buildStartKeyboard(user);
          await editMessage(chat_id, message_id, welcomeText(user), homeKbd);
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

      if (action === 'manual') {
        if (!['admin', 'sales_manager', 'sales_agent'].includes(user.role ?? '')) {
          await answerCallback(cq.id, '🚫 دسترسی ندارید');
          return;
        }
        const sub = rest[0]; // 'approve' | 'reject'
        const enrollment_id = rest[1];
        if (sub !== 'approve' && sub !== 'reject') return;

        try {
          const res = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/approve-manual-payment`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                enrollmentId: enrollment_id,
                action: sub,
                adminNotes: `از طریق تلگرام توسط ${user.name}`,
              }),
            },
          );
          const out = await res.json().catch(() => ({}));
          const ok = res.ok && out?.success !== false;
          const verdict = sub === 'approve'
            ? `✅ <b>تایید شد</b> توسط ${escapeHtml(user.name)}`
            : `❌ <b>رد شد</b> توسط ${escapeHtml(user.name)}`;

          if (cq.message?.caption) {
            // Photo message → edit caption
            await tgCall('editMessageCaption', {
              chat_id, message_id,
              caption: `${cq.message.caption}\n\n${verdict}`,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [[{ text: '👁 مشاهده لید', callback_data: `lead:view:${enrollment_id}` }]] },
            });
          } else {
            await editMessage(
              chat_id, message_id,
              `${cq.message?.text ?? ''}\n\n${verdict}`,
              [[{ text: '👁 مشاهده لید', callback_data: `lead:view:${enrollment_id}` }]],
            );
          }
          await answerCallback(cq.id, ok ? (sub === 'approve' ? 'تایید شد' : 'رد شد') : 'خطا در ثبت');
        } catch (e: any) {
          console.error('manual action error', e);
          await answerCallback(cq.id, 'خطا');
        }
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

      if (action === 'enroll' && rest[0] === 'settime') {
        const enrollment_id = rest[1];
        await setSession(chat_id, user.id, 'awaiting_followup_time', { enrollment_id });
        await editMessage(chat_id, message_id,
          [
            `⏰ <b>تنظیم زمان یادآوری روزانه</b>`,
            `یک عدد بین ۰ تا ۲۳ ارسال کنید (ساعت تهران).`,
            `برای حذف یادآوری: /skip`,
          ].join('\n'),
          [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]]);
        return;
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

  // Messages (including Telegram Business messages)
  const msg = update.message ?? update.edited_message ?? update.business_message ?? update.edited_business_message;
  if (!msg?.chat?.id) return;
  const chat_id = msg.chat.id;
  const business_connection_id: string | undefined = msg?.business_connection_id ?? update.business_message?.business_connection_id ?? update.edited_business_message?.business_connection_id;
  const text: string = msg.text ?? '';

  // Personalized coach: refresh activity + capture coaching answers (best-effort)
  try {
    await supabase.from('enrollments')
      .update({ last_activity_at: new Date().toISOString(), inactivity_stage: 0 })
      .eq('telegram_chat_id', chat_id);
    if (text && text.trim()) {
      const { data: enrs } = await supabase.from('enrollments')
        .select('id').eq('telegram_chat_id', chat_id);
      const ids = (enrs ?? []).map((e: any) => e.id);
      if (ids.length) {
        const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        const { data: events } = await supabase.from('enrollment_followup_events')
          .select('id, enrollment_id, payload, user_replied_at, event_type, sent_at')
          .in('enrollment_id', ids)
          .eq('event_type', 'coaching_checkin')
          .is('user_replied_at', null)
          .gte('sent_at', cutoff)
          .order('sent_at', { ascending: false })
          .limit(1);
        const ev = events?.[0];
        if (ev) {
          await supabase.from('enrollment_followup_events').update({
            user_replied_at: new Date().toISOString(),
            reply_text: text.slice(0, 2000),
            payload: { ...(ev.payload ?? {}), answer: text.slice(0, 2000) },
          }).eq('id', ev.id);
          // Surface to CRM as a note
          try {
            await supabase.from('crm_notes').insert({
              enrollment_id: ev.enrollment_id,
              content: `پاسخ کوچینگ تلگرام:\nسوال: ${ev?.payload?.question ?? ''}\nپاسخ: ${text.slice(0, 2000)}`,
              type: 'coaching_reply',
            });
          } catch (e) { console.warn('crm_notes insert skipped', e); }
        }
      }
    }
  } catch (e) { console.warn('activity tracking skipped', e); }

  if (text === '/myid') {
    await sendMessage(chat_id, `🆔 Chat ID شما: <code>${chat_id}</code>`);
    return;
  }
  if (text === '/cancel') {
    await clearSession(chat_id);
  }

  const user = await resolveUser(chat_id);

  // Parse /start payload (deep link, e.g. /start enroll_<id>)
  const startMatch = text.match(/^\/start(?:\s+(\S+))?$/);
  const startPayload = startMatch?.[1] ?? null;
  console.log('📥 msg chat_id=', chat_id, 'text=', JSON.stringify(text), 'startPayload=', startPayload, 'user_linked=', !!user);

  // ===== Website login deep-link: /start login_<token> =====
  if (startPayload?.startsWith('login_')) {
    const loginToken = startPayload.slice('login_'.length);
    const { data: row } = await supabase
      .from('telegram_login_tokens')
      .select('token, expires_at')
      .eq('token', loginToken)
      .maybeSingle();
    if (!row) {
      await sendMessage(chat_id, '❌ این لینک ورود نامعتبر است. لطفاً از وب‌سایت لینک جدید بگیرید.');
      return;
    }
    if (new Date(row.expires_at) < new Date()) {
      await sendMessage(chat_id, '⏰ این لینک ورود منقضی شده. لطفاً از وب‌سایت دوباره تلاش کنید.');
      return;
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const tgUsername = msg?.from?.username ?? null;
    const fName = msg?.from?.first_name ?? null;
    await supabase
      .from('telegram_login_tokens')
      .update({
        telegram_chat_id: chat_id,
        telegram_username: tgUsername,
        first_name: fName,
        otp_code: otp,
        updated_at: new Date().toISOString(),
      })
      .eq('token', loginToken);
    await sendMessage(chat_id, [
      '🔐 <b>Academy login code / کد ورود به آکادمی</b>',
      '',
      `One-time code: <code>${otp}</code>`,
      '',
      'Enter this code on the website to finish signing in.',
      'Valid for 15 minutes.',
    ].join('\n'));
    // Ask the user to share their phone so registration can skip the second OTP.
    await tgCall('sendMessage', {
      chat_id,
      text: '📱 Optional: tap the button below to share your phone with the academy so registration is one-tap.',
      reply_markup: {
        keyboard: [[{ text: '📱 Share my phone', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  // ===== Support activation deep-link: /start sact_<token> =====
  if (startPayload?.startsWith('sact_')) {
    const token = startPayload.slice('sact_'.length);
    const { data: act } = await supabase
      .from('support_activations')
      .select('id, user_id, course_id, status, support_prefilled_link')
      .eq('activation_token', token)
      .maybeSingle();
    if (!act) {
      await sendMessage(chat_id, '❌ لینک فعال‌سازی نامعتبر است. لطفاً از داشبورد آکادمی دوباره تلاش کنید.');
      return;
    }
    // Load course + user for message rendering
    const [{ data: course }, { data: cu }] = await Promise.all([
      supabase.from('courses').select('title, telegram_bot_welcome_message').eq('id', act.course_id).maybeSingle(),
      supabase.from('chat_users').select('name, first_name').eq('id', act.user_id).maybeSingle(),
    ]);
    const displayName = (cu as any)?.first_name || (cu as any)?.name || 'دوست عزیز';
    const courseTitle = (course as any)?.title || 'دوره';
    const defaultTpl = 'درود {{name}} عزیز 🌱\n\nبه آکادمی رفیعی خوش اومدی.\n\nبرای فعال‌سازی پشتیبانی دوره «{{course_title}}»، روی دکمه زیر بزن.\nبعد از باز شدن چت پشتیبانی، فقط گزینه Send / ارسال پیام رو بزن تا اطلاعاتت برای تیم پشتیبانی ارسال بشه.';
    const tpl = ((course as any)?.telegram_bot_welcome_message as string | null) || defaultTpl;
    const welcome = tpl
      .replace(/\{\{name\}\}/g, escapeHtml(displayName))
      .replace(/\{\{course_title\}\}/g, escapeHtml(courseTitle));

    // Update status → opened_bot (do not downgrade if already further)
    const newStatus = ['clicked_support_button', 'pending_manual_confirmation', 'activated'].includes(act.status)
      ? act.status
      : 'opened_bot';
    await supabase.from('support_activations').update({
      status: newStatus,
      opened_bot_at: new Date().toISOString(),
      telegram_id: chat_id,
      telegram_username: msg?.from?.username ?? null,
      telegram_first_name: msg?.from?.first_name ?? null,
      telegram_last_name: msg?.from?.last_name ?? null,
    }).eq('id', act.id);
    await supabase.from('support_activation_events').insert({
      support_activation_id: act.id,
      user_id: act.user_id,
      course_id: act.course_id,
      event_type: 'opened_bot',
      payload_json: { chat_id },
    });

    const supportUrl = act.support_prefilled_link || `https://t.me/rafieiacademy`;
    await tgCall('sendMessage', {
      chat_id,
      text: welcome,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 فعال‌سازی پشتیبانی دوره', url: supportUrl }],
          [{ text: '✅ پیام را ارسال کردم', callback_data: `sact:sent:${act.id}` }],
        ],
      },
    });
    return;
  }

  // ===== Auto-detect support-activation message anywhere (e.g. support group where bot is a member) =====
  if (text) {
    const tokenMatch = text.match(/(?:کد\s*فعال[‌\s]*سازی|activation[_\s-]*token|activation[_\s-]*code)\s*[:：]\s*([a-f0-9]{16,64})/i);
    if (tokenMatch) {
      const token = tokenMatch[1].toLowerCase();
      const { data: act } = await supabase
        .from('support_activations')
        .select('id, user_id, course_id, status, telegram_id, clicked_support_button_at')
        .eq('activation_token', token)
        .maybeSingle();
      if (act) {
        if (act.status !== 'activated') {
          await supabase.from('support_activations').update({
            status: 'activated',
            activated_at: new Date().toISOString(),
            clicked_support_button_at: (act as any).clicked_support_button_at ?? new Date().toISOString(),
          }).eq('id', act.id);
          await supabase.from('support_activation_events').insert({
            support_activation_id: act.id,
            user_id: act.user_id,
            course_id: act.course_id,
            event_type: 'auto_activated_in_support_chat',
            payload_json: { detected_in_chat: chat_id, chat_type: msg?.chat?.type ?? null },
          });
        } else {
          await supabase.from('support_activation_events').insert({
            support_activation_id: act.id,
            user_id: act.user_id,
            course_id: act.course_id,
            event_type: 'reactivated_in_support_chat',
            payload_json: { detected_in_chat: chat_id, chat_type: msg?.chat?.type ?? null },
          });
        }


        const targetChat = (act as any).telegram_id;
        if (targetChat) {
          const [{ data: course }, { data: cu }] = await Promise.all([
            supabase.from('courses').select('title, telegram_bot_activated_message, telegram_bot_activation_buttons, telegram_channel_link, redirect_url, support_link, slug').eq('id', act.course_id).maybeSingle(),
            supabase.from('chat_users').select('name, first_name').eq('id', act.user_id).maybeSingle(),
          ]);
          const displayName = (cu as any)?.first_name || (cu as any)?.name || 'دوست عزیز';
          const courseTitle = (course as any)?.title || 'دوره';
          const defaultTpl = [
            'درود بر شما {{name}} 🌱',
            'پشتیبانی اختصاصی شما با موفقیت فعال شد ✅',
            '',
            'دسترسی به دوره «{{course_title}}» از دکمه‌های زیر برای شما فعال است.',
            '',
            'با آرزوی موفقیت',
            'تیم پشتیبانی آکادمی رفیعی',
          ].join('\n');
          const tpl = ((course as any)?.telegram_bot_activated_message as string | null) || defaultTpl;
          const welcome = tpl
            .replace(/\{\{name\}\}/g, escapeHtml(displayName))
            .replace(/\{\{course_title\}\}/g, escapeHtml(courseTitle));

          const buttons: { text: string; url: string }[][] = [];
          const slug = (course as any)?.slug;
          const accessUrl = (course as any)?.redirect_url || (slug ? `https://academy.rafiei.co/access?course=${slug}` : null);
          if (accessUrl) buttons.push([{ text: '🚀 شروع و دسترسی به دوره', url: accessUrl }]);
          const channel = (course as any)?.telegram_channel_link;
          if (channel) buttons.push([{ text: '📢 کانال دوره', url: channel }]);
          const support = (course as any)?.support_link;
          if (support) buttons.push([{ text: '💬 ارتباط با پشتیبان', url: support }]);
          const customButtons = Array.isArray((course as any)?.telegram_bot_activation_buttons)
            ? ((course as any).telegram_bot_activation_buttons as any[])
            : [];
          for (const b of customButtons) {
            if (b?.text && b?.url) buttons.push([{ text: String(b.text), url: String(b.url) }]);
          }

          // Send welcome DM to the user's private chat with bot (if known)
          if (targetChat) {
            try {
              await tgCall('sendMessage', {
                chat_id: targetChat,
                text: welcome,
                parse_mode: 'HTML',
                reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined,
              });
            } catch (e) { console.warn('activated welcome DM failed', e); }
          }

          // Reply in the chat where the activation message was sent (business/support group)
          if (business_connection_id || (msg?.chat?.type && msg.chat.type !== 'private')) {
            try {
              await tgCall('sendMessage', {
                chat_id,
                text: welcome,
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id,
                reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined,
                ...(business_connection_id ? { business_connection_id } : {}),
              });
            } catch (e) { console.warn('activated welcome reply failed', e); }
          }
        }

        return;
      }
    }
  }






  // ===== Contact share (from "Share my phone" button after login deep-link) =====
  if (msg?.contact?.phone_number) {
    const rawPhone = String(msg.contact.phone_number).replace(/\s|-/g, '');
    const normalized = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
    const countryCode = normalized.startsWith('+98') ? '+98'
      : normalized.startsWith('+1') ? '+1'
      : normalized.startsWith('+44') ? '+44'
      : normalized.startsWith('+49') ? '+49'
      : `+${normalized.slice(1, 3)}`;
    // Attach to the most recent unverified login token for this chat
    const { data: tokRow } = await supabase
      .from('telegram_login_tokens')
      .select('token, expires_at')
      .eq('telegram_chat_id', chat_id)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tokRow && new Date(tokRow.expires_at) > new Date()) {
      await supabase.from('telegram_login_tokens').update({
        pending_phone: normalized,
        pending_country_code: countryCode,
        phone_verified: true,
        updated_at: new Date().toISOString(),
      }).eq('token', tokRow.token);
      await tgCall('sendMessage', {
        chat_id,
        text: '✅ Phone shared. You can finish on the website now.',
        reply_markup: { remove_keyboard: true },
      });
    } else {
      await tgCall('sendMessage', {
        chat_id,
        text: 'Thanks! No active login session found, please retry from the website.',
        reply_markup: { remove_keyboard: true },
      });
    }
    return;
  }

  // Unlinked user flow
  if (!user) {
    const session = await getSession(chat_id);
    if (text === '/cancel' || startMatch) {
      await clearSession(chat_id);
      // Save pending enrollment so it survives login/signup
      if (startPayload?.startsWith('enroll_')) {
        const enrollment_id = startPayload.slice('enroll_'.length);
        await setSession(chat_id, null, null, { pending_enroll: enrollment_id });
        await sendMessage(chat_id,
          `🎓 برای فعال‌سازی پیگیری دوره، ابتدا با شماره موبایلی که با آن ثبت‌نام کرده‌اید وارد شوید.`,
          { keyboard: [[{ text: '🔐 ورود با شماره موبایل', callback_data: 'login:start' }]] });
        return;
      }
      const kbd = await buildStartKeyboard(null);
      await sendMessage(chat_id, await renderWelcome(chat_id, null), { keyboard: kbd });
      return;
    }
    if (session?.state === 'awaiting_phone' && text) { await handlePhoneInput(chat_id, text); return; }
    if (session?.state === 'awaiting_otp' && text) { await handleOtpInput(chat_id, text); return; }
    if (session?.state === 'awaiting_signup_otp' && text) { await handleSignupOtpInput(chat_id, text); return; }
    if (session?.state === 'awaiting_signup_first_name' && text) { await handleSignupFirstName(chat_id, text); return; }
    if (session?.state === 'awaiting_signup_last_name' && text) { await handleSignupLastName(chat_id, text); return; }
    if (session?.state === 'awaiting_signup_email' && text) { await handleSignupEmail(chat_id, text); return; }
    if (session?.state === 'awaiting_form_field') { await handleFormMessage(chat_id, null, msg, session); return; }
    if (session?.state === 'ai_chat') { await handleAiChat(chat_id, null, msg, session); return; }
    if (session?.state === 'sales_chat') { await handleSalesChat(chat_id, msg, session); return; }
    const kbd = await buildStartKeyboard(null);
    await sendMessage(chat_id, 'برای ورود /start را بزنید.', { keyboard: kbd });
    return;
  }

  if (startMatch) {
    await clearSession(chat_id);
    if (startPayload?.startsWith('enroll_')) {
      const enrollment_id = startPayload.slice('enroll_'.length);
      await tryLinkEnrollment(chat_id, enrollment_id, user);
      return;
    }
    const kbd = await buildStartKeyboard(user);
    await sendMessage(chat_id, await renderWelcome(chat_id, user), { keyboard: kbd });
    return;
  }

  if (text === '/cancel') {
    await sendMessage(chat_id, '✅ لغو شد.', { keyboard: await mainMenu(user) });
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
  if (session?.state === 'ai_chat') {
    await handleAiChat(chat_id, user, msg, session);
    return;
  }
  if (session?.state === 'sales_chat') {
    await handleSalesChat(chat_id, msg, session);
    return;
  }

  if (session?.state === 'awaiting_followup_time' && text) {
    await handleFollowupTimeInput(chat_id, text, user);
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
      { keyboard: await mainMenu(user) });
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
      { keyboard: await mainMenu(user) });
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
