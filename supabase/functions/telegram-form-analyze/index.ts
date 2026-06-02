// Manually trigger AI analysis for a Telegram form submission
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage, editMessage, escapeHtml } from '../_shared/telegram.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';

async function buildFormDataText(submission_id: string): Promise<string> {
  const { data: sub } = await supabase.from('telegram_form_submissions')
    .select('id, form_id, chat_id, telegram_form_answers(value_text, value_json, file_url, telegram_form_fields(label, field_type, order_index))')
    .eq('id', submission_id).single();
  if (!sub) return '';
  const answers = (sub as any).telegram_form_answers ?? [];
  answers.sort((a: any, b: any) => (a.telegram_form_fields?.order_index ?? 0) - (b.telegram_form_fields?.order_index ?? 0));
  return answers.map((a: any) => {
    const label = a.telegram_form_fields?.label ?? '?';
    const val = a.value_text ?? (a.file_url ? `[فایل: ${a.file_url}]` : (a.value_json ? JSON.stringify(a.value_json) : '-'));
    return `${label}: ${val}`;
  }).join('\n');
}

async function run(submission_id: string) {
  const { data: sub } = await supabase.from('telegram_form_submissions')
    .select('id, chat_id, form_id, telegram_forms(title, ai_prompt)')
    .eq('id', submission_id).single();
  if (!sub) throw new Error('Submission not found');
  const form: any = (sub as any).telegram_forms;
  if (!form?.ai_prompt) throw new Error('Form has no AI prompt');

  const dataText = await buildFormDataText(submission_id);
  const userContent = `پاسخ‌های ارسال‌شده در فرم «${form.title}»:\n\n${dataText}`;
  const init = await sendMessage(sub.chat_id, '🤖 <i>در حال تحلیل پاسخ‌ها با هوش مصنوعی...</i>');
  const msgId = (init as any)?.result?.message_id;
  if (!msgId) throw new Error('Failed to send Telegram message');

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: form.ai_prompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
    }),
  });
  if (!resp.ok || !resp.body) {
    const txt = await resp.text().catch(() => '');
    await editMessage(sub.chat_id, msgId, `❌ خطای AI: ${escapeHtml(txt.slice(0, 200))}`);
    return;
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = ''; let full = ''; let lastEdit = 0;
  const flush = async (final = false) => {
    const now = Date.now();
    if (!final && now - lastEdit < 1300) return;
    lastEdit = now;
    const shown = full.length > 3800 ? full.slice(-3800) : full;
    try {
      await editMessage(sub.chat_id, msgId, `🤖 <b>تحلیل هوش مصنوعی:</b>\n\n${escapeHtml(shown)}${final ? '' : ' ▌'}`);
    } catch {}
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith('data:')) continue;
      const payload = l.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        const delta = j.choices?.[0]?.delta?.content;
        if (delta) { full += delta; await flush(false); }
      } catch {}
    }
  }
  await flush(true);
  await supabase.from('telegram_form_submissions').update({
    ai_response: full, status: 'analyzed',
  }).eq('id', submission_id);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { submission_id } = await req.json();
    if (!submission_id) return new Response(JSON.stringify({ error: 'submission_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    // Run in background so we can return immediately
    run(submission_id).catch(e => console.error('analyze error:', e));
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
