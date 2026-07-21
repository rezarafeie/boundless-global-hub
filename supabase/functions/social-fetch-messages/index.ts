// Live-fetch DMs for a conversation from NovinHub. We do NOT persist messages.
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
    const { conversation_id, limit = 50 } = await req.json();
    if (!conversation_id) throw new Error('conversation_id required');

    const { data: conv, error } = await supabase
      .from('social_conversations')
      .select('id, provider_thread_id, account_id, social_accounts!inner(meta)')
      .eq('id', conversation_id)
      .single();
    if (error || !conv) throw new Error('conversation not found');

    const res = await novinhub.listMessages(conv.provider_thread_id, { limit });
    const rows = Array.isArray(res) ? res : (res?.data || []);
    const ownSocialUserId = (conv as any).social_accounts?.meta?.social_user_id;

    const messages = rows.map((m: any) => {
      const isOut = ownSocialUserId != null && String(m.social_user_id) === String(ownSocialUserId);
      return {
        id: String(m.id),
        direction: isOut ? 'out' : 'in',
        sender_type: isOut ? (m.is_auto_response ? 'ai' : 'human') : 'user',
        text: m.text || null,
        media_url: m.attachment?.url || null,
        media_type: m.type || null,
        sent_at: m.date ? new Date(m.date.replace(' ', 'T') + 'Z').toISOString() : null,
      };
    }).sort((a: any, b: any) => (a.sent_at || '').localeCompare(b.sent_at || ''));

    // Mark conversation as read.
    await supabase.from('social_conversations')
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    return new Response(JSON.stringify({ ok: true, messages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('fetch-messages:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
