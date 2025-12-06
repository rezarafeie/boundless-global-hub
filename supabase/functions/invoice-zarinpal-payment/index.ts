import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZARINPAL_MERCHANT_ID = Deno.env.get("ZARINPAL_MERCHANT_ID") || "";
const SUPABASE_URL = "https://ihhetvwuhqohbfgkqoxw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, amount, description, callback_url } = await req.json();

    if (!invoice_id || !amount || !callback_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert Toman to Rial for Zarinpal (multiply by 10)
    const amountInRial = amount * 10;
    
    // Create payment request with Zarinpal
    const zarinpalResponse = await fetch("https://api.zarinpal.com/pg/v4/payment/request.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT_ID,
        amount: amountInRial,
        description: description || `پرداخت فاکتور`,
        callback_url: callback_url,
        metadata: { invoice_id }
      })
    });

    const zarinpalData = await zarinpalResponse.json();

    if (zarinpalData.data?.code === 100) {
      const authority = zarinpalData.data.authority;
      
      // Store authority in payment_records
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      await supabase.from('payment_records').insert({
        invoice_id,
        amount,
        payment_method: 'zarinpal',
        notes: `Authority: ${authority}`
      });

      return new Response(
        JSON.stringify({
          success: true,
          payment_url: `https://www.zarinpal.com/pg/StartPay/${authority}`,
          authority
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("Zarinpal error:", zarinpalData);
      return new Response(
        JSON.stringify({ error: "خطا در اتصال به درگاه پرداخت", details: zarinpalData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});