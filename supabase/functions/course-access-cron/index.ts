import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { notifyStudent, humanRemaining, startWindowsForNewEnrollments, HOUR, DAY } from "../_shared/gamification.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Hourly: mission deadline reminders, access expiry warnings and locking.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const now = Date.now();
  const result = { missionReminders: 0, expiryWarnings: 0, expired: 0 };

  try {
    // Only courses with the system enabled
    const { data: enabled } = await supabase
      .from("course_gamification_settings").select("course_id").eq("enabled", true);
    const courseIds = (enabled ?? []).map((r: any) => r.course_id);
    if (!courseIds.length) return json({ success: true, ...result });

    // 1. missions due within 6 hours, reminder not sent yet
    const { data: missions } = await supabase
      .from("course_missions")
      .select("*")
      .in("course_id", courseIds)
      .is("completed_at", null)
      .is("reminder_sent_at", null)
      .lte("due_at", new Date(now + 6 * HOUR).toISOString())
      .gte("due_at", new Date(now).toISOString())
      .limit(200);

    for (const m of missions ?? []) {
      const { data: lesson } = await supabase
        .from("course_lessons").select("title").eq("id", m.lesson_id).maybeSingle();
      await notifyStudent(m.user_id, m.course_id, "mission_due", m.id, {
        title: "⏳ ماموریت امروزت در حال اتمام است",
        text: `درس «${lesson?.title ?? ""}» را تا ${humanRemaining(new Date(m.due_at).getTime() - now)} دیگر کامل کن تا استریک‌ات حفظ شود.`,
      });
      await supabase.from("course_missions").update({ reminder_sent_at: new Date().toISOString() }).eq("id", m.id);
      result.missionReminders++;
    }

    // 2. access windows expiring within 24h
    const { data: warn } = await supabase
      .from("course_access_windows")
      .select("*")
      .in("course_id", courseIds)
      .eq("status", "active")
      .lte("expires_at", new Date(now + DAY).toISOString())
      .gte("expires_at", new Date(now).toISOString())
      .limit(200);

    for (const w of warn ?? []) {
      await notifyStudent(w.user_id, w.course_id, "access_expiring", w.id, {
        title: "⏱ دسترسی دوره‌ات رو به پایان است",
        text: `تنها ${humanRemaining(new Date(w.expires_at).getTime() - now)} از دسترسی رایگان تو باقی مانده. همین حالا ادامه بده!`,
      });
      result.expiryWarnings++;
    }

    // 3. lock expired windows
    const { data: gone } = await supabase
      .from("course_access_windows")
      .select("*")
      .in("course_id", courseIds)
      .eq("status", "active")
      .lt("expires_at", new Date(now).toISOString())
      .limit(200);

    for (const w of gone ?? []) {
      await supabase.from("course_access_windows").update({ status: "expired" }).eq("id", w.id);
      await notifyStudent(w.user_id, w.course_id, "access_expired", w.id, {
        title: "🔒 دسترسی دوره بسته شد",
        text: "پیشرفت تو کامل ذخیره شده است. با تمدید دسترسی، دقیقاً از همان‌جا ادامه می‌دهی.",
      });
      result.expired++;
    }

    return json({ success: true, ...result });
  } catch (e) {
    return json({ success: false, error: String((e as Error).message ?? e), ...result }, 500);
  }
});
