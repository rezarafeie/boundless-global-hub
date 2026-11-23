import { createClient } from 'npm:@supabase/supabase-js@2';
import { relayMessage } from '../_shared/messenger-telegram.ts';

// Called by the database trigger. Only the row id is used; the message is re-read and
// delivered once per eligible recipient, so replays cannot spam or forge content.
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const body = await req.json();
    const table = String(body?.table || '');
    const id = Number(body?.record?.id);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const result = await relayMessage(db, table, id);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('messenger relay failed', String((e as Error)?.message || e).slice(0, 200));
    return new Response(JSON.stringify({ error: 'relay failed' }), { status: 500 });
  }
});
