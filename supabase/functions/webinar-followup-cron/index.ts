// Webinar followup cron — runs every ~5 minutes.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import {
  adaptiveDue,
  anchorTime,
  collectRecipients,
  fetchUsersByPhones,
  minutesSince,
  runWebinarFollowup,
} from "../_shared/webinar-followup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { data: followups, error } = await supabase
      .from("webinar_followups")
      .select("*")
      .eq("enabled", true);
    if (error) throw error;

    const summary: any[] = [];
    const webinarIds = Array.from(new Set(((followups as any[]) ?? []).map((f) => f.webinar_id)));
    if (!webinarIds.length) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: webinars } = await supabase.from("webinar_entries").select("*").in("id", webinarIds);
    const webinarById: Record<string, any> = {};
    for (const w of ((webinars as any[]) ?? [])) webinarById[w.id] = w;

    // cache recipients per webinar+audience
    const recCache: Record<string, any[]> = {};

    const allFollowups = ((followups as any[]) ?? []);

    // sent counts for every followup (followup_id -> phone -> count)
    const sentByFollowup: Record<string, Record<string, number>> = {};
    // last send per sequence (webinar:audience -> phone -> timestamp ms)
    const lastSentBySeq: Record<string, Record<string, number>> = {};
    for (const fu of allFollowups) {
      const { data: sentRows } = await supabase
        .from("webinar_followup_recipients")
        .select("phone, sent_count, last_sent_at")
        .eq("followup_id", fu.id);
      const m: Record<string, number> = {};
      const seqKey = `${fu.webinar_id}:${fu.audience}`;
      const seq = (lastSentBySeq[seqKey] ??= {});
      for (const s of ((sentRows as any[]) ?? [])) {
        m[s.phone] = s.sent_count ?? 0;
        if (s.last_sent_at) {
          const ts = new Date(s.last_sent_at).getTime();
          if (!seq[s.phone] || ts > seq[s.phone]) seq[s.phone] = ts;
        }
      }
      sentByFollowup[fu.id] = m;
    }

    // adaptive sequences grouped per webinar+audience, ordered by priority
    const adaptiveGroups: Record<string, any[]> = {};
    for (const fu of allFollowups) {
      if ((fu.schedule_mode ?? "fixed") !== "adaptive") continue;
      const key = `${fu.webinar_id}:${fu.audience}`;
      (adaptiveGroups[key] ??= []).push(fu);
    }
    for (const key of Object.keys(adaptiveGroups)) {
      adaptiveGroups[key].sort((a, b) =>
        ((a.priority ?? 100) - (b.priority ?? 100)) ||
        String(a.created_at).localeCompare(String(b.created_at))
      );
    }

    for (const fu of allFollowups) {
      const webinar = webinarById[fu.webinar_id];
      if (!webinar) continue;
      const cacheKey = `${fu.webinar_id}:${fu.audience}`;
      if (!recCache[cacheKey]) recCache[cacheKey] = await collectRecipients(fu.webinar_id, fu.audience);
      const recipients = recCache[cacheKey];
      if (!recipients.length) continue;

      const users = await fetchUsersByPhones(recipients.map((r: any) => r.phone));
      const sentMap = sentByFollowup[fu.id] ?? {};

      const isAdaptive = (fu.schedule_mode ?? "fixed") === "adaptive";
      // An adaptive sequence consists of distinct followups. max_repeats belongs
      // to fixed schedules; applying it here caused each adaptive item to fire
      // repeatedly on consecutive cron runs.
      const maxRepeats = isAdaptive ? 1 : (fu.max_repeats ?? 1);
      const firstDelay = fu.delay_minutes ?? 60;
      const repeatDelay = fu.repeat_delay_minutes ?? 1440;

      let sent = 0;
      let skipped = 0;
      for (const rec of recipients) {
        const count = sentMap[rec.phone] ?? 0;
        if (count >= maxRepeats) { skipped++; continue; }

        if (isAdaptive) {
          // respect the minimum interval since the last message of this sequence
          const last = lastSentBySeq[cacheKey]?.[rec.phone];
          if (last && (Date.now() - last) / 60000 < (fu.min_interval_minutes ?? 30)) { skipped++; continue; }
          // full adaptive sequence (sent + pending) so slots stay anchored to registration time
          const sequence = adaptiveGroups[cacheKey] ?? [fu];
          const { due, at } = adaptiveDue(fu, sequence, webinar, rec);
          if (!due) { skipped++; continue; }

          // Claim before calling Telegram/email/SMS. This database operation is
          // atomic, so overlapping cron invocations cannot deliver the same item.
          const { data: claimed, error: claimError } = await supabase.rpc(
            "claim_webinar_followup_delivery",
            {
              p_followup_id: fu.id,
              p_webinar_id: fu.webinar_id,
              p_phone: rec.phone,
              p_scheduled_at: at?.toISOString() ?? new Date().toISOString(),
              p_max_deliveries: 1,
            },
          );
          if (claimError) throw claimError;
          if (!claimed) { skipped++; continue; }
        } else {
          const anchor = anchorTime(fu, webinar, rec);
          if (!anchor) { skipped++; continue; }
          const elapsed = minutesSince(anchor);
          const required = firstDelay + count * repeatDelay;
          if (elapsed < required) { skipped++; continue; }
        }

        try {
          const { ok, results } = await runWebinarFollowup(fu, webinar, rec, users[rec.phone] ?? null);
          const unreachable = results.some((result: any) => result?.unreachable === true);
          const terminal = ok || unreachable;

          if (isAdaptive) {
            const { error: finalizeError } = await supabase.rpc(
              "finalize_webinar_followup_delivery",
              {
                p_followup_id: fu.id,
                p_phone: rec.phone,
                p_delivered: terminal,
                p_status: unreachable ? "unreachable" : (ok ? "sent" : "failed"),
                p_error: ok ? null : (results[0]?.reason ?? results[0]?.error ?? "delivery failed"),
              },
            );
            if (finalizeError) throw finalizeError;
          }
          if (terminal) {
            if (!isAdaptive) {
              await supabase.from("webinar_followup_recipients").upsert({
                followup_id: fu.id,
                webinar_id: fu.webinar_id,
                phone: rec.phone,
                sent_count: count + 1,
                last_sent_at: new Date().toISOString(),
                delivery_status: unreachable ? "unreachable" : "sent",
              }, { onConflict: "followup_id,phone" });
            }
            sentMap[rec.phone] = count + 1;
            (lastSentBySeq[cacheKey] ??= {})[rec.phone] = Date.now();
            sent++;
          }
        } catch (e) {
          if (isAdaptive) {
            await supabase.rpc("finalize_webinar_followup_delivery", {
              p_followup_id: fu.id,
              p_phone: rec.phone,
              p_delivered: false,
              p_status: "failed",
              p_error: String(e),
            });
          }
          console.error("webinar followup error", fu.id, rec.phone, e);
        }
      }
      summary.push({ followup_id: fu.id, name: fu.name, mode: fu.schedule_mode ?? "fixed", webinar: webinar.title, recipients: recipients.length, sent, skipped });
    }


    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webinar-followup-cron error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
