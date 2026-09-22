import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { zarinpalFetch } from "../_shared/zarinpal.ts";
import { fetchUsdTomanRate } from "../_shared/rafieipay.ts";
import { getGamSettings, extendAccess, notifyStudent } from "../_shared/gamification.ts";

const ZARINPAL_MERCHANT_ID = Deno.env.get("ZARINPAL_MERCHANT_ID") || "";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function priceToman(courseId: string) {
  const s = await getGamSettings(courseId);
  const usd = Number(s?.reactivation_price_usd ?? 10);
  const rate = await fetchUsdTomanRate();
  return { s, usd, toman: Math.max(1000, Math.round(usd * (rate || 0))) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const action = body.action ?? "request";
    const uid = Number(body.userId);
    const courseId = body.courseId as string;
    if (!uid || !courseId) return json({ success: false, error: "userId و courseId الزامی است" }, 400);

    const { data: window } = await supabase
      .from("course_access_windows").select("*")
      .eq("user_id", uid).eq("course_id", courseId).maybeSingle();

    if (action === "price") {
      const p = await priceToman(courseId);
      return json({ success: true, usd: p.usd, toman: p.toman, days: p.s?.reactivation_days ?? 7 });
    }

    if (action === "request") {
      const { s, usd, toman } = await priceToman(courseId);
      if (!s?.enabled) return json({ success: false, error: "این دوره تمدید ندارد" }, 400);

      const base = String(body.origin ?? "https://academy.rafiei.co").replace(/\/$/, "");
      const callbackUrl = `${base}${body.returnPath ?? "/"}?reactivate=1&uid=${uid}&course=${courseId}`;

      const res = await zarinpalFetch("/pg/v4/payment/request.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: ZARINPAL_MERCHANT_ID,
          amount: toman * 10,
          description: `تمدید دسترسی دوره (${usd} دلار)`,
          callback_url: callbackUrl,
        }),
      });
      const data = await res.json();
      if (data.data?.code === 100 && data.data?.authority) {
        await supabase.from("course_access_windows").update({
          source: `reactivation_pending:${data.data.authority}:${toman}`,
        }).eq("id", window?.id ?? "00000000-0000-0000-0000-000000000000");
        return json({
          success: true,
          authority: data.data.authority,
          toman,
          usd,
          paymentUrl: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
        });
      }
      return json({ success: false, error: "خطا در اتصال به درگاه پرداخت", details: data }, 400);
    }

    if (action === "verify") {
      const authority = String(body.authority ?? "");
      if (!authority) return json({ success: false, error: "کد پیگیری یافت نشد" }, 400);
      const stored = String(window?.source ?? "");
      if (!stored.startsWith(`reactivation_pending:${authority}:`)) {
        if (window && window.status === "active" && new Date(window.expires_at).getTime() > Date.now()) {
          return json({ success: true, alreadyVerified: true });
        }
        return json({ success: false, error: "پرداخت معتبر نیست" }, 400);
      }
      const toman = Number(stored.split(":")[2] || 0);

      const res = await zarinpalFetch("/pg/v4/payment/verify.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id: ZARINPAL_MERCHANT_ID, amount: toman * 10, authority }),
      });
      const data = await res.json();
      if (data.data?.code === 100 || data.data?.code === 101) {
        const s = await getGamSettings(courseId);
        await extendAccess(uid, courseId, s?.reactivation_days ?? 7, "reactivation_paid");
        await notifyStudent(uid, courseId, "reactivated", String(data.data.ref_id ?? authority), {
          reactivation_days: s?.reactivation_days ?? 7,
        });
        return json({ success: true, refId: data.data.ref_id });
      }
      return json({ success: false, error: "پرداخت تایید نشد", details: data }, 400);
    }

    return json({ success: false, error: "action نامعتبر" }, 400);
  } catch (e) {
    return json({ success: false, error: String((e as Error).message ?? e) }, 500);
  }
});
