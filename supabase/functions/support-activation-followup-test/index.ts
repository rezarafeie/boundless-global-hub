// Send a TEST followup for a specific support_activation + stage. Returns debug info.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import {
  SUPPORT_ACTIVATION_SELECT,
  runCustom,
  runStage1,
  runStage2,
  runStage3,
} from "../_shared/support-followup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { activation_id, stage, custom_followup_id } = await req.json();
    if (!activation_id) {
      return new Response(JSON.stringify({ ok: false, error: "activation_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isCustom = stage === "custom" || !!custom_followup_id;
    if (!isCustom && ![1, 2, 3].includes(Number(stage))) {
      return new Response(JSON.stringify({ ok: false, error: "stage must be 1|2|3 or 'custom'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row, error } = await supabase
      .from("support_activations")
      .select(SUPPORT_ACTIVATION_SELECT)
      .eq("id", activation_id)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("activation not found");

    let result: any[] = [];
    if (isCustom) {
      if (!custom_followup_id) throw new Error("custom_followup_id required for custom stage");
      const { data: cf, error: cfErr } = await supabase
        .from("support_activation_custom_followups")
        .select("*")
        .eq("id", custom_followup_id)
        .maybeSingle();
      if (cfErr) throw cfErr;
      if (!cf) throw new Error("custom followup not found");
      result = await runCustom(row as any, cf, { isTest: true });
    } else if (Number(stage) === 1) result = await runStage1(row as any, { isTest: true });
    else if (Number(stage) === 2) result = await runStage2(row as any, { isTest: true });
    else if (Number(stage) === 3) result = await runStage3(row as any, { isTest: true });

    return new Response(JSON.stringify({ ok: true, stage, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("test error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
