import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { zarinpalFetch } from "../_shared/zarinpal.ts";
import { zibalFetch, zibalStartUrl, getZibalMerchant } from "../_shared/zibal.ts";
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
    const {
      fullName,
      phone,
      email,
      gateway = "zarinpal",
      source = "landing",
      webinarId = null,
      origin,
    } = await req.json();

    if (!fullName || !String(fullName).trim() || !phone || !String(phone).trim()) {
      return json({ success: false, error: "نام و شماره تماس الزامی است" }, 400);
    }
    if (!["zarinpal", "zibal", "rafieipay"].includes(gateway)) {
      return json({ success: false, error: "درگاه پرداخت نامعتبر است" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Amount always comes from server-side settings (never trust the client).
    const { data: settings } = await supabase
      .from("consultation_reservation_settings")
      .select("price, is_active")
      .eq("id", 1)
      .maybeSingle();

    if (!settings || settings.is_active === false) {
      return json({ success: false, error: "سیستم رزرو در حال حاضر غیرفعال است" }, 400);
    }

    const amount = Math.round(Number(settings.price || 0));
    if (!amount || amount <= 0) {
      return json({ success: false, error: "مبلغ رزرو تنظیم نشده است" }, 400);
    }

    const { data: reservation, error: insertError } = await supabase
      .from("consultation_reservations")
      .insert({
        full_name: String(fullName).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : null,
        amount,
        payment_method: gateway,
        payment_status: "pending",
        source,
        webinar_id: webinarId,
      })
      .select()
      .single();

    if (insertError || !reservation) {
      console.error("Reservation insert failed:", insertError);
      return json({ success: false, error: "خطا در ثبت رزرو" }, 500);
    }

    const base = (origin && String(origin).startsWith("http") ? String(origin) : "https://academy.rafiei.co").replace(/\/$/, "");
    const callbackUrl = `${base}/reserve?rid=${reservation.id}&gateway=${gateway}`;
    const description = `رزرو مشاوره دوره بدون مرز - ${reservation.full_name}`;

    if (gateway === "zarinpal") {
      const res = await zarinpalFetch("/pg/v4/payment/request.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: ZARINPAL_MERCHANT_ID,
          amount: amount * 10, // Toman -> Rial
          description,
          callback_url: callbackUrl,
          metadata: { mobile: reservation.phone, email: reservation.email || undefined },
        }),
      });
      const data = await res.json();
      if (data.data?.code === 100 && data.data?.authority) {
        const authority = data.data.authority;
        await supabase
          .from("consultation_reservations")
          .update({ gateway_authority: authority })
          .eq("id", reservation.id);
        return json({
          success: true,
          reservationId: reservation.id,
          paymentUrl: `https://www.zarinpal.com/pg/StartPay/${authority}`,
        });
      }
      console.error("Zarinpal error:", data);
      return json({ success: false, error: "خطا در اتصال به درگاه زرین‌پال", details: data }, 400);
    }

    if (gateway === "zibal") {
      const res = await zibalFetch("/v1/request", {
        method: "POST",
        body: JSON.stringify({
          merchant: getZibalMerchant(),
          amount: amount * 10,
          description,
          callbackUrl,
          orderId: String(reservation.id),
          mobile: reservation.phone,
        }),
      });
      const data = await res.json();
      if (data.result === 100 && data.trackId) {
        const trackId = String(data.trackId);
        await supabase
          .from("consultation_reservations")
          .update({ gateway_authority: trackId })
          .eq("id", reservation.id);
        return json({ success: true, reservationId: reservation.id, paymentUrl: zibalStartUrl(trackId) });
      }
      console.error("Zibal error:", data);
      return json({ success: false, error: "خطا در اتصال به درگاه زیبال", details: data }, 400);
    }

    // rafieipay
    const result = await rafieipayFetch("/functions/v1/payments-request", {
      amount_toman: amount,
      order_id: String(reservation.id),
      description,
      callback_url: callbackUrl,
      customer: { phone: reservation.phone, email: reservation.email },
    });
    const r = result.body || {};
    const paymentUrl = r?.payment_url || r?.paymentUrl;
    const reference = r?.order_id || r?.token || r?.transaction_id || r?.reference;

    if (paymentUrl) {
      if (reference) {
        await supabase
          .from("consultation_reservations")
          .update({ gateway_authority: String(reference) })
          .eq("id", reservation.id);
      }
      return json({ success: true, reservationId: reservation.id, paymentUrl });
    }

    console.error("Rafiei Pay error:", r);
    return json({ success: false, error: "خطا در اتصال به درگاه رفیعی‌پی", details: r }, 400);
  } catch (error) {
    console.error("Reservation payment request error:", error);
    return json({ success: false, error: String((error as any)?.message || error) }, 500);
  }
});
