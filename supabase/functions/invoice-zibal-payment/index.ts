import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { zibalFetch, zibalStartUrl, getZibalMerchant } from "../_shared/zibal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ihhetvwuhqohbfgkqoxw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { invoice_id, amount, description, callback_url } = await req.json();

    if (!invoice_id || !amount || !callback_url) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const amountInRial = amount * 10;
    const merchant = getZibalMerchant();

    const zibalResponse = await zibalFetch("/v1/request", {
      method: "POST",
      body: JSON.stringify({
        merchant,
        amount: amountInRial,
        description: description || `پرداخت فاکتور`,
        callbackUrl: callback_url,
        orderId: String(invoice_id),
      }),
    });

    const zibalData = await zibalResponse.json();

    if (zibalData.result === 100 && zibalData.trackId) {
      const trackId = String(zibalData.trackId);
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('payment_records').insert({
        invoice_id, amount,
        payment_method: 'zibal',
        notes: `TrackId: ${trackId}`,
      });

      return new Response(JSON.stringify({
        success: true,
        payment_url: zibalStartUrl(trackId),
        trackId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      console.error("Zibal error:", zibalData);
      return new Response(JSON.stringify({ error: "خطا در اتصال به درگاه پرداخت", details: zibalData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error: any) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
