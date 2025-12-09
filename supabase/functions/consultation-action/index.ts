import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Persian date formatting
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

function formatShamsiDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const [jy, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const weekDay = persianWeekDays[date.getDay()];
  const monthName = persianMonths[jm - 1];
  return `${weekDay} ${jd} ${monthName} ماه`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MEETING_LINK = 'https://meet.google.com/nrs-cvbs-ppr';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');
    
    console.log('Processing consultation action:', { token, action });
    
    if (!token || !action) {
      return new Response(
        generateHtmlResponse('خطا', 'پارامترهای نامعتبر', 'error'),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return new Response(
        generateHtmlResponse('خطا', 'عملیات نامعتبر', 'error'),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find booking by action token
    const { data: booking, error: bookingError } = await supabase
      .from('consultation_bookings')
      .select(`
        *,
        slot:consultation_slots(date, start_time, end_time)
      `)
      .eq('action_token', token)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return new Response(
        generateHtmlResponse('خطا', 'رزرو مشاوره یافت نشد', 'error'),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Check if already processed
    if (booking.status === 'confirmed' || booking.status === 'cancelled') {
      return new Response(
        generateHtmlResponse(
          'قبلاً پردازش شده',
          `این رزرو مشاوره قبلاً ${booking.status === 'confirmed' ? 'تایید' : 'لغو'} شده است.`,
          'warning'
        ),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Update booking status
    const newStatus = action === 'approve' ? 'confirmed' : 'cancelled';
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.confirmed_at = new Date().toISOString();
      updateData.consultation_link = DEFAULT_MEETING_LINK;
    }

    const { error: updateError } = await supabase
      .from('consultation_bookings')
      .update(updateData)
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        generateHtmlResponse('خطا', 'خطا در به‌روزرسانی وضعیت', 'error'),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Mark slot as available if rejected
    if (action === 'reject') {
      await supabase
        .from('consultation_slots')
        .update({ is_available: true })
        .eq('id', booking.slot_id);
    }

    // Send webhook notification
    const { data: settings } = await supabase
      .from('consultation_settings')
      .select('webhook_url')
      .eq('id', 1)
      .single();

    if (settings?.webhook_url) {
      try {
        // Fetch user details
        const { data: userData } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', booking.user_id)
          .single();

        const webhookPayload = {
          booking_id: booking.id,
          status: newStatus,
          confirmation_note: booking.confirmation_note || null,
          consultation_link: action === 'approve' ? DEFAULT_MEETING_LINK : null,
          description: booking.description || null,
          confirmed_at: action === 'approve' ? new Date().toISOString() : null,
          created_at: booking.created_at,
          date: booking.slot?.date || null,
          shamsi_date: formatShamsiDate(booking.slot?.date),
          start_time: booking.slot?.start_time?.slice(0, 5) || null,
          end_time: booking.slot?.end_time?.slice(0, 5) || null,
          full_name: booking.full_name,
          phone: booking.phone,
          email: booking.email || null,
          user_id: userData?.id || null,
          user_unique_id: userData?.user_id || null,
          first_name: userData?.first_name || null,
          last_name: userData?.last_name || null,
          user_email: userData?.email || null,
          user_phone: userData?.phone || null,
          country: userData?.country || null,
          country_code: userData?.country_code || null,
          province: userData?.province || null,
          gender: userData?.gender || null,
          age: userData?.age || null,
          education: userData?.education || null,
          job: userData?.job || null,
          action_source: 'link',
        };

        await fetch(settings.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
        
        console.log('Webhook sent for action:', action);
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }
    }

    const message = action === 'approve' 
      ? `مشاوره برای ${booking.full_name} در تاریخ ${booking.slot?.date} ساعت ${booking.slot?.start_time?.slice(0, 5)} با موفقیت تایید شد.`
      : `مشاوره برای ${booking.full_name} در تاریخ ${booking.slot?.date} ساعت ${booking.slot?.start_time?.slice(0, 5)} لغو شد.`;

    return new Response(
      generateHtmlResponse(
        action === 'approve' ? 'تایید شد ✓' : 'لغو شد ✗',
        message,
        action === 'approve' ? 'success' : 'cancelled'
      ),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
    );

  } catch (error) {
    console.error('Error in consultation-action:', error);
    return new Response(
      generateHtmlResponse('خطا', 'خطای سرور', 'error'),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
});

function generateHtmlResponse(title: string, message: string, type: 'success' | 'error' | 'warning' | 'cancelled'): string {
  const colors = {
    success: { bg: '#10B981', icon: '✓' },
    error: { bg: '#EF4444', icon: '✗' },
    warning: { bg: '#F59E0B', icon: '⚠' },
    cancelled: { bg: '#6B7280', icon: '✗' },
  };
  
  const { bg, icon } = colors[type];
  
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - رفیعی آکادمی</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${bg};
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 {
      color: #1a1a2e;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #6B7280;
      font-size: 16px;
      line-height: 1.6;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
      color: #9CA3AF;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">رفیعی آکادمی</div>
  </div>
</body>
</html>
  `;
}
