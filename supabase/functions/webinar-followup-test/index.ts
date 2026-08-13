// Send a TEST webinar followup to a specific phone (or the first matching recipient). Returns debug info.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import {
  collectRecipients,
  fetchUsersByPhones,
  normalizePhone,
  runWebinarFollowup,
} from "../_shared/webinar-followup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { followup_id, phone } = await req.json();
    if (!followup_id) throw new Error("followup_id required");

    const { data: fu, error: fuErr } = await supabase
      .from("webinar_followups")
      .select("*")
      .eq("id", followup_id)
      .maybeSingle();
    if (fuErr) throw fuErr;
    if (!fu) throw new Error("followup not found");

    const { data: webinar } = await supabase
      .from("webinar_entries")
      .select("*")
      .eq("id", (fu as any).webinar_id)
      .maybeSingle();
    if (!webinar) throw new Error("webinar not found");

    let rec: any = null;
    if (phone) {
      const p = normalizePhone(phone);
      const all = await collectRecipients((fu as any).webinar_id, "all");
      rec = all.find((r) => r.phone === p) ?? { phone: p, registered_at: new Date().toISOString(), attended_at: null };
    } else {
      const list = await collectRecipients((fu as any).webinar_id, (fu as any).audience);
      rec = list[0];
      if (!rec) throw new Error("no recipient found for this audience — pass a phone number");
    }

    const users = await fetchUsersByPhones([rec.phone]);
    const result = await runWebinarFollowup(fu as any, webinar, rec, users[rec.phone] ?? null, { isTest: true });

    return new Response(JSON.stringify({ ok: true, recipient: rec, user: users[rec.phone] ?? null, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webinar-followup-test error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
