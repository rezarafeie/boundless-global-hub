import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: 'submission_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: sub, error: subErr } = await supabase
      .from('assignment_submissions').select('*').eq('id', submission_id).single();
    if (subErr || !sub) throw subErr || new Error('submission not found');

    const { data: assignment, error: aErr } = await supabase
      .from('assignments').select('*').eq('id', sub.assignment_id).single();
    if (aErr || !assignment) throw aErr || new Error('assignment not found');

    const answersFormatted = assignment.blocks
      .filter((b: any) => sub.answers[b.id] !== undefined)
      .map((b: any) => `- ${b.label || b.type}: ${JSON.stringify(sub.answers[b.id])}`)
      .join('\n');

    const systemPrompt = assignment.ai_feedback_prompt
      || `به عنوان کوچ آکادمی رفیعی، پاسخ دانشجو را تحلیل کن و بازخوردی دقیق، کاربردی و انگیزشی به فارسی ارائه بده.`;

    const userPrompt = `عنوان تمرین: ${assignment.title}
${assignment.description ? `توضیح: ${assignment.description}\n` : ''}
پاسخ‌های دانشجو:
${answersFormatted}

خروجی را فقط به صورت JSON با ساختار زیر بازگردان (بدون هیچ متن اضافی):
{
  "score": <عدد بین 0 تا 100>,
  "summary": "<خلاصه بازخورد در ۲-۳ جمله>",
  "strengths": ["<نقطه قوت ۱>", "<نقطه قوت ۲>"],
  "weaknesses": ["<نقطه ضعف ۱>", "<نقطه ضعف ۲>"],
  "next_steps": ["<قدم بعدی ۱>", "<قدم بعدی ۲>"]
}`;

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
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
      const errText = await aiRes.text();
      throw new Error(`AI gateway error ${aiRes.status}: ${errText}`);
    }
    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || '{}';
    let feedback: any;
    try { feedback = JSON.parse(content); } catch { feedback = { summary: content }; }

    await supabase.from('assignment_submissions').update({
      ai_feedback: feedback,
      score: typeof feedback.score === 'number' ? feedback.score : null,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    }).eq('id', submission_id);

    await supabase.from('assignment_ai_logs').insert({
      assignment_id: assignment.id,
      submission_id,
      kind: 'feedback',
      prompt: userPrompt,
      response: feedback,
      model: 'google/gemini-2.5-flash',
    });

    return new Response(JSON.stringify({ ok: true, feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-feedback-assignment error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
