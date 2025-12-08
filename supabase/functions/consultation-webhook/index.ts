import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Prepare webhook payload
    const webhookPayload = {
      name: booking.full_name,
      mobile: booking.phone,
      email: booking.email || null,
      date: booking.slot?.date || null,
      time: booking.slot?.start_time?.slice(0, 5) || null,
      link: booking.consultation_link || null,
      status: booking.status,
      confirmation_note: booking.confirmation_note || null,
      booking_id: booking.id,
      confirmed_at: booking.confirmed_at
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
