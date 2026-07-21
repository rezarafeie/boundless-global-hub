import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function summarize(text: string): Promise<{ summary: string; score: number }> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return { summary: text.slice(0, 200), score: 30 };
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'خلاصه کوتاه (حداکثر ۲ جمله فارسی) و امتیاز لید بین 0 تا 100 برای علاقه به خرید برگردان. فرمت JSON: {"summary":"...","score":0-100}' },
          { role: 'user', content: text.slice(0, 2000) },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return { summary: parsed.summary || '', score: Math.round(parsed.score || 30) };
  } catch {
    return { summary: text.slice(0, 200), score: 30 };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { conversation_id } = await req.json();
    if (!conversation_id) throw new Error('conversation_id required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: conv, error } = await supabase
      .from('social_conversations').select('*').eq('id', conversation_id).single();
    if (error || !conv) throw new Error('conversation not found');

    const { data: existing } = await supabase
      .from('social_leads').select('id').eq('conversation_id', conversation_id).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, lead_id: existing.id, existed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: msgs } = await supabase
      .from('social_messages').select('direction,text,sent_at')
      .eq('conversation_id', conversation_id)
      .order('sent_at', { ascending: true }).limit(50);
    const transcript = (msgs || []).map((m: any) => `${m.direction === 'in' ? 'کاربر' : 'ما'}: ${m.text || ''}`).join('\n');

    const { summary, score } = await summarize(transcript);

    const { data: lead, error: iErr } = await supabase.from('social_leads').insert({
      account_id: conv.account_id,
      conversation_id: conv.id,
      source: 'dm',
      username: conv.participant_username,
      name: conv.participant_name,
      ai_summary: summary,
      score,
      stage: 'new',
    }).select('id').single();
    if (iErr) throw iErr;

    return new Response(JSON.stringify({ ok: true, lead_id: lead.id, summary, score }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
