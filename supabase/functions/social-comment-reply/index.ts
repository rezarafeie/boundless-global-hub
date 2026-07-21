import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { nhFetch } from '../_shared/novinhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { comment_id, text } = await req.json();
    if (!comment_id || !text) {
      return new Response(JSON.stringify({ error: 'comment_id and text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: comment, error: cErr } = await supabase
      .from('social_comments').select('*').eq('id', comment_id).single();
    if (cErr || !comment) throw new Error('Comment not found');

    const res = await nhFetch(`/comment/${comment.provider_comment_id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }).catch(async (e) => {
      // Fallback path
      return await nhFetch(`/comment/${comment.provider_comment_id}/answer`, {
        method: 'POST', body: JSON.stringify({ text }),
      });
    });

    await supabase.from('social_comments').update({
      status: 'replied',
      replied_at: new Date().toISOString(),
      reply_text: text,
      sent_at: new Date().toISOString(),
    }).eq('id', comment_id);

    return new Response(JSON.stringify({ ok: true, res }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
