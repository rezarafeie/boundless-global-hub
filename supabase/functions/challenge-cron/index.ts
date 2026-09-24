import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import {
  loadStructure, syncParticipant, emitEvent, applyPenalties, recalcParticipant, processRewards,
  currentDayNumber, humanRemaining, tehranDate, participantStats, processExpiredMissions, HOUR,
} from "../_shared/challenge.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DEFAULT_FOLLOWUPS = [{ hours_before: 6 }, { hours_before: 2 }, { hours_before: 0.5 }];
const SITE = "https://academy.rafiei.co";

// One hourly cron for every challenge: start/finish lifecycle, unlock days,
// sync submissions, reminders, missed missions, penalties and inactivity.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const now = Date.now();
  const result = { challenges: 0, participants: 0, reminders: 0, missed: 0, finished: 0, started: 0 };
  try {
    const today = tehranDate(now);
    // lifecycle: scheduled → active
    await supabase.from("challenges").update({ status: "scheduled" }).eq("status", "published").gt("start_date", today);
    await supabase.from("challenges").update({ status: "active" }).eq("status", "published").lte("start_date", today);
    const { data: toStart } = await supabase.from("challenges").select("id").eq("status", "scheduled").lte("start_date", today);
    for (const c of toStart ?? []) { await supabase.from("challenges").update({ status: "active" }).eq("id", c.id); result.started++; }

    const { data: challenges } = await supabase.from("challenges").select("*").eq("status", "active");
    for (const ch of challenges ?? []) {
      result.challenges++;
      const structure = await loadStructure(ch.id);
      const dayById = new Map(structure.days.map((d: any) => [d.id, d]));
      const endMs = Date.parse(`${ch.start_date}T00:00:00+03:30`) + Number(ch.days_count) * 24 * HOUR;
      const followupsBase = Array.isArray(ch.notification_settings?.followups) ? ch.notification_settings.followups : DEFAULT_FOLLOWUPS;
      const inactiveHours = Number(ch.notification_settings?.inactive_hours ?? 48);

      const { data: parts } = await supabase.from("challenge_participants").select("*").eq("challenge_id", ch.id).eq("status", "active").limit(5000);
      for (const p of parts ?? []) {
        result.participants++;
        try {
          await syncParticipant(ch, p, structure);
          result.missed += await processExpiredMissions(ch, p, structure, now);
          const { data: open } = await supabase.from("challenge_progress").select("*").eq("participant_id", p.id)
            .in("status", ["available", "started", "needs_revision"]);
          for (const r of open ?? []) {
            const day: any = dayById.get(r.day_id);
            const deadline = r.deadline_at ? Date.parse(r.deadline_at) : null;
            if (!deadline) continue;
            if (now > deadline) continue;
            const followups = Array.isArray(day?.followups) ? day.followups : followupsBase;
            for (const f of followups) {
              const h = Number(f.hours_before);
              if (!Number.isFinite(h)) continue;
              if (now >= deadline - h * HOUR && now < deadline) {
                const sent = await emitEvent(ch, p, f.kind ?? "deadline_approaching", `prog:${r.id}:${h}`, {
                  day: r.day_number, mission_title: day?.title, remaining_time: humanRemaining(deadline - now),
                  deadline: new Date(deadline).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }),
                }, `${SITE}/challenges/${ch.slug}?day=${r.day_number}`);
                if (!(sent as any).skipped) result.reminders++;
                break; // only the most urgent due reminder per run
              }
            }
          }
          // inactivity
          if (inactiveHours > 0 && now - Date.parse(p.last_activity_at) > inactiveHours * HOUR) {
            const bucket = Math.floor(now / (inactiveHours * HOUR));
            await emitEvent(ch, p, "inactive", `inactive:${bucket}`, {});
          }
          await processRewards(ch, p);
        } catch (e) {
          console.error("challenge participant failed", p.id, e);
        }
      }

      // lifecycle: active → finished
      if (now >= endMs + 24 * HOUR) {
        await supabase.from("challenges").update({ status: "finished" }).eq("id", ch.id);
        result.finished++;
        for (const p of parts ?? []) {
          const st = await participantStats(p);
          await emitEvent(ch, p, "challenge_completed", "completed", { xp: p.xp, progress: Math.round((st.completed / Math.max(1, ch.days_count)) * 100) });
        }
      }
      void currentDayNumber;
    }
    return json({ success: true, ...result });
  } catch (e) {
    console.error("challenge-cron error", e);
    return json({ success: false, error: String((e as Error).message ?? e), ...result }, 500);
  }
});
