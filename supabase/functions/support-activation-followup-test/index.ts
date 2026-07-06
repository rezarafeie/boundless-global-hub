// Send a TEST followup for a specific support_activation + stage. Returns debug info.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import {
  SUPPORT_ACTIVATION_SELECT,
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
    const { activation_id, stage } = await req.json();
    if (!activation_id || ![1, 2, 3].includes(Number(stage))) {
      return new Response(JSON.stringify({ ok: false, error: "activation_id and stage (1|2|3) required" }), {
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
    if (Number(stage) === 1) result = await runStage1(row as any, { isTest: true });
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
