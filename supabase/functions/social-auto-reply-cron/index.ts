// AI auto-reply cron. Fetches the last inbound DM live from NovinHub — no message store.
// Only checks conversations updated in the last 15 minutes to minimize cost.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { nhFetch, novinhub } from '../_shared/novinhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PROMPT = `شما یک دستیار پشتیبانی برای «آکادمی رفیعی» هستید. به فارسی، مؤدبانه و کوتاه پاسخ دهید. اگر سوال درباره خرید دوره، قیمت یا مشاوره است، کاربر را به لینک academy.rafiei.co راهنمایی کنید.`;

async function callAI(system: string, user: string): Promise<string> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) throw new Error('LOVABLE_API_KEY missing');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: accounts } = await supabase
      .from('social_accounts').select('*').eq('is_active', true).eq('auto_reply_enabled', true);

    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let replied = 0;
    const results: any[] = [];

    for (const acc of accounts || []) {
      const { data: convos } = await supabase
        .from('social_conversations').select('*')
        .eq('account_id', acc.id)
        .gt('last_message_at', cutoff)
        .eq('last_message_direction', 'in')
        .order('last_message_at', { ascending: false })
        .limit(20);

      const ownId = (acc as any).meta?.social_user_id;

      for (const c of convos || []) {
        if (c.last_auto_reply_at && (Date.now() - new Date(c.last_auto_reply_at).getTime()) < 10 * 60 * 1000) continue;

        try {
          // Fetch just the latest message live.
          const msgRes: any = await novinhub.listMessages(c.provider_thread_id, { limit: 1 }).catch(() => null);
          const rows = msgRes?.data || (Array.isArray(msgRes) ? msgRes : []);
          const last = rows[rows.length - 1] || rows[0];
          if (!last) continue;
          const isOut = ownId != null && String(last.social_user_id) === String(ownId);
          if (isOut || !last.text) continue;

          const reply = await callAI(acc.ai_system_prompt || DEFAULT_PROMPT, String(last.text));
          if (!reply) continue;

          await nhFetch(`/conversation/${c.provider_thread_id}/reply`, {
            method: 'POST', body: JSON.stringify({ text: reply }),
          });

          await supabase.from('social_conversations').update({
            last_auto_reply_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            last_message_preview: reply.slice(0, 200),
            last_message_direction: 'out',
            last_responder: 'ai',
            needs_reply: false,
          }).eq('id', c.id);

          await supabase.from('social_ai_logs').insert({
            account_id: acc.id,
            conversation_id: c.id,
            action: 'auto_reply',
            prompt: last.text,
            response: reply,
            model: 'google/gemini-2.5-flash',
          });

          replied++;
          results.push({ conversation: c.id, ok: true });
        } catch (e: any) {
          results.push({ conversation: c.id, error: e.message });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, replied, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
