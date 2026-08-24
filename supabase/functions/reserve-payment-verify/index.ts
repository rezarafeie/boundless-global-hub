import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { zarinpalFetch } from "../_shared/zarinpal.ts";
import { zibalFetch, getZibalMerchant } from "../_shared/zibal.ts";
import { rafieipayFetch } from "../_shared/rafieipay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZARINPAL_MERCHANT_ID = Deno.env.get("ZARINPAL_MERCHANT_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://ihhetvwuhqohbfgkqoxw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reservationId, authority, trackId, transactionId } = await req.json();
    if (!reservationId) return json({ success: false, error: "شناسه رزرو الزامی است" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: reservation, error } = await supabase
      .from("consultation_reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle();

    if (error || !reservation) return json({ success: false, error: "رزرو یافت نشد" }, 404);

    if (reservation.payment_status === "completed") {
      return json({ success: true, alreadyVerified: true, reservation });
    }

    const gateway = reservation.payment_method;
    const amount = Math.round(Number(reservation.amount || 0));
    let paid = false;
    let refId = "";

    if (gateway === "zarinpal") {
      const auth = authority || reservation.gateway_authority;
      if (!auth) return json({ success: false, error: "کد پیگیری یافت نشد" }, 400);
      const res = await zarinpalFetch("/pg/v4/payment/verify.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id: ZARINPAL_MERCHANT_ID, amount: amount * 10, authority: auth }),
      });
      const data = await res.json();
      if (data.data?.code === 100 || data.data?.code === 101) {
        paid = true;
        refId = String(data.data.ref_id || "");
      } else {
        console.error("Zarinpal verify failed:", data);
      }
    } else if (gateway === "zibal") {
      const tid = trackId || reservation.gateway_authority;
      if (!tid) return json({ success: false, error: "کد پیگیری یافت نشد" }, 400);
      const res = await zibalFetch("/v1/verify", {
        method: "POST",
        body: JSON.stringify({ merchant: getZibalMerchant(), trackId: Number(tid) }),
      });
      const data = await res.json();
      if (data.result === 100 || data.result === 201) {
        paid = true;
        refId = data.refNumber ? String(data.refNumber) : String(tid);
      } else {
        console.error("Zibal verify failed:", data);
      }
    } else if (gateway === "rafieipay") {
      const body: Record<string, string> = {};
      if (trackId) body.track_id = String(trackId);
      else if (transactionId) body.transaction_id = String(transactionId);
      else if (reservation.gateway_authority) body.transaction_id = String(reservation.gateway_authority);
      else return json({ success: false, error: "کد پیگیری یافت نشد" }, 400);

      const result = await rafieipayFetch("/functions/v1/payments-verify", body);
      const r = result.body || {};
      const tx = r?.transaction || {};
      paid = r?.success === true && (tx.status === "verified" || r?.already_verified === true);
      refId = String(tx.ref_id || r?.ref_id || tx.id || "");
      if (!paid) console.error("Rafiei Pay verify failed:", r);
    } else {
      return json({ success: false, error: "درگاه نامعتبر" }, 400);
    }

    const { data: updated } = await supabase
      .from("consultation_reservations")
      .update({
        payment_status: paid ? "completed" : "failed",
        gateway_ref_id: refId || null,
      })
      .eq("id", reservationId)
      .select()
      .single();

    return json({ success: paid, reservation: updated, refId });
  } catch (error) {
    console.error("Reservation verify error:", error);
    return json({ success: false, error: String((error as any)?.message || error) }, 500);
  }
});
