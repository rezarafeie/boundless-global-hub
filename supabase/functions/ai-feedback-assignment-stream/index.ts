// Streaming AI feedback for an assignment submission. Returns an SSE stream.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = 'google/gemini-3-flash-preview';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: 'submission_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: sub } = await sb
      .from('assignment_submissions').select('*').eq('id', submission_id).maybeSingle();
    if (!sub) {
      return new Response(JSON.stringify({ error: 'submission not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: assignment } = await sb
      .from('assignments').select('*').eq('id', sub.assignment_id).maybeSingle();
    if (!assignment) {
      return new Response(JSON.stringify({ error: 'assignment not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const answersFormatted = (assignment.blocks as any[])
      .filter((b: any) => (sub.answers as any)?.[b.id] !== undefined)
      .map((b: any) => `- ${b.label || b.type}: ${JSON.stringify((sub.answers as any)[b.id])}`)
      .join('\n');

    const systemPrompt = assignment.ai_feedback_prompt
      || 'به عنوان کوچ آکادمی رفیعی، پاسخ دانشجو را تحلیل کن و بازخوردی دقیق، کاربردی و انگیزشی به فارسی ارائه بده.';

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

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Lovable-API-Key': key,
        'Content-Type': 'application/json',
        'X-Lovable-AIG-SDK': 'edge-function',
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      console.error('AI gateway error', upstream.status, txt);
      return new Response(JSON.stringify({ error: `AI gateway error: ${upstream.status}`, detail: txt }), {
        status: upstream.status === 402 || upstream.status === 429 ? upstream.status : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let full = '';
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const reader = upstream.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const j = JSON.parse(payload);
                const delta = j?.choices?.[0]?.delta?.content;
                if (delta) {
                  full += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
              } catch { /* ignore */ }
            }
          }

          let feedback: any = null;
          const cleaned = full.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          try {
            feedback = JSON.parse(cleaned);
          } catch {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) { try { feedback = JSON.parse(m[0]); } catch { feedback = { summary: cleaned }; } }
            else feedback = cleaned ? { summary: cleaned } : null;
          }

          if (feedback) {
            for (const k of ['strengths', 'weaknesses', 'next_steps']) {
              if (feedback[k] && !Array.isArray(feedback[k])) feedback[k] = [String(feedback[k])];
            }
            await sb.from('assignment_submissions').update({
              ai_feedback: feedback,
              score: typeof feedback.score === 'number' ? feedback.score : null,
              status: 'reviewed',
              reviewed_at: new Date().toISOString(),
            }).eq('id', submission_id);

            await sb.from('assignment_ai_logs').insert({
              assignment_id: assignment.id,
              submission_id,
              kind: 'feedback',
              prompt: userPrompt,
              response: feedback,
              model: MODEL,
            });
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ feedback })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (e) {
          console.error('stream error', e);
          try { controller.close(); } catch { /* ignore */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e) {
    console.error('ai-feedback-assignment-stream error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
