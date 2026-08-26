import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import { snapppay } from "../_shared/snapppay.ts";

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
              method: "snapppay",
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

    const paymentId = body.paymentId || url.searchParams.get("payment");
    const state = String(body.state ?? url.searchParams.get("state") ?? "").toUpperCase();
    const enrollmentId = body.enrollmentId || url.searchParams.get("enrollment");

    // Locate the local payment record — the only source of truth.
    let query = supabase.from("snapppay_payments").select("*");
    query = paymentId
      ? query.eq("id", paymentId)
      : query.eq("order_id", enrollmentId).order("created_at", { ascending: false }).limit(1);

    const { data: rows, error } = await query;
    const payment = Array.isArray(rows) ? rows[0] : rows;

    if (error || !payment) {
      return json({ success: false, error: "تراکنش یافت نشد" }, 404);
    }

    // Already finalized -> idempotent success.
    if (payment.status === "paid") {
      return json({ success: true, alreadyPaid: true, refId: payment.provider_reference_id || payment.provider_transaction_id, enrollmentId: payment.order_id });
    }

    await supabase.from("snapppay_payments")
      .update({ callback_payload: { state, query: Object.fromEntries(url.searchParams), body } })
      .eq("id", payment.id);

    // state = OK only means "you may now verify server-side".
    if (state && state !== "OK") {
      await supabase.from("snapppay_payments").update({
        status: state === "CANCELED" || state === "CANCELLED" ? "cancelled" : "failed",
        cancelled_at: state.startsWith("CANCEL") ? new Date().toISOString() : null,
        failed_at: state.startsWith("CANCEL") ? null : new Date().toISOString(),
      }).eq("id", payment.id);
      return json({ success: false, error: "پرداخت توسط کاربر لغو یا ناموفق بود" }, 400);
    }

    const token = payment.provider_payment_token;
    if (!token) return json({ success: false, error: "توکن پرداخت یافت نشد" }, 400);

    // ---- verify --------------------------------------------------------
    await supabase.from("snapppay_payments").update({ status: "verifying" }).eq("id", payment.id);
    const verify = await snapppay.verify(token);
    await supabase.from("snapppay_payments").update({ verify_response: verify.body }).eq("id", payment.id);

    const verifyOk = verify.ok && verify.body?.successful === true;
    if (!verifyOk) {
      // Reconcile with provider status before declaring failure.
      const st = await snapppay.status(token);
      await supabase.from("snapppay_payments").update({ status_response: st.body }).eq("id", payment.id);
      const providerStatus = String(st.body?.response?.status || "").toUpperCase();
      if (providerStatus !== "SETTLE" && providerStatus !== "VERIFY") {
        await supabase.from("snapppay_payments").update({
          status: providerStatus === "REVERT" ? "cancelled" : "failed",
          failed_at: new Date().toISOString(),
          error_message: "verify_failed",
        }).eq("id", payment.id);
        return json({ success: false, error: "تایید پرداخت اسنپ‌پی ناموفق بود" }, 400);
      }
    }

    // ---- settle --------------------------------------------------------
    let settled = false;
    await supabase.from("snapppay_payments").update({ status: "settling" }).eq("id", payment.id);
    const settle = await snapppay.settle(token);
    await supabase.from("snapppay_payments").update({ settle_response: settle.body }).eq("id", payment.id);
    settled = settle.ok && settle.body?.successful === true;

    if (!settled) {
      const st = await snapppay.status(token);
      await supabase.from("snapppay_payments").update({ status_response: st.body }).eq("id", payment.id);
      settled = String(st.body?.response?.status || "").toUpperCase() === "SETTLE";
    }

    if (!settled) {
      await supabase.from("snapppay_payments").update({
        status: "verified",
        error_message: "settle_failed",
      }).eq("id", payment.id);
      return json({ success: false, error: "تسویه پرداخت اسنپ‌پی انجام نشد. لطفاً با پشتیبانی تماس بگیرید." }, 400);
    }

    const referenceId = settle.body?.response?.transactionId
      || verify.body?.response?.transactionId
      || payment.provider_transaction_id;

    await supabase.from("snapppay_payments")
      .update({ provider_reference_id: String(referenceId) })
      .eq("id", payment.id);

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
    console.error("SnappPay callback error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
