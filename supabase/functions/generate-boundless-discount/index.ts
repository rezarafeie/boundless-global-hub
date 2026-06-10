import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOUNDLESS_COURSE_ID = '287b51a8-a93b-4334-91ef-a5d3bf97fc3d';
const PERCENTAGE = 25;
const HOURS_VALID = 2;

function genCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `BMP-${s}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { submissionId } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get course price
    const { data: course } = await supabase
      .from('courses')
      .select('price')
      .eq('id', BOUNDLESS_COURSE_ID)
      .single();
    const price = Number(course?.price || 0);
    const savings = Math.round((price * PERCENTAGE) / 100);

    // If submission already has a code, return it
    if (submissionId) {
      const { data: existing } = await supabase
        .from('discount_codes')
        .select('code, valid_until, percentage')
        .ilike('code', `BMP-%`)
        .eq('course_id', BOUNDLESS_COURSE_ID)
        .order('created_at', { ascending: false })
        .limit(1);
      // Don't reuse, always create fresh per call but stash on submission
      const { data: sub } = await supabase
        .from('boundless_smart_test_submissions')
        .select('answers')
        .eq('id', submissionId)
        .single();
      const stored = (sub?.answers as any)?.__discount_code;
      if (stored?.code && stored?.valid_until && new Date(stored.valid_until) > new Date()) {
        return new Response(
          JSON.stringify({ ...stored, savings, percentage: PERCENTAGE, price }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Generate unique code
    let code = genCode();
    for (let i = 0; i < 5; i++) {
      const { data: exists } = await supabase
        .from('discount_codes')
        .select('id')
        .ilike('code', code)
        .maybeSingle();
      if (!exists) break;
      code = genCode();
    }

    const validUntil = new Date(Date.now() + HOURS_VALID * 3600 * 1000).toISOString();
    const { error: insErr } = await supabase.from('discount_codes').insert({
      code,
      course_id: BOUNDLESS_COURSE_ID,
      percentage: PERCENTAGE,
      discount_type: 'percentage',
      max_uses: 1,
      current_uses: 0,
      is_active: true,
      valid_until: validUntil,
    });
    if (insErr) throw insErr;

    // Save back on submission for idempotency
    if (submissionId) {
      const { data: sub } = await supabase
        .from('boundless_smart_test_submissions')
        .select('answers')
        .eq('id', submissionId)
        .single();
      const next = { ...((sub?.answers as any) || {}), __discount_code: { code, valid_until: validUntil } };
      await supabase
        .from('boundless_smart_test_submissions')
        .update({ answers: next })
        .eq('id', submissionId);
    }

    return new Response(
      JSON.stringify({ code, valid_until: validUntil, percentage: PERCENTAGE, savings, price }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
