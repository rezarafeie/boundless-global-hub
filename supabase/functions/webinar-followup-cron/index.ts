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

    for (const fu of ((followups as any[]) ?? [])) {
      const webinar = webinarById[fu.webinar_id];
      if (!webinar) continue;
      const cacheKey = `${fu.webinar_id}:${fu.audience}`;
      if (!recCache[cacheKey]) recCache[cacheKey] = await collectRecipients(fu.webinar_id, fu.audience);
      const recipients = recCache[cacheKey];
      if (!recipients.length) continue;

      const users = await fetchUsersByPhones(recipients.map((r: any) => r.phone));

      const { data: sentRows } = await supabase
        .from("webinar_followup_recipients")
        .select("phone, sent_count")
        .eq("followup_id", fu.id);
      const sentMap: Record<string, number> = {};
      for (const s of ((sentRows as any[]) ?? [])) sentMap[s.phone] = s.sent_count ?? 0;

      const maxRepeats = fu.max_repeats ?? 1;
      const firstDelay = fu.delay_minutes ?? 60;
      const repeatDelay = fu.repeat_delay_minutes ?? 1440;

      let sent = 0;
      let skipped = 0;
      for (const rec of recipients) {
        const count = sentMap[rec.phone] ?? 0;
        if (count >= maxRepeats) { skipped++; continue; }
        const anchor = anchorTime(fu, webinar, rec);
        if (!anchor) { skipped++; continue; }
        const elapsed = minutesSince(anchor);
        const required = firstDelay + count * repeatDelay;
        if (elapsed < required) { skipped++; continue; }

        try {
          const { ok } = await runWebinarFollowup(fu, webinar, rec, users[rec.phone] ?? null);
          if (ok) {
            await bumpWebinarRecipient(fu, rec, count);
            sent++;
          }
        } catch (e) {
          console.error("webinar followup error", fu.id, rec.phone, e);
        }
      }
      summary.push({ followup_id: fu.id, name: fu.name, webinar: webinar.title, recipients: recipients.length, sent, skipped });
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
