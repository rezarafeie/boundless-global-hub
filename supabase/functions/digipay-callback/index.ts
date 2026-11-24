import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import { digipay } from "../_shared/digipay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function afterPaidSideEffects(payment: any) {
  if (payment.enrollment_type === "test") return;

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*, courses (*), chat_users:chat_user_id (*)")
    .eq("id", payment.order_id)
    .maybeSingle();

  if (!enrollment) return;

  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-enrollment-webhook`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "enrollment_paid_successful",
        payload: {
          event_type: "enrollment_paid_successful",
          timestamp: new Date().toISOString(),
          data: {
            enrollment,
            user: (enrollment as any).chat_users || {
              name: enrollment.full_name, email: enrollment.email, phone: enrollment.phone,
            },
            course: (enrollment as any).courses,
            payment: {
              amount: enrollment.payment_amount,
              ref_id: payment.provider_reference_id || payment.provider_transaction_id,
              method: "digipay",
            },
          },
        },
      }),
    });
  } catch (e) { console.error("webhook error", e); }

  if ((enrollment as any).courses?.is_spotplayer_enabled) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/create-spotplayer-license`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          userFullName: enrollment.full_name,
          userPhone: enrollment.phone,
          courseId: enrollment.course_id,
        }),
      });
    } catch (e) { console.error("spotplayer error", e); }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }

    const pick = (k: string) => String(body[k] ?? url.searchParams.get(k) ?? "");
    const paymentId = pick("paymentId") || pick("payment");
    const result = pick("result").toUpperCase();
    const trackingCode = pick("trackingCode");
    const type = pick("type").replace(/\D/g, "") || "0";
    const callbackAmount = Number(pick("amount") || 0);

    if (!paymentId) return json({ success: false, error: "تراکنش یافت نشد" }, 404);
    const { data: payment, error } = await supabase
      .from("snapppay_payments").select("*").eq("id", paymentId).eq("provider", "digipay").maybeSingle();
    if (error || !payment) return json({ success: false, error: "تراکنش یافت نشد" }, 404);

    if (payment.status === "paid") {
      return json({ success: true, alreadyPaid: true, refId: payment.provider_reference_id, enrollmentId: payment.order_id });
    }

    await supabase.from("snapppay_payments")
      .update({ callback_payload: { result, trackingCode, type, amount: callbackAmount } })
      .eq("id", payment.id);

    if (result !== "SUCCESS" || !trackingCode) {
      await supabase.from("snapppay_payments").update({
        status: "failed", failed_at: new Date().toISOString(), error_message: `callback_${result || "missing"}`,
      }).eq("id", payment.id);
      return json({ success: false, error: "پرداخت دیجی‌پی لغو یا ناموفق بود" }, 400);
    }
    if (callbackAmount && callbackAmount !== Number(payment.amount_rial)) {
      return json({ success: false, error: "مبلغ پرداختی با سفارش مطابقت ندارد" }, 400);
    }

    await supabase.from("snapppay_payments").update({ status: "verifying" }).eq("id", payment.id);
    const verify = await digipay.verify(trackingCode, String(payment.provider_transaction_id), type);
    await supabase.from("snapppay_payments").update({ verify_response: verify.body }).eq("id", payment.id);

    const verifiedAmount = Number(verify.body?.amount ?? 0);
    const verifiedProvider = String(verify.body?.providerId ?? payment.provider_transaction_id);
    if (!verify.ok || (verifiedAmount && verifiedAmount !== Number(payment.amount_rial))
        || verifiedProvider !== String(payment.provider_transaction_id)) {
      await supabase.from("snapppay_payments").update({
        // keep 9011 (pending at DigiPay) retryable instead of marking failed
        status: Number(verify.body?.result?.status) === 9011 ? "verifying" : "failed",
        failed_at: new Date().toISOString(),
        error_message: "verify_failed",
      }).eq("id", payment.id);
      return json({ success: false, error: "تایید پرداخت دیجی‌پی ناموفق بود" }, 400);
    }

    const referenceId = trackingCode;
    await supabase.from("snapppay_payments").update({ provider_reference_id: referenceId }).eq("id", payment.id);

    // ---- atomic finalization + enrollment activation --------------------
    const { data: finalizeResult, error: finalizeError } = await supabase
      .rpc("finalize_snapppay_payment", { p_payment_id: payment.id });

    if (finalizeError || (finalizeResult as any)?.success !== true) {
      console.error("finalize_snapppay_payment failed", finalizeError, finalizeResult);
      return json({ success: false, error: "خطا در نهایی‌سازی ثبت‌نام. لطفاً با پشتیبانی تماس بگیرید." }, 500);
    }

    if ((finalizeResult as any)?.already_finalized !== true) {
      await afterPaidSideEffects({ ...payment, provider_reference_id: referenceId });
    }

    const { data: fresh } = await supabase
      .from(payment.enrollment_type === "test" ? "test_enrollments" : "enrollments")
      .select(payment.enrollment_type === "test" ? "*, tests (title, slug)" : "*, courses (*)")
      .eq("id", payment.order_id)
      .maybeSingle();

    return json({
      success: true,
      refId: String(referenceId),
      enrollmentId: payment.order_id,
      enrollment: fresh,
      course: (fresh as any)?.courses || (fresh as any)?.tests || null,
    });
  } catch (error) {
    console.error("DigiPay callback error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
