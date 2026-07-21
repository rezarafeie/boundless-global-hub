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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const accountId: string | undefined = body.account_id;

    let accountsQuery = supabase.from('social_accounts').select('*').eq('is_active', true);
    if (accountId) accountsQuery = accountsQuery.eq('id', accountId);
    const { data: accounts, error: accErr } = await accountsQuery;
    if (accErr) throw accErr;

    let convCount = 0;
    let msgCount = 0;

    for (const acc of accounts || []) {
      // Ask NovinHub for conversations, scoped to this account when supported
      const convRes = await novinhub.listConversations({ account_id: acc.novinhub_account_id, limit: 30 }).catch((e) => {
        console.error(`listConversations failed for ${acc.username}:`, e.message);
        return null;
      });
      if (!convRes) continue;

      const conversations = Array.isArray(convRes) ? convRes : (convRes.data || []);

      for (const c of conversations) {
        const providerThreadId = String(c.id ?? c.conversation_id ?? '');
        if (!providerThreadId) continue;
        const participant = c.user || c.participant || c.from || {};
        const lastMsg = c.last_message || c.lastMessage || {};

        const convRow = {
          account_id: acc.id,
          provider_thread_id: providerThreadId,
          participant_username: participant.username || participant.name || c.name || null,
          participant_name: participant.name || participant.full_name || null,
          participant_pic_url: participant.profile_image_url || participant.avatar || null,
          participant_meta: participant,
          last_message_at: c.updated_at || c.last_message_at || lastMsg.created_at || new Date().toISOString(),
          last_message_preview: (lastMsg.content || lastMsg.text || c.snippet || '').toString().slice(0, 200),
          last_message_direction: lastMsg.direction || null,
          unread_count: c.unread_count ?? c.unseen_count ?? 0,
          meta: c,
          updated_at: new Date().toISOString(),
        };

        const { data: upConv, error: upErr } = await supabase
          .from('social_conversations')
          .upsert(convRow, { onConflict: 'account_id,provider_thread_id' })
          .select('id')
          .single();
        if (upErr) { console.error('upsert conv:', upErr); continue; }
        convCount++;

        // Fetch messages for this thread
        const msgsRes = await novinhub.listMessages(providerThreadId, { limit: 50 }).catch(() => null);
        if (!msgsRes) continue;
        const msgs = Array.isArray(msgsRes) ? msgsRes : (msgsRes.data || []);
        const msgRows = msgs.map((m: any) => ({
          conversation_id: upConv.id,
          provider_message_id: String(m.id ?? ''),
          direction: (m.direction || (m.from_me ? 'out' : 'in')),
          sender_type: m.from_me ? 'human' : 'user',
          text: m.content || m.text || null,
          media_url: m.media_url || (m.attachments?.[0]?.url) || null,
          media_type: m.media_type || (m.attachments?.[0]?.type) || null,
          attachments: m.attachments || [],
          sent_at: m.created_at || new Date().toISOString(),
          meta: m,
        })).filter((r: any) => r.provider_message_id);

        if (msgRows.length) {
          const { error: msgErr } = await supabase
            .from('social_messages')
            .upsert(msgRows, { onConflict: 'conversation_id,provider_message_id' });
          if (msgErr) console.error('upsert msgs:', msgErr);
          else msgCount += msgRows.length;
        }
      }

      await supabase.from('social_accounts').update({ last_sync_at: new Date().toISOString() }).eq('id', acc.id);
    }

    return new Response(JSON.stringify({ ok: true, conversations: convCount, messages: msgCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('sync error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
