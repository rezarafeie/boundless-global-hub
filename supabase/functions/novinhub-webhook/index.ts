import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Fail closed until the verified event processor and shared secret are configured.
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(JSON.stringify({ error: 'Instagram enrollment setup is not complete' }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});