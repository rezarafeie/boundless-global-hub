// Enqueue + send Telegram notifications.
// Two modes:
//  - POST with { type, ...data }  -> enqueue and immediately send
//  - GET (cron)                   -> process pending queue (retry failures)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage, escapeHtml, formatTehran } from '../_shared/telegram.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function getSettings() {
  const { data } = await supabase
    .from('admin_settings')
    .select('telegram_notify_lead_assigned, telegram_notify_consultation, telegram_notify_daily_summary')
    .eq('id', 1)
    .maybeSingle();
  return data ?? {
    telegram_notify_lead_assigned: true,
    telegram_notify_consultation: true,
    telegram_notify_daily_summary: true,
  };
}

// Build the message for a given notification type
async function buildMessage(type: string, data: any): Promise<{ chat_ids: number[]; text: string; keyboard?: any[][] } | null> {
  const settings = await getSettings();

  if (type === 'lead_assigned') {
    if (!settings.telegram_notify_lead_assigned) return null;
    const { agent_user_id, enrollment_id } = data;
    const { data: agent } = await supabase
      .from('chat_users')
      .select('telegram_chat_id, name')
      .eq('id', agent_user_id)
      .maybeSingle();
    if (!agent?.telegram_chat_id) return null;

    const { data: enr } = await supabase
      .from('enrollments')
      .select('full_name, phone, payment_amount, courses(title)')
      .eq('id', enrollment_id)
      .maybeSingle();
    if (!enr) return null;

    const text = [
      `🎯 <b>لید جدید به شما اختصاص یافت</b>`,
      ``,
      `👤 <b>${escapeHtml(enr.full_name)}</b>`,
      `📞 ${escapeHtml(enr.phone)}`,
      `📚 ${escapeHtml((enr as any).courses?.title ?? '-')}`,
      `💰 ${enr.payment_amount?.toLocaleString('fa-IR') ?? '-'} تومان`,
    ].join('\n');

    return {
      chat_ids: [Number(agent.telegram_chat_id)],
      text,
      keyboard: [[
        { text: '👁 مشاهده', callback_data: `lead:view:${enrollment_id}` },
        { text: '✏️ تغییر وضعیت', callback_data: `lead:status:${enrollment_id}` },
      ]],
    };
  }

  if (type === 'consultation_booking') {
    if (!settings.telegram_notify_consultation) return null;
    const { booking_id } = data;
    const { data: booking } = await supabase
      .from('consultation_bookings')
      .select('full_name, phone, consultation_type, description, created_at')
      .eq('id', booking_id)
      .maybeSingle();
    if (!booking) return null;

    // Notify all admins & sales managers with linked telegram
    const { data: recipients } = await supabase
      .from('chat_users')
      .select('telegram_chat_id, role, is_messenger_admin')
      .not('telegram_chat_id', 'is', null)
      .or('is_messenger_admin.eq.true,role.eq.admin,role.eq.sales_manager');

    const ids = (recipients ?? []).map(r => Number(r.telegram_chat_id)).filter(Boolean);
    if (!ids.length) return null;

    const text = [
      `📅 <b>رزرو مشاوره جدید</b>`,
      ``,
      `👤 ${escapeHtml(booking.full_name)}`,
      `📞 ${escapeHtml(booking.phone)}`,
      `🏷 ${escapeHtml(booking.consultation_type ?? 'عمومی')}`,
      booking.description ? `📝 ${escapeHtml(booking.description.slice(0, 200))}` : '',
      `🕐 ${formatTehran(booking.created_at)}`,
    ].filter(Boolean).join('\n');

    return { chat_ids: ids, text };
  }

  if (type === 'daily_summary') {
    if (!settings.telegram_notify_daily_summary) return null;
    const { agent_user_id } = data;
    const { data: agent } = await supabase
      .from('chat_users')
      .select('telegram_chat_id, name')
      .eq('id', agent_user_id)
      .maybeSingle();
    if (!agent?.telegram_chat_id) return null;

    // Count today's assignments and CRM notes for this agent
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const iso = startOfDay.toISOString();

    const { data: sa } = await supabase.from('sales_agents').select('id').eq('user_id', agent_user_id).maybeSingle();
    if (!sa) return null;

    const { count: newLeads } = await supabase
      .from('lead_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('sales_agent_id', sa.id)
      .gte('assigned_at', iso);

    const { count: notesCount } = await supabase
      .from('crm_notes')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', String(agent_user_id))
      .gte('created_at', iso);

    const text = [
      `📊 <b>خلاصه روزانه شما</b>`,
      `سلام ${escapeHtml(agent.name ?? '')}!`,
      ``,
      `🎯 لیدهای جدید امروز: <b>${newLeads ?? 0}</b>`,
      `📝 یادداشت‌های ثبت‌شده: <b>${notesCount ?? 0}</b>`,
      ``,
      `موفق باشید 🌟`,
    ].join('\n');

    return { chat_ids: [Number(agent.telegram_chat_id)], text };
  }

  return null;
}

async function enqueueAndSend(type: string, data: any) {
  const msg = await buildMessage(type, data);
  if (!msg) return { skipped: true };

  for (const chat_id of msg.chat_ids) {
    const payload = { text: msg.text, keyboard: msg.keyboard };
    const { data: row } = await supabase
      .from('telegram_notification_queue')
      .insert({ chat_id, payload, notification_type: type, status: 'pending' })
      .select('id')
      .single();

    try {
      const res = await sendMessage(chat_id, msg.text, { keyboard: msg.keyboard });
      if (res?.ok) {
        await supabase.from('telegram_notification_queue').update({
          status: 'sent', sent_at: new Date().toISOString(), attempts: 1,
        }).eq('id', row?.id);
      } else {
        await supabase.from('telegram_notification_queue').update({
          status: 'failed', attempts: 1, last_error: JSON.stringify(res),
        }).eq('id', row?.id);
      }
    } catch (e) {
      await supabase.from('telegram_notification_queue').update({
        status: 'failed', attempts: 1, last_error: String(e),
      }).eq('id', row?.id);
    }
  }
  return { sent: msg.chat_ids.length };
}

async function processQueue() {
  const { data: rows } = await supabase
    .from('telegram_notification_queue')
    .select('*')
    .eq('status', 'failed')
    .lt('attempts', 3)
    .limit(20);

  let processed = 0;
  for (const row of rows ?? []) {
    try {
      const res = await sendMessage(Number(row.chat_id), row.payload.text, { keyboard: row.payload.keyboard });
      if (res?.ok) {
        await supabase.from('telegram_notification_queue').update({
          status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1,
        }).eq('id', row.id);
        processed++;
      } else {
        await supabase.from('telegram_notification_queue').update({
          attempts: row.attempts + 1, last_error: JSON.stringify(res),
        }).eq('id', row.id);
      }
    } catch (e) {
      await supabase.from('telegram_notification_queue').update({
        attempts: row.attempts + 1, last_error: String(e),
      }).eq('id', row.id);
    }
  }
  return { processed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (req.method === 'GET') {
      const result = await processQueue();
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { type, ...data } = body;
    if (!type) {
      return new Response(JSON.stringify({ error: 'type required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const result = await enqueueAndSend(type, data);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('telegram-notify error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
