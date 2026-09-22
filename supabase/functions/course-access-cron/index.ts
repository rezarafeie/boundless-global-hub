import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { notifyStudent, humanRemaining, startWindowsForNewEnrollments, HOUR, DAY } from "../_shared/gamification.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Hourly: mission deadline reminders, access expiry warnings and locking.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const now = Date.now();
  const result = { windowsStarted: 0, missionReminders: 0, expiryWarnings: 0, expired: 0 };

  try {
    // 0. start the free-access window (+ welcome message) for students who enrolled but never opened the course
    try {
      result.windowsStarted = await startWindowsForNewEnrollments(50);
    } catch (e) {
      console.error("startWindowsForNewEnrollments failed", e);
    }

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
      const { data: window } = await supabase
        .from("course_access_windows")
        .select("status")
        .eq("user_id", m.user_id)
        .eq("course_id", m.course_id)
        .maybeSingle();
      if (window?.status !== "active") continue;
      const { data: lesson } = await supabase
        .from("course_lessons").select("title").eq("id", m.lesson_id).maybeSingle();
      const delivery = await notifyStudent(m.user_id, m.course_id, "mission_due", m.id, {
        lesson_title: lesson?.title ?? "",
        remaining: humanRemaining(new Date(m.due_at).getTime() - now),
      });
      if ((delivery.channels?.length ?? 0) > 0) {
        await supabase.from("course_missions").update({ reminder_sent_at: new Date().toISOString() }).eq("id", m.id);
        result.missionReminders++;
      } else {
        console.error("mission reminder had no successful delivery", { missionId: m.id, userId: m.user_id, errors: delivery.errors });
      }
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
      const delivery = await notifyStudent(w.user_id, w.course_id, "access_expiring", w.id, {
        remaining: humanRemaining(new Date(w.expires_at).getTime() - now),
      });
      if ((delivery.channels?.length ?? 0) > 0) result.expiryWarnings++;
      else console.error("expiry warning had no successful delivery", { windowId: w.id, userId: w.user_id, errors: delivery.errors });
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
      const delivery = await notifyStudent(w.user_id, w.course_id, "access_expired", w.id, {});
      if ((delivery.channels?.length ?? 0) === 0) {
        console.error("expiry notice had no successful delivery", { windowId: w.id, userId: w.user_id, errors: delivery.errors });
      }
      result.expired++;
    }

    return json({ success: true, ...result });
  } catch (e) {
    return json({ success: false, error: String((e as Error).message ?? e), ...result }, 500);
  }
});
