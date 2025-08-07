import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsPayload {
  reportDate?: string; // YYYY-MM-DD
  visitors: number;
  pageviews: number;
  viewsPerVisit: number;
  avgSessionDuration: number; // seconds
  bounceRate: number; // percentage (0-100)
  pages?: Array<{ page: string; views: number; percentage?: number }>;
  sources?: Array<{ source: string; visitors: number; percentage?: number }>;
  devices?: Array<{ device: string; visitors: number; percentage?: number }>;
  countries?: Array<{ country: string; visitors: number; percentage?: number }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as AnalyticsPayload;

    if (!body || typeof body.visitors !== "number" || typeof body.pageviews !== "number") {
      return new Response(
        JSON.stringify({ error: "Invalid payload. Required: visitors, pageviews" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reportDate = body.reportDate ?? new Date().toISOString().split("T")[0];

    const payload = {
      report_date: reportDate,
      visitors: Math.max(0, Math.floor(body.visitors)),
      pageviews: Math.max(0, Math.floor(body.pageviews)),
      views_per_visit: Number(body.viewsPerVisit ?? 0),
      avg_session_duration: Math.max(0, Math.floor(body.avgSessionDuration ?? 0)),
      bounce_rate: Number(body.bounceRate ?? 0),
      pages: body.pages ? JSON.parse(JSON.stringify(body.pages)) : null,
      sources: body.sources ? JSON.parse(JSON.stringify(body.sources)) : null,
      devices: body.devices ? JSON.parse(JSON.stringify(body.devices)) : null,
      countries: body.countries ? JSON.parse(JSON.stringify(body.countries)) : null,
      updated_at: new Date().toISOString(),
    };

    console.log("[save-analytics-report] Upserting report:", payload.report_date);

    const { data, error } = await supabase
      .from("analytics_daily_reports")
      .upsert(payload, { onConflict: "report_date" })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[save-analytics-report] Supabase error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, report: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[save-analytics-report] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
