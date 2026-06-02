// Telegram Bot webhook — receives updates from Telegram and routes to role-based handlers.
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

const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';

// ============ User resolution ============
type Role = 'admin' | 'sales_manager' | 'sales_agent' | 'student' | null;
interface BotUser {
  id: number;
  name: string;
  role: Role;
  telegram_chat_id: number;
}

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
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await supabase.from('telegram_bot_sessions').upsert({
    chat_id, user_id, state, context, expires_at, updated_at: new Date().toISOString(),
  });
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
      [{ text: '🎯 تخصیص لید', callback_data: 'menu:assign' }, { text: '📊 گزارش‌ها', callback_data: 'menu:reports' }],
      [{ text: '⚙️ مدیریت سیستم', callback_data: 'menu:admin' }],
    ];
  }
  if (role === 'sales_manager') {
    return [
      [{ text: '📋 لیدهای من', callback_data: 'menu:my_leads' }],
      [{ text: '👥 همه لیدها', callback_data: 'menu:all_leads' }],
      [{ text: '🎯 تخصیص لید', callback_data: 'menu:assign' }, { text: '📊 عملکرد تیم', callback_data: 'menu:reports' }],
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

// ============ Lead listing ============
async function getAgentLeads(agent_user_id: number, page = 0, statusFilter?: string) {
  const { data: sa } = await supabase.from('sales_agents').select('id').eq('user_id', agent_user_id).maybeSingle();
  if (!sa) return { items: [], total: 0 };

  let query = supabase
    .from('lead_assignments')
    .select('enrollment_id, assigned_at, enrollments!inner(id, full_name, phone, payment_amount, courses(title))', { count: 'exact' })
    .eq('sales_agent_id', sa.id)
    .order('assigned_at', { ascending: false })
    .range(page * 5, page * 5 + 4);

  const { data, count } = await query;
  return { items: data ?? [], total: count ?? 0 };
}

async function getAllLeads(page = 0) {
  const { data, count } = await supabase
    .from('enrollments')
    .select('id, full_name, phone, payment_amount, courses(title)', { count: 'exact' })
    .in('payment_status', ['success', 'completed'])
    .order('created_at', { ascending: false })
    .range(page * 5, page * 5 + 4);
  return { items: data ?? [], total: count ?? 0 };
}

async function renderLeadsList(chat_id: number, message_id: number | null, user: BotUser, scope: 'my' | 'all', page = 0) {
  const { items, total } = scope === 'my' ? await getAgentLeads(user.id, page) : await getAllLeads(page);

  if (items.length === 0) {
    const text = '📭 لیدی یافت نشد.';
    if (message_id) await editMessage(chat_id, message_id, text, [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]]);
    else await sendMessage(chat_id, text, { keyboard: [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]] });
    return;
  }

  const lines = [`📋 <b>${scope === 'my' ? 'لیدهای من' : 'همه لیدها'}</b>`, `صفحه ${page + 1} از ${Math.ceil(total / 5)} (${total} مورد)`, ''];
  const keyboard: InlineKeyboard = [];

  for (const it of items) {
    const e: any = scope === 'my' ? (it as any).enrollments : it;
    if (!e) continue;
    const courseTitle = e.courses?.title ?? '-';
    lines.push(`• <b>${escapeHtml(e.full_name)}</b> — ${escapeHtml(courseTitle)}`);
    keyboard.push([{ text: `👁 ${e.full_name}`, callback_data: `lead:view:${e.id}` }]);
  }

  const nav: any[] = [];
  if (page > 0) nav.push({ text: '⬅️ قبلی', callback_data: `leads:${scope}:${page - 1}` });
  if ((page + 1) * 5 < total) nav.push({ text: 'بعدی ➡️', callback_data: `leads:${scope}:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);

  const text = lines.join('\n');
  if (message_id) await editMessage(chat_id, message_id, text, keyboard);
  else await sendMessage(chat_id, text, { keyboard });
}

// ============ Lead detail ============
async function renderLeadDetail(chat_id: number, message_id: number | null, user: BotUser, enrollment_id: string) {
  const { data: enr } = await supabase
    .from('enrollments')
    .select('id, full_name, phone, payment_amount, created_at, courses(title)')
    .eq('id', enrollment_id)
    .maybeSingle();

  if (!enr) {
    await sendMessage(chat_id, '❌ لید یافت نشد.');
    return;
  }

  // Access check for sales agents
  if (user.role === 'sales_agent') {
    const { data: ok } = await supabase.rpc('check_sales_agent_lead_access', {
      p_agent_user_id: user.id, p_enrollment_id: enrollment_id,
    });
    if (!ok) {
      const text = '🚫 شما به این لید دسترسی ندارید.';
      if (message_id) await editMessage(chat_id, message_id, text, [[{ text: '🏠 منوی اصلی', callback_data: 'menu:home' }]]);
      else await sendMessage(chat_id, text);
      return;
    }
  }

  // Fetch chat_user_id then latest note + status
  const { data: chatUser } = await supabase.from('chat_users').select('id').eq('phone', enr.phone).maybeSingle();
  let latestNote: any = null;
  let currentStatus = '-';
  if (chatUser?.id) {
    const { data: notes } = await supabase
      .from('crm_notes').select('content, status, created_at')
      .eq('user_id', chatUser.id).order('created_at', { ascending: false }).limit(1);
    if (notes && notes[0]) {
      latestNote = notes[0];
      currentStatus = notes[0].status ?? '-';
    }
  }

  const text = [
    `👤 <b>${escapeHtml(enr.full_name)}</b>`,
    `📞 <code>${escapeHtml(enr.phone)}</code>`,
    `📚 ${escapeHtml((enr as any).courses?.title ?? '-')}`,
    `💰 ${enr.payment_amount?.toLocaleString('fa-IR') ?? '-'} تومان`,
    `📅 ${formatTehran(enr.created_at)}`,
    ``,
    `<b>وضعیت فعلی:</b> ${escapeHtml(currentStatus)}`,
    latestNote ? `<b>آخرین یادداشت:</b>\n${escapeHtml(latestNote.content?.slice(0, 200) ?? '')}` : '',
  ].filter(Boolean).join('\n');

  const keyboard: InlineKeyboard = [
    [{ text: '✏️ تغییر وضعیت', callback_data: `status:pick:${enrollment_id}` }],
    [{ text: '📝 افزودن یادداشت', callback_data: `note:add:${enrollment_id}` }],
    [{ text: '📞 تماس', url: `tel:${enr.phone}` }],
  ];

  if (user.role === 'admin' || user.role === 'sales_manager') {
    keyboard.push([{ text: '👤 تخصیص به کارشناس', callback_data: `assign:pick:${enrollment_id}` }]);
  }
  keyboard.push([{ text: '⬅️ بازگشت', callback_data: `leads:my:0` }, { text: '🏠 منوی اصلی', callback_data: 'menu:home' }]);

  if (message_id) await editMessage(chat_id, message_id, text, keyboard);
  else await sendMessage(chat_id, text, { keyboard });
}

// ============ Status picker ============
async function renderStatusPicker(chat_id: number, message_id: number, enrollment_id: string) {
  const { data: statuses } = await supabase
    .from('crm_statuses').select('id, label').eq('is_active', true).order('order_index');

  const keyboard: InlineKeyboard = (statuses ?? []).map(s => [{
    text: s.label, callback_data: `status:set:${enrollment_id}:${s.id.slice(0, 8)}`,
  }]);
  // Store full status map in session to recover from short callback
  keyboard.push([{ text: '⬅️ انصراف', callback_data: `lead:view:${enrollment_id}` }]);
  await editMessage(chat_id, message_id, '✏️ <b>وضعیت جدید را انتخاب کنید:</b>', keyboard);
}

async function setLeadStatus(user: BotUser, enrollment_id: string, statusPrefix: string): Promise<string> {
  const { data: statuses } = await supabase
    .from('crm_statuses').select('id, label').eq('is_active', true);
  const status = (statuses ?? []).find(s => s.id.startsWith(statusPrefix));
  if (!status) return 'وضعیت یافت نشد';

  const { data: enr } = await supabase.from('enrollments').select('phone, course_id').eq('id', enrollment_id).maybeSingle();
  if (!enr) return 'لید یافت نشد';
  const { data: chatUser } = await supabase.from('chat_users').select('id').eq('phone', enr.phone).maybeSingle();
  if (!chatUser) return 'کاربر یافت نشد';

  await supabase.from('crm_notes').insert({
    user_id: chatUser.id,
    type: 'status_change',
    content: `تغییر وضعیت از طریق تلگرام`,
    status: status.label,
    course_id: enr.course_id,
    created_by: String(user.id),
  });

  return `✅ وضعیت به «${status.label}» تغییر یافت.`;
}

// ============ Agent picker (assign) ============
async function renderAgentPicker(chat_id: number, message_id: number, enrollment_id: string) {
  const { data: agents } = await supabase
    .from('sales_agents')
    .select('user_id, chat_users!inner(id, name)')
    .eq('is_active', true)
    .limit(20);

  const keyboard: InlineKeyboard = (agents ?? []).map((a: any) => [{
    text: a.chat_users.name, callback_data: `assign:do:${enrollment_id}:${a.user_id}`,
  }]);
  keyboard.push([{ text: '⬅️ انصراف', callback_data: `lead:view:${enrollment_id}` }]);
  await editMessage(chat_id, message_id, '👤 <b>کارشناس را انتخاب کنید:</b>', keyboard);
}

async function assignLead(assignerId: number, enrollment_id: string, agent_user_id: number): Promise<string> {
  const { data, error } = await supabase.rpc('distribute_lead_to_agent', {
    p_enrollment_id: enrollment_id,
    p_agent_user_id: agent_user_id,
    p_assigned_by: assignerId,
  });
  if (error || !data) return '❌ تخصیص ناموفق بود';

  // Trigger notification to the new agent
  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ type: 'lead_assigned', agent_user_id, enrollment_id }),
    });
  } catch (e) {
    console.error('notify failed:', e);
  }

  return '✅ لید با موفقیت تخصیص یافت.';
}

// ============ Reports ============
async function renderReports(chat_id: number, message_id: number | null, user: BotUser) {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  let text: string;
  if (user.role === 'sales_agent') {
    const { data: sa } = await supabase.from('sales_agents').select('id').eq('user_id', user.id).maybeSingle();
    const { count: todayLeads } = await supabase
      .from('lead_assignments').select('id', { count: 'exact', head: true })
      .eq('sales_agent_id', sa?.id ?? 0).gte('assigned_at', iso);
    const { count: notesCount } = await supabase
      .from('crm_notes').select('id', { count: 'exact', head: true })
      .eq('created_by', String(user.id)).gte('created_at', iso);

    text = [
      `📊 <b>عملکرد امروز شما</b>`,
      ``,
      `🎯 لیدهای جدید: <b>${todayLeads ?? 0}</b>`,
      `📝 یادداشت‌ها: <b>${notesCount ?? 0}</b>`,
    ].join('\n');
  } else {
    const { count: totalLeads } = await supabase
      .from('enrollments').select('id', { count: 'exact', head: true })
      .in('payment_status', ['success', 'completed']).gte('created_at', iso);
    const { count: totalAgents } = await supabase
      .from('sales_agents').select('id', { count: 'exact', head: true }).eq('is_active', true);
    const { count: pendingConsultations } = await supabase
      .from('consultation_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending');

    text = [
      `📊 <b>گزارش کلی امروز</b>`,
      ``,
      `🎯 لیدهای جدید امروز: <b>${totalLeads ?? 0}</b>`,
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
  // Callback queries
  if (update.callback_query) {
    const cq = update.callback_query;
    const chat_id = cq.message.chat.id;
    const message_id = cq.message.message_id;
    const data: string = cq.data;
    await answerCallback(cq.id);

    const user = await resolveUser(chat_id);
    if (!user) {
      await sendMessage(chat_id, '🚫 حساب شما لینک نشده. لطفاً با مدیر تماس بگیرید.');
      return;
    }

    const [action, ...rest] = data.split(':');

    if (action === 'menu') {
      const sub = rest[0];
      if (sub === 'home') {
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
      } else if (sub === 'assign') {
        await editMessage(chat_id, message_id, '🎯 ابتدا لید مورد نظر را از «همه لیدها» باز کنید و سپس «تخصیص به کارشناس» را بزنید.', [[{ text: '👥 همه لیدها', callback_data: 'menu:all_leads' }], [{ text: '🏠', callback_data: 'menu:home' }]]);
      } else if (sub === 'admin') {
        await editMessage(chat_id, message_id, '⚙️ پنل ادمین در نسخه‌های بعدی اضافه می‌شود.', [[{ text: '🏠', callback_data: 'menu:home' }]]);
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

    if (action === 'status') {
      if (rest[0] === 'pick') {
        await renderStatusPicker(chat_id, message_id, rest[1]);
      } else if (rest[0] === 'set') {
        const msg = await setLeadStatus(user, rest[1], rest[2]);
        await editMessage(chat_id, message_id, msg, [[{ text: '⬅️ بازگشت به لید', callback_data: `lead:view:${rest[1]}` }]]);
      }
      return;
    }

    if (action === 'note' && rest[0] === 'add') {
      await setSession(chat_id, user.id, 'awaiting_note', { enrollment_id: rest[1] });
      await editMessage(chat_id, message_id, '📝 لطفاً متن یادداشت را ارسال کنید:\n\n/cancel برای انصراف', [[{ text: '⬅️ انصراف', callback_data: `lead:view:${rest[1]}` }]]);
      return;
    }

    if (action === 'assign') {
      if (rest[0] === 'pick') {
        if (user.role === 'sales_agent') return;
        await renderAgentPicker(chat_id, message_id, rest[1]);
      } else if (rest[0] === 'do') {
        if (user.role === 'sales_agent') return;
        const msg = await assignLead(user.id, rest[1], parseInt(rest[2]));
        await editMessage(chat_id, message_id, msg, [[{ text: '⬅️ بازگشت به لید', callback_data: `lead:view:${rest[1]}` }]]);
      }
      return;
    }
  }

  // Messages
  const msg = update.message ?? update.edited_message;
  if (!msg?.chat?.id) return;
  const chat_id = msg.chat.id;
  const text: string = msg.text ?? '';

  // Special: /myid works for anyone (so admins can grab telegram IDs)
  if (text === '/myid') {
    await sendMessage(chat_id, `🆔 Chat ID شما: <code>${chat_id}</code>\nاین عدد را به مدیر بدهید تا حسابتان را لینک کند.`);
    return;
  }

  const user = await resolveUser(chat_id);
  if (!user) {
    await sendMessage(chat_id, [
      `🚫 <b>حساب شما لینک نشده است.</b>`,
      ``,
      `Chat ID شما: <code>${chat_id}</code>`,
      ``,
      `این عدد را به مدیر سیستم بدهید تا حساب کاربری شما را لینک کند.`,
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
    await sendMessage(chat_id, [
      `<b>دستورات:</b>`,
      `/start — منوی اصلی`,
      `/cancel — لغو عملیات جاری`,
      `/myid — دریافت Chat ID`,
      `/help — این راهنما`,
    ].join('\n'));
    return;
  }

  // Stateful inputs
  const session = await getSession(chat_id);
  if (session?.state === 'awaiting_note' && text) {
    const enrollment_id = session.context.enrollment_id;
    const { data: enr } = await supabase.from('enrollments').select('phone, course_id').eq('id', enrollment_id).maybeSingle();
    if (enr) {
      const { data: chatUser } = await supabase.from('chat_users').select('id').eq('phone', enr.phone).maybeSingle();
      if (chatUser) {
        await supabase.from('crm_notes').insert({
          user_id: chatUser.id,
          type: 'note',
          content: text,
          course_id: enr.course_id,
          created_by: String(user.id),
        });
        await clearSession(chat_id);
        await sendMessage(chat_id, '✅ یادداشت ثبت شد.', { keyboard: [[{ text: '⬅️ بازگشت به لید', callback_data: `lead:view:${enrollment_id}` }]] });
        return;
      }
    }
    await clearSession(chat_id);
    await sendMessage(chat_id, '❌ خطا در ثبت یادداشت.');
    return;
  }

  // Default
  await sendMessage(chat_id, 'برای مشاهده منو دستور /start را ارسال کنید.');
}

// ============ HTTP entry ============
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Telegram sends X-Telegram-Bot-Api-Secret-Token header
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
