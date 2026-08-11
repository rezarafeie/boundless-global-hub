// Sends consultation approve/reject messages to the user's private Telegram chat
// through the Telegram Business connection (falls back to the bot chat).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { tgCall, escapeHtml } from '../_shared/telegram.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const persianWeekDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

function formatShamsiDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const [, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${persianWeekDays[date.getDay()]} ${jd} ${persianMonths[jm - 1]}`;
}

const DEFAULT_APPROVE = `✅ <b>مشاوره شما تایید شد</b>

سلام {full_name} عزیز،
جلسه مشاوره شما در تاریخ {shamsi_date} ساعت {start_time} تایید شد.

🔗 لینک جلسه: {consultation_link}`;

const DEFAULT_REJECT = `❌ <b>مشاوره شما لغو شد</b>

سلام {full_name} عزیز،
متاسفانه جلسه مشاوره شما در تاریخ {shamsi_date} ساعت {start_time} لغو شد.`;

function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => vars[k] ?? '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { booking_id, action, test_chat_id, test_text } = body ?? {};

    if (!['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'action must be approve or reject' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: settings } = await supabase
      .from('consultation_settings')
      .select('telegram_notify_enabled, telegram_approve_message, telegram_reject_message')
      .eq('id', 1)
      .maybeSingle();

    if (!test_chat_id && (settings as any)?.telegram_notify_enabled === false) {
      return new Response(JSON.stringify({ skipped: true, reason: 'telegram notifications disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let chatId: number | null = test_chat_id ? Number(test_chat_id) : null;
    let text = test_text as string | undefined;

    if (!text || !chatId) {
      if (!booking_id) {
        return new Response(JSON.stringify({ error: 'booking_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: booking } = await supabase
        .from('consultation_bookings')
        .select('*, slot:consultation_slots(date, start_time, end_time)')
        .eq('id', booking_id)
        .maybeSingle();

      if (!booking) {
        return new Response(JSON.stringify({ error: 'booking not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!chatId) {
        const { data: user } = await supabase
          .from('chat_users')
          .select('telegram_chat_id')
          .eq('id', booking.user_id)
          .maybeSingle();
        chatId = (user as any)?.telegram_chat_id ? Number((user as any).telegram_chat_id) : null;
      }

      if (!chatId) {
        return new Response(JSON.stringify({ skipped: true, reason: 'user has no linked telegram account' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tpl = action === 'approve'
        ? ((settings as any)?.telegram_approve_message || DEFAULT_APPROVE)
        : ((settings as any)?.telegram_reject_message || DEFAULT_REJECT);

      text = render(tpl, {
        full_name: escapeHtml(booking.full_name),
        phone: escapeHtml(booking.phone),
        date: (booking as any).slot?.date ?? '',
        shamsi_date: formatShamsiDate((booking as any).slot?.date),
        start_time: (booking as any).slot?.start_time?.slice(0, 5) ?? '',
        end_time: (booking as any).slot?.end_time?.slice(0, 5) ?? '',
        consultation_link: booking.consultation_link ?? '',
        confirmation_note: escapeHtml(booking.confirmation_note),
        description: escapeHtml(booking.description),
      });
    }

    // Prefer the Telegram Business connection (message appears from our personal account)
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('telegram_business_connection_id')
      .eq('id', 1)
      .maybeSingle();
    const bcid = (adminSettings as any)?.telegram_business_connection_id;

    let res: any = null;
    let viaBusiness = false;
    let businessError: string | null = null;
    if (bcid) {
      const bizRes = await tgCall('sendMessage', { chat_id: chatId, text, business_connection_id: bcid, parse_mode: 'HTML' });
      viaBusiness = bizRes?.ok === true;
      res = bizRes;
      if (!viaBusiness) {
        businessError = bizRes?.description ?? JSON.stringify(bizRes);
        console.error('Business send failed for chat', chatId, businessError);
      }
    } else {
      businessError = 'telegram_business_connection_id is not configured';
      console.error(businessError);
    }
    if (!viaBusiness) {
      res = await tgCall('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });
    }

    return new Response(JSON.stringify({
      ok: res?.ok === true,
      via: viaBusiness ? 'business' : 'bot',
      business_error: businessError,
      business_unreachable: !!businessError && /BUSINESS_PEER_USAGE_MISSING|PEER_ID_INVALID/i.test(businessError),
      chat_id: chatId,
      text,
      response: res,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('consultation-telegram-notify error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
