import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { buildStatus, ensureAccessWindow, resolveGamificationUserId } from "../_shared/gamification.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { userId, email, courseId, courseSlug, enrollmentId } = await req.json();
    const uid = await resolveGamificationUserId(userId, email);
    if (!uid) return json({ success: false, error: "حساب دانشجو یافت نشد" }, 404);

    let cid = courseId as string | undefined;
    if (!cid && courseSlug) {
      const { data } = await supabase.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
      cid = data?.id;
    }
    // no course given: pick the user's most urgent active access window (global banner)
    // Completed courses are intentionally excluded so countdowns disappear site-wide.
    if (!cid) {
      const { data: w } = await supabase
        .from("course_access_windows")
        .select("course_id, expires_at, status")
        .eq("user_id", uid)
        .eq("status", "active")
        .order("expires_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!w) return json({ success: true, enabled: false });
      const status = await buildStatus(uid, w.course_id);
      return json({ success: true, ...status });
    }

    await ensureAccessWindow(uid, cid, enrollmentId ?? null);
    const status = await buildStatus(uid, cid);
    return json({ success: true, ...status });
  } catch (e) {
    return json({ success: false, error: String((e as Error).message ?? e) }, 500);
  }
});
