import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { lesson_title, lesson_summary, learning_goal, difficulty, assignment_type, ai_feedback } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `تو کوچ آکادمی رفیعی هستی و برای درس‌های دوره‌ی «شروع بدون مرز» تمرین طراحی می‌کنی.
همیشه خروجی معتبر JSON بازگردان. زبان فارسی، لحن حرفه‌ای، عمل‌گرا و انگیزشی.`;

    const userPrompt = `یک تمرین برای درس زیر بساز:
- عنوان درس: ${lesson_title || '—'}
- خلاصه درس: ${lesson_summary || '—'}
- هدف یادگیری: ${learning_goal || '—'}
- سطح: ${difficulty || 'متوسط'}
- نوع تمرین درخواستی: ${assignment_type || 'ترکیبی'}
- بازخورد هوشمند: ${ai_feedback ? 'فعال' : 'غیرفعال'}

خروجی JSON دقیقاً با این ساختار:
{
  "title": "...",
  "description": "...",
  "estimated_minutes": <عدد>,
  "ai_feedback_enabled": ${!!ai_feedback},
  "ai_feedback_prompt": "<پرامپت برای بازخورد AI>",
  "blocks": [
    { "id": "b1", "type": "long_text", "label": "...", "required": true }
  ]
}

انواع بلوک مجاز: title, description, short_text, long_text, number, single_choice (options), multiple_choice (options), rating (max), checklist (options), file_upload, image_upload, link, hint`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error(`AI gateway ${aiRes.status}: ${t}`);
    }
    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || '{}';
    const assignment = JSON.parse(content);

    return new Response(JSON.stringify({ ok: true, assignment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-generate-assignment error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
