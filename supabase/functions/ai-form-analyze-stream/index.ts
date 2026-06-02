// Streaming AI analysis for a submission. Returns SSE stream.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
      .from('telegram_form_submissions')
      .select('id, form_id, telegram_forms(title, ai_prompt, ai_enabled)')
      .eq('id', submission_id)
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ error: 'submission not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const form: any = sub.telegram_forms;
    const aiPrompt = form?.ai_prompt || 'پاسخ‌های کاربر را تحلیل کن و بازخوردی مفید و کوتاه به فارسی بده.';

    const { data: fields } = await sb.from('telegram_form_fields')
      .select('id, label, order_index').eq('form_id', sub.form_id).order('order_index');
    const { data: answers } = await sb.from('telegram_form_answers')
      .select('field_id, value_text, file_url').eq('submission_id', submission_id);

    const labelMap = new Map((fields ?? []).map((f: any) => [f.id, f.label]));
    const lines = (answers ?? []).map((a: any) => {
      const lbl = labelMap.get(a.field_id) || a.field_id;
      return `${lbl}: ${a.value_text ?? a.file_url ?? '—'}`;
    });
    const userMsg = `عنوان فرم: ${form?.title ?? ''}\n\nپاسخ‌ها:\n${lines.join('\n')}`;

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
        model: 'google/gemini-3-flash-preview',
        stream: true,
        messages: [
          { role: 'system', content: aiPrompt },
          { role: 'user', content: userMsg },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${upstream.status}`, detail: txt }), {
        status: upstream.status === 402 || upstream.status === 429 ? upstream.status : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tee: stream to client, accumulate to save to DB at the end
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
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
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
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
          if (full) {
            await sb.from('telegram_form_submissions')
              .update({ ai_response: full, status: 'analyzed' })
              .eq('id', submission_id);
          }
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
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
