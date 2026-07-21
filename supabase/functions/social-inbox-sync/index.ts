// Lightweight conversation summary sync. Does NOT persist messages or per-DM notifications.
// Full DM history is fetched on demand via `social-fetch-messages`.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { novinhub } from '../_shared/novinhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const accountFilter = (body as any).account_id as string | undefined;

    let accQuery = supabase.from('social_accounts').select('*').eq('is_active', true);
    if (accountFilter) accQuery = accQuery.eq('id', accountFilter);
    const { data: accounts, error: accErr } = await accQuery;
    if (accErr) throw accErr;

    let convsUpserted = 0;
    for (const acc of accounts || []) {
      const res: any = await novinhub.listConversations({
        account_id: acc.novinhub_account_id,
        limit: 50,
      }).catch((e) => { console.error('listConversations:', e.message); return null; });
      const rows = res?.data || [];

      for (const c of rows) {
        const providerThreadId = String(c.id);
        const participant = c.socialUser || c.participant || {};
        const lastMsg = c.last_message || c.lastMessage || {};
        const lastAt = lastMsg.date || c.updated_at || c.date;

        await supabase.from('social_conversations').upsert({
          account_id: acc.id,
          provider_thread_id: providerThreadId,
          participant_username: participant.username || participant.name || null,
          participant_name: participant.name || null,
          participant_avatar_url: participant.image || null,
          last_message_preview: (lastMsg.text || '').slice(0, 200) || null,
          last_message_at: lastAt ? new Date(String(lastAt).replace(' ', 'T') + 'Z').toISOString() : null,
          last_message_direction: lastMsg.social_user_id && String(lastMsg.social_user_id) === String(acc.meta?.social_user_id) ? 'out' : 'in',
          unread_count: Number(c.unread_count || 0),
          status: c.status === 1 ? 'closed' : 'open',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'account_id,provider_thread_id' });
        convsUpserted++;
      }

      await supabase.from('social_accounts').update({ last_sync_at: new Date().toISOString() }).eq('id', acc.id);
    }

    return new Response(JSON.stringify({ ok: true, conversations: convsUpserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('inbox-sync:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
