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
    const { conversation_id, text, sender_type = 'human' } = await req.json();
    if (!conversation_id || !text) {
      return new Response(JSON.stringify({ error: 'conversation_id and text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: conv, error: convErr } = await supabase
      .from('social_conversations')
      .select('id, provider_thread_id, account_id')
      .eq('id', conversation_id)
      .single();
    if (convErr || !conv) throw convErr || new Error('Conversation not found');

    let providerMessageId: string | null = null;
    try {
      const res = await novinhub.reply(conv.provider_thread_id, text);
      providerMessageId = String(res?.id ?? res?.data?.id ?? '');
    } catch (e: any) {
      console.error('NovinHub reply failed:', e.message);
      // still record the outbound intent, but mark meta
      await supabase.from('social_messages').insert({
        conversation_id: conv.id,
        direction: 'out',
        sender_type,
        text,
        meta: { error: e.message },
      });
      throw e;
    }

    const { data: inserted, error: insErr } = await supabase.from('social_messages').insert({
      conversation_id: conv.id,
      provider_message_id: providerMessageId || null,
      direction: 'out',
      sender_type,
      text,
      sent_at: new Date().toISOString(),
    }).select().single();
    if (insErr) throw insErr;

    await supabase.from('social_conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: text.slice(0, 200),
      last_message_direction: 'out',
      last_responder: sender_type === 'ai' ? 'ai' : 'human',
      unread_count: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', conv.id);

    return new Response(JSON.stringify({ ok: true, message: inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
