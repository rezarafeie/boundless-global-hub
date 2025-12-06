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
    const { invoice_id, authority } = await req.json();

    if (!invoice_id || !authority) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get invoice amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const remainingAmount = Number(invoice.total_amount) - Number(invoice.paid_amount);
    // Convert Toman to Rial for Zarinpal verification (multiply by 10)
    const amountInRial = remainingAmount * 10;

    // Verify payment with Zarinpal
    const verifyResponse = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT_ID,
        amount: amountInRial,
        authority
      })
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.data?.code === 100 || verifyData.data?.code === 101) {
      const refId = verifyData.data.ref_id;

      // Update invoice
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_amount: invoice.total_amount,
          payment_type: 'online'
        })
        .eq('id', invoice_id);

      // Update payment record
      await supabase
        .from('payment_records')
        .update({
          notes: `Authority: ${authority}, RefId: ${refId}`
        })
        .eq('invoice_id', invoice_id)
        .ilike('notes', `%${authority}%`);

      return new Response(
        JSON.stringify({
          success: true,
          ref_id: refId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("Zarinpal verify error:", verifyData);
      return new Response(
        JSON.stringify({ error: "پرداخت تایید نشد", details: verifyData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Verify error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});