import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { processEnrollmentQueue } from '../_shared/social-enrollment.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (req.method !== 'POST' || !key || req.headers.get('apikey') !== key) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  try {
    return new Response(JSON.stringify(await processEnrollmentQueue()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Queue processing unavailable' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});