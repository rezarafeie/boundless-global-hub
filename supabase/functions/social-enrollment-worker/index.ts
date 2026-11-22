import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { processEnrollmentQueue } from '../_shared/social-enrollment.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  // Scheduled retries send the project's publishable key; the runtime anon key may be a different format.
  const keys = [Deno.env.get('SUPABASE_ANON_KEY'), 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk0NTIsImV4cCI6MjA2NTk0NTQ1Mn0.91gRPO_ApEGQF2EtTAQLcqA-mIj7lqF29M1OZcGW4BI'].filter(Boolean);
  if (req.method !== 'POST' || !keys.includes(req.headers.get('apikey') ?? '')) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  try {
    return new Response(JSON.stringify(await processEnrollmentQueue()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch {
    console.error('Social enrollment queue processing failed');
    return new Response(JSON.stringify({ error: 'Queue processing unavailable' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});