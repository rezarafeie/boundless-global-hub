import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import { snapppay, tomanToRial, normalizeMobile, generateTransactionId } from "../_shared/snapppay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const DEFAULT_MAX_TOMAN = 50_000_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      courseSlug,
      testSlug,
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      customAmount,
      enrollmentType,
      checkOnly, // eligibility probe from the checkout UI
    } = await req.json();

    // ---- gateway availability (admin settings) -------------------------
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("snapppay_enabled, snapppay_max_amount_toman")
      .eq("id", 1)
      .maybeSingle();

    const maxToman = Number((settings as any)?.snapppay_max_amount_toman || DEFAULT_MAX_TOMAN);
    if ((settings as any)?.snapppay_enabled !== true) {
      return json({ success: false, eligible: false, error: "درگاه اسنپ‌پی در حال حاضر فعال نیست" }, 400);
    }

    // ---- authoritative price from the database -------------------------
    let dbPrice = 0;
    let itemTitle = "";
    let itemSlug = "";
    let itemId = "";
    let isTest = enrollmentType === "test" && !!testSlug;

    if (isTest) {
      const { data: test, error } = await supabase
        .from("tests").select("*").eq("slug", testSlug).eq("is_active", true).single();
      if (error || !test) return json({ success: false, error: "Test not found" }, 404);
      dbPrice = Number(test.price || 0);
      itemTitle = test.title; itemSlug = testSlug; itemId = String(test.id);
    } else {
      const { data: course, error } = await supabase
        .from("courses").select("*").eq("slug", courseSlug).eq("is_active", true).single();
      if (error || !course) return json({ success: false, error: "Course not found" }, 404);
      if ((course as any).snapppay_enabled === false) {
        return json({ success: false, eligible: false, error: "پرداخت اقساطی برای این دوره فعال نیست" }, 400);
      }
      dbPrice = Number((course as any).price || 0);
      itemTitle = course.title; itemSlug = courseSlug; itemId = String(course.id);
    }

    // The client may only *lower* the price (discount/sale codes computed in UI);
    // it can never raise it, and it can never define the base price.
    const requested = Number(customAmount);
    const paymentAmount = Number.isFinite(requested) && requested > 0 && requested <= dbPrice
      ? Math.round(requested)
      : Math.round(dbPrice);

    if (paymentAmount <= 0) {
      return json({ success: false, eligible: false, error: "مبلغ نامعتبر است" }, 400);
    }
    if (paymentAmount > maxToman) {
      return json({
        success: false,
        eligible: false,
        error: `پرداخت اقساطی اسنپ‌پی برای مبالغ بالای ${maxToman.toLocaleString("fa-IR")} تومان امکان‌پذیر نیست`,
      }, 400);
    }

    const amountRial = tomanToRial(paymentAmount);
    const mobile = normalizeMobile(phone, countryCode);

    if (checkOnly) {
      const el = await snapppay.eligibility(amountRial);
      const eligible = el.ok && (el.body?.response?.eligible !== false);
      return json({ success: true, eligible, amount: paymentAmount });
    }

    if (!mobile) {
      return json({ success: false, error: "برای پرداخت اقساطی، شماره موبایل ایرانی معتبر لازم است" }, 400);
    }

    // ---- eligibility check before creating anything --------------------
    const eligibility = await snapppay.eligibility(amountRial);
    if (!eligibility.ok) {
      console.error("SnappPay eligibility failed", eligibility.body);
      return json({ success: false, error: "پرداخت اقساطی برای این مبلغ در دسترس نیست", details: eligibility.body }, 400);
    }

    // ---- create the local order (enrollment) ---------------------------
    let enrollment: any;
    if (isTest) {
      const { data, error } = await supabase.from("test_enrollments").insert({
        test_id: itemId, user_id: null,
        full_name: `${firstName} ${lastName}`, email, phone,
        payment_amount: paymentAmount,
        payment_status: "pending", enrollment_status: "pending",
      }).select().single();
      if (error) { console.error(error); return json({ success: false, error: "Failed to create test enrollment" }, 500); }
      enrollment = data;
    } else {
      const { data, error } = await supabase.from("enrollments").insert({
        course_id: itemId,
        full_name: `${firstName} ${lastName}`, email, phone,
        country_code: countryCode || "+98",
        payment_amount: paymentAmount,
        payment_method: "snapppay",
        payment_status: "pending",
      }).select().single();
      if (error) { console.error(error); return json({ success: false, error: "Failed to create course enrollment" }, 500); }
      enrollment = data;
    }

    const transactionId = generateTransactionId(String(enrollment.id));

    // ---- payment record (audit trail) ----------------------------------
    const { data: payment, error: paymentError } = await supabase
      .from("snapppay_payments")
      .insert({
        order_id: enrollment.id,
        enrollment_type: isTest ? "test" : "course",
        course_id: isTest ? null : itemId,
        provider: "snapppay",
        amount: paymentAmount,
        amount_rial: amountRial,
        currency: "IRR",
        status: "created",
        provider_transaction_id: transactionId,
        mobile,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("SnappPay payment record failed", paymentError);
      return json({ success: false, error: "خطا در ثبت تراکنش" }, 500);
    }

    const returnURL = isTest
      ? `https://academy.rafiei.co/enroll/success?test=${itemSlug}&phone=${encodeURIComponent(phone || "")}&enrollment=${enrollment.id}&gateway=snapppay&payment=${payment.id}`
      : `https://academy.rafiei.co/enroll/success?course=${itemSlug}&email=${encodeURIComponent(email || "")}&enrollment=${enrollment.id}&gateway=snapppay&payment=${payment.id}`;

    const created = await snapppay.create({
      amountRial,
      returnURL,
      transactionId,
      mobile,
      // SnappPay declares cartId as an integer; Academy enrollment ids are UUIDs.
      cartId: Date.now(),
      items: [{
        name: itemTitle,
        count: 1,
        amount: amountRial,
        id: 1,
        category: isTest ? "آزمون" : "دوره آموزشی",
        commissionType: 1,
      }],
      discountAmount: 0,
    });

    const paymentToken = created.body?.response?.paymentToken;
    const paymentPageUrl = created.body?.response?.paymentPageUrl;

    if (!created.ok || !paymentToken || !paymentPageUrl) {
      console.error("SnappPay create failed", created.body);
      await supabase.from("snapppay_payments").update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_message: JSON.stringify(created.body).slice(0, 1000),
      }).eq("id", payment.id);
      return json({ success: false, error: "خطا در ایجاد پرداخت اقساطی اسنپ‌پی" }, 400);
    }

    await supabase.from("snapppay_payments").update({
      status: "redirected",
      provider_payment_token: paymentToken,
      payment_page_url: paymentPageUrl,
      redirected_at: new Date().toISOString(),
    }).eq("id", payment.id);

    return json({
      success: true,
      paymentUrl: paymentPageUrl,
      enrollmentId: enrollment.id,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("SnappPay request error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
