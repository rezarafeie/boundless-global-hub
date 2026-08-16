// Webinar followup cron — runs every ~5 minutes.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import {
  adaptiveDue,
  anchorTime,
  bumpWebinarRecipient,
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
      const maxRepeats = fu.max_repeats ?? 1;
      const firstDelay = fu.delay_minutes ?? 60;
      const repeatDelay = fu.repeat_delay_minutes ?? 1440;

      let sent = 0;
      let skipped = 0;
      for (const rec of recipients) {
        const count = sentMap[rec.phone] ?? 0;
        if (count >= maxRepeats) { skipped++; continue; }

        if (isAdaptive) {
          // remaining followups of this adaptive sequence for this recipient
          const remaining = (adaptiveGroups[cacheKey] ?? []).filter((f) =>
            (sentByFollowup[f.id]?.[rec.phone] ?? 0) < (f.max_repeats ?? 1)
          );
          const { due } = adaptiveDue(fu, remaining, webinar, rec);
          if (!due) { skipped++; continue; }
        } else {
          const anchor = anchorTime(fu, webinar, rec);
          if (!anchor) { skipped++; continue; }
          const elapsed = minutesSince(anchor);
          const required = firstDelay + count * repeatDelay;
          if (elapsed < required) { skipped++; continue; }
        }

        try {
          const { ok } = await runWebinarFollowup(fu, webinar, rec, users[rec.phone] ?? null);
          if (ok) {
            await bumpWebinarRecipient(fu, rec, count);
            sentMap[rec.phone] = count + 1;
            sent++;
          }
        } catch (e) {
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
