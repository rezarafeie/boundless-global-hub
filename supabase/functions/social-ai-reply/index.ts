import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const started = Date.now();
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

    const { conversation_id, action = 'suggest', extra_prompt } = await req.json();
    if (!conversation_id) throw new Error('conversation_id required');

    const { data: conv } = await supabase
      .from('social_conversations')
      .select('*, social_accounts(username)')
      .eq('id', conversation_id)
      .single();
    if (!conv) throw new Error('Conversation not found');

    const { data: settings } = await supabase.from('social_settings').select('*').eq('id', 1).single();

    // Fetch recent messages live from NovinHub (not stored locally).
    const { novinhub } = await import('../_shared/novinhub.ts');
    const ownId = (conv as any).social_accounts?.meta?.social_user_id;
    let history: { role: string; content: string }[] = [];
    try {
      const res: any = await novinhub.listMessages(conv.provider_thread_id, { limit: 30 });
      const rows = res?.data || (Array.isArray(res) ? res : []);
      history = rows
        .map((m: any) => {
          const isOut = ownId != null && String(m.social_user_id) === String(ownId);
          return { role: isOut ? 'assistant' : 'user', content: m.text || '' };
        })
        .filter((m: any) => m.content);
    } catch (e) {
      console.warn('history fetch failed:', (e as Error).message);
    }


    const toneMap: Record<string, string> = {
      friendly: 'صمیمی و دوستانه',
      professional: 'حرفه‌ای و رسمی',
      casual: 'خودمانی',
    };
    const tone = toneMap[settings?.ai_tone || 'friendly'];

    // Load active knowledge base entries (top priority)
    const { data: kb } = await supabase
      .from('social_knowledge_base')
      .select('title, content, kind')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(20);
    const kbBlock = (kb && kb.length)
      ? '\n\nپایگاه دانش (برای پاسخ‌های دقیق‌تر از این استفاده کن):\n' +
        kb.map((k, i) => `${i + 1}. [${k.kind}] ${k.title}\n${k.content}`).join('\n\n')
      : '';

    const systemByAction: Record<string, string> = {
      suggest: `شما دستیار پاسخگویی به پیام‌های اینستاگرام آکادمی رفیعی هستید. لحن ${tone}. کوتاه، مفید و به فارسی. اگر کاربر درباره دوره پرسید، او را راهنمایی کنید. فقط پاسخ پیشنهادی را بنویسید بدون توضیح اضافه.${kbBlock}`,
      translate: `متن آخرین پیام کاربر را به فارسی روان ترجمه کنید. فقط ترجمه را برگردانید.`,
      summarize: `خلاصه‌ای در ۲-۳ جمله از این مکالمه بنویسید تا اپراتور سریع در جریان قرار گیرد.`,
      followup: `یک پیام پیگیری کوتاه و ${tone} برای این مکالمه بنویس که کاربر را دوباره درگیر کند.${kbBlock}`,
    };

    const messages = [
      { role: 'system', content: systemByAction[action] || systemByAction.suggest },
      ...history,
    ];
    if (extra_prompt) messages.push({ role: 'user', content: extra_prompt });


    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '';

    await supabase.from('social_ai_logs').insert({
      conversation_id,
      action,
      input: { history_len: history.length, extra_prompt },
      output: { reply },
      model: 'google/gemini-2.5-flash',
      latency_ms: Date.now() - started,
    });

    return new Response(JSON.stringify({ ok: true, reply, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('ai-reply error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
