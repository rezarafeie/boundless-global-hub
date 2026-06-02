import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { zibalFetch, getZibalMerchant } from "../_shared/zibal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://ihhetvwuhqohbfgkqoxw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { invoice_id, trackId } = await req.json();

    if (!invoice_id || !trackId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices').select('total_amount, paid_amount').eq('id', invoice_id).single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const merchant = getZibalMerchant();
    const verifyResponse = await zibalFetch("/v1/verify", {
      method: "POST",
      body: JSON.stringify({ merchant, trackId: Number(trackId) }),
    });
    const verifyData = await verifyResponse.json();

    if (verifyData.result === 100 || verifyData.result === 201) {
      const refId = verifyData.refNumber ? String(verifyData.refNumber) : String(trackId);

      await supabase.from('invoices').update({
        status: 'paid',
        paid_amount: invoice.total_amount,
        payment_type: 'online',
      }).eq('id', invoice_id);

      await supabase.from('payment_records').update({
        notes: `TrackId: ${trackId}, RefId: ${refId}`,
      }).eq('invoice_id', invoice_id).ilike('notes', `%${trackId}%`);

      return new Response(JSON.stringify({ success: true, ref_id: refId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      console.error("Zibal verify error:", verifyData);
      return new Response(JSON.stringify({ error: "پرداخت تایید نشد", details: verifyData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error: any) {
    console.error("Verify error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
