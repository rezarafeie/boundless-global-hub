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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, webhookUrl } = await req.json();
    
    console.log('Processing consultation webhook for booking:', bookingId);
    
    if (!bookingId || !webhookUrl) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing bookingId or webhookUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking details with slot info
    const { data: booking, error: bookingError } = await supabase
      .from('consultation_bookings')
      .select(`
        *,
        action_token,
        slot:consultation_slots(date, start_time, end_time)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user details from chat_users
    const { data: userData } = await supabase
      .from('chat_users')
      .select('*')
      .eq('id', booking.user_id)
      .single();

    // Generate action links
    const actionToken = booking.action_token;
    const approveLink = `${supabaseUrl}/functions/v1/consultation-action?token=${actionToken}&action=approve`;
    const rejectLink = `${supabaseUrl}/functions/v1/consultation-action?token=${actionToken}&action=reject`;

    // Prepare webhook payload with all consultation and user data
    const webhookPayload = {
      // Booking info
      booking_id: booking.id,
      status: booking.status,
      confirmation_note: booking.confirmation_note || null,
      consultation_link: booking.consultation_link || null,
      description: booking.description || null,
      confirmed_at: booking.confirmed_at,
      created_at: booking.created_at,
      
      // Slot info
      date: booking.slot?.date || null,
      shamsi_date: formatShamsiDate(booking.slot?.date),
      start_time: booking.slot?.start_time?.slice(0, 5) || null,
      end_time: booking.slot?.end_time?.slice(0, 5) || null,
      
      // User info from booking
      full_name: booking.full_name,
      phone: booking.phone,
      email: booking.email || null,
      
      // Extended user info from chat_users
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
      specialized_program: userData?.specialized_program || null,
      bio: userData?.bio || null,
      avatar_url: userData?.avatar_url || null,
      is_approved: userData?.is_approved || false,
      bedoun_marz: userData?.bedoun_marz || false,
      
      // Action links for direct approve/reject
      approve_link: approveLink,
      reject_link: rejectLink,
    };

    console.log('Sending webhook to:', webhookUrl);
    console.log('Payload:', JSON.stringify(webhookPayload));

    // Send webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseText = await webhookResponse.text();
    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response:', responseText);

    if (!webhookResponse.ok) {
      console.error('Webhook failed with status:', webhookResponse.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook failed',
          status: webhookResponse.status,
          response: responseText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully',
        webhookStatus: webhookResponse.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in consultation-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
