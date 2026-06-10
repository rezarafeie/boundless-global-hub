import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers, outcome, trackId, fullName, note } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `تو رضا رفیعی هستی، مربی پروژه بدون مرز. یک پیام شخصی، صمیمی و انگیزه‌بخش به فارسی برای کاربر بنویس (حدود ۱۵۰ تا ۲۵۰ کلمه) که نتیجه تست هوشمندش رو تفسیر کنه.
- اگه outcome=passed: تبریک بگو، نقاط قوتش رو بر اساس پاسخ‌هاش بگو، و انگیزه بده برای ثبت‌نام در دوره بدون مرز.
- اگه outcome=rejected: با احترام بگو که الان شرایطش مناسب نیست، چه چیزی باید تغییر کنه، و امیدوار نگهش دار.
لحن: گرم، دوستانه، شخصی. از نام کاربر استفاده کن. پاسخت فقط متن خام فارسی باشه، بدون markdown یا توضیح اضافی.`;

    const userPrompt = `نام کاربر: ${fullName || 'دوست عزیز'}
مسیر انتخابی: ${trackId}
نتیجه: ${outcome}
${note ? `یادداشت کاربر: ${note}` : ''}
پاسخ‌های کلیدی:
${JSON.stringify(answers, null, 2).slice(0, 2500)}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
      }),
    });

    if (!aiResponse.ok) {
      const t = await aiResponse.text();
      console.error('AI error', aiResponse.status, t);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'rate_limit' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'credits_exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('analyze-boundless-test error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
