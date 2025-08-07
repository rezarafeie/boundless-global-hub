import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AnalyticsPayload = {
  sessionId: string;
  path: string;
  referrer?: string;
  browser?: string;
  device?: string;
  country?: string;
  screenW?: number;
  screenH?: number;
  source?: string;
  eventType?: string; // default 'pageview'
  userAgent?: string;
  firstSeenAt?: string; // optional client-provided timestamp
  occurredAt?: string;  // event timestamp
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload = (await req.json()) as AnalyticsPayload;

    if (!payload?.sessionId || !payload?.path) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const nowIso = new Date().toISOString();
    const eventType = payload.eventType || "pageview";

    // 1) Ensure session exists (upsert minimal data)
    const sessionUpsert = {
      session_id: payload.sessionId,
      device: payload.device || null,
      user_agent: payload.userAgent || payload.browser || null,
      source: payload.source || null,
      country: payload.country || null,
      first_seen: payload.firstSeenAt || nowIso,
      last_seen: payload.occurredAt || nowIso,
    };

    // Upsert session (on conflict do update last_seen and keep other light fields)
    const { error: upsertErr } = await supabase
      .from("analytics_sessions")
      .upsert(sessionUpsert, { onConflict: "session_id" });

    if (upsertErr) {
      console.log("[track-analytics] upsert session error:", upsertErr.message);
      // Continue; event insert may succeed and trigger will update session too
    }

    // 2) Insert event (trigger will bump last_seen and pageviews for pageviews)
    const { error: insertErr } = await supabase.from("analytics_events").insert({
      session_id: payload.sessionId,
      path: payload.path,
      referrer: payload.referrer || null,
      browser: payload.browser || payload.userAgent || null,
      device: payload.device || null,
      country: payload.country || null,
      screen_w: payload.screenW || null,
      screen_h: payload.screenH || null,
      created_at: payload.occurredAt || nowIso,
      event_type: eventType,
      source: payload.source || null,
    });

    if (insertErr) {
      console.log("[track-analytics] insert event error:", insertErr.message);
      return new Response(JSON.stringify({ ok: false, error: insertErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.log("[track-analytics] unexpected error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
