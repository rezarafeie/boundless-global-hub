// Support Activation Followup cron — runs every ~5 minutes.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import {
  SUPPORT_ACTIVATION_SELECT,
  bumpCounter,
  bumpCustomCounter,
  fetchCustomFollowups,
  minutesSince,
  runCustom,
  runStage1,
  runStage2,
  runStage3,
} from "../_shared/support-followup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { data: customRows, error: customErr } = await supabase
      .from("support_activation_custom_followups")
      .select("*")
      .eq("enabled", true);
    if (customErr) throw customErr;

    const customByCourse: Record<string, any[]> = {};
    const customCourseIds = Array.from(new Set(((customRows as any[]) ?? []).map((r) => r.course_id).filter(Boolean)));
    for (const cf of ((customRows as any[]) ?? [])) {
      (customByCourse[cf.course_id] ||= []).push(cf);
    }

    const shouldIncludeCustomCourses = customCourseIds.length > 0;
    const { data: rows, error } = await supabase
      .from("support_activations")
      .select(SUPPORT_ACTIVATION_SELECT)
      .or(
        shouldIncludeCustomCourses
          ? `status.neq.activated,course_id.in.(${customCourseIds.join(",")})`
          : "status.neq.activated",
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;


    const summary: any[] = [];
    for (const row of (rows as any[]) ?? []) {
      const course = row.courses;
      if (!course?.support_followup_enabled) continue;
      const maxRepeats = course.support_followup_max_repeats ?? 2;

      let stage: 1 | 2 | 3 | null = null;
      let elapsedMin = 0;
      let firstDelay = 0;
      let repeatDelay = 0;
      let sentCount = 0;
      let stageEnabled = true;

      if (row.status === "not_started" || (!row.opened_bot_at && !row.clicked_support_button_at)) {
        stage = 1;
        elapsedMin = minutesSince(row.created_at);
        firstDelay = course.support_followup_stage1_delay_minutes ?? 60;
        repeatDelay = course.support_followup_stage1_repeat_delay_minutes ?? firstDelay;
        sentCount = row.followup_stage1_sent_count ?? 0;
        stageEnabled = course.support_followup_stage1_enabled !== false;
      } else if (row.opened_bot_at && !row.clicked_support_button_at) {
        stage = 2;
        elapsedMin = minutesSince(row.opened_bot_at);
        firstDelay = course.support_followup_stage2_delay_minutes ?? 60;
        repeatDelay = course.support_followup_stage2_repeat_delay_minutes ?? firstDelay;
        sentCount = row.followup_stage2_sent_count ?? 0;
        stageEnabled = course.support_followup_stage2_enabled !== false;
      } else if (row.clicked_support_button_at && row.status !== "activated") {
        stage = 3;
        elapsedMin = minutesSince(row.clicked_support_button_at);
        firstDelay = course.support_followup_stage3_delay_minutes ?? 180;
        repeatDelay = course.support_followup_stage3_repeat_delay_minutes ?? firstDelay;
        sentCount = row.followup_stage3_sent_count ?? 0;
        stageEnabled = course.support_followup_stage3_enabled !== false;
      }

      // Run stage followup if eligible (do NOT skip custom followups when stage caps out)
      if (row.status !== "activated" && stage && stageEnabled && sentCount < maxRepeats) {
        const required = firstDelay + sentCount * repeatDelay;
        if (elapsedMin >= required) {
          try {
            let result: any[] = [];
            if (stage === 1) result = await runStage1(row);
            else if (stage === 2) result = await runStage2(row);
            else if (stage === 3) result = await runStage3(row);
            await bumpCounter(row, stage);
            summary.push({ id: row.id, stage, result });
          } catch (e) {
            console.error("followup send failed", row.id, e);
            summary.push({ id: row.id, stage, error: String(e) });
          }
        }
      }

      // Custom (time-based) followups — independent of stage
      const customs = customByCourse[row.course_id] ?? [];
      const counts = (row.custom_followup_sent_counts ?? {}) as Record<string, number>;
      const purchaseElapsed = minutesSince(row.created_at);
      for (const cf of customs) {
        if (cf.skip_if_activated && row.status === "activated") continue;
        const sent = counts[cf.id] ?? 0;
        if (sent >= (cf.max_repeats ?? 1)) continue;
        const required = (cf.delay_minutes ?? 0) + sent * (cf.repeat_delay_minutes ?? cf.delay_minutes ?? 0);
        if (purchaseElapsed < required) continue;
        try {
          const result = await runCustom(row, cf);
          const delivered = result.some((item: any) => item?.ok === true);
          if (delivered) await bumpCustomCounter(row, cf);
          summary.push({ id: row.id, custom_followup_id: cf.id, channel: cf.channel, result });
        } catch (e) {
          console.error("custom followup failed", row.id, cf.id, e);
          summary.push({ id: row.id, custom_followup_id: cf.id, error: String(e) });
        }
      }
    }



    return new Response(JSON.stringify({ ok: true, processed: summary.length, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cron error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
