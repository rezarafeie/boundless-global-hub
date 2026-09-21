// Smart Test V2 — AI diagnostic layer.
// Deterministic scoring stays in the client engine; this function reasons ON TOP of it.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PATHS = ['dropshipping', 'drop_service', 'digital_product', 'ai', 'vibe_coding'] as const;
type PathId = typeof PATHS[number];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/* ------------------------------ schemas ------------------------------ */

const strObj = (props: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  properties: props,
  required: Object.keys(props),
});

const CHECKPOINT_SCHEMA = strObj({
  observation: { type: 'string' },
  tone: { type: 'string', enum: ['aligned', 'conflict', 'caution'] },
  evidence: { type: 'array', items: { type: 'string' } },
});

const ADAPTIVE_SCHEMA = strObj({
  needs_clarification: { type: 'boolean' },
  reason: { type: 'string' },
  questions: {
    type: 'array',
    items: strObj({
      id: { type: 'string' },
      question: { type: 'string' },
      reason: { type: 'string' },
      resolves: { type: 'array', items: { type: 'string', enum: PATHS as unknown as string[] } },
      expected_information_gain: { type: 'string' },
      options: {
        type: 'array',
        items: strObj({
          value: { type: 'string' },
          label: { type: 'string' },
          leans: { type: 'string', enum: [...PATHS, 'none'] },
        }),
      },
    }),
  },
});

const FINAL_SCHEMA = strObj({
  recommended_path: { type: 'string', enum: PATHS as unknown as string[] },
  secondary_path: { type: 'string', enum: PATHS as unknown as string[] },
  long_term_fit: { type: 'string', enum: PATHS as unknown as string[] },
  best_starting_path: { type: 'string', enum: PATHS as unknown as string[] },
  hybrid_label: { type: ['string', 'null'] },
  confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  diagnosis: { type: 'string' },
  why_this_path: { type: 'array', items: strObj({ point: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } } }) },
  why_not_secondary_yet: { type: 'string' },
  biggest_advantage: strObj({ title: { type: 'string' }, explanation: { type: 'string' } }),
  biggest_risk: strObj({ title: { type: 'string' }, explanation: { type: 'string' } }),
  contradictions: { type: 'array', items: strObj({ title: { type: 'string' }, explanation: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } } }) },
  objection_response: { type: ['string', 'null'] },
  readiness_interpretation: { type: 'string' },
  first_30_days: { type: 'array', items: strObj({ title: { type: 'string' }, action: { type: 'string' }, output: { type: 'string' } }) },
  first_90_days_direction: { type: 'string' },
  personalized_next_step: { type: 'string' },
  recommended_next_action: { type: 'string', enum: ['continue_maza', 'start_course', 'consultation', 'boundless'] },
  path_comparison: { type: 'array', items: strObj({ path: { type: 'string', enum: PATHS as unknown as string[] }, fit: { type: 'string' }, friction: { type: 'string' } }) },
  execution_gaps: { type: 'array', items: strObj({ area: { type: 'string' }, gap: { type: 'string' }, next_step: { type: 'string' } }) },
  personalized_stack: { type: 'array', items: strObj({ name: { type: 'string' }, purpose: { type: 'string' } }) },
});

/* ------------------------------ prompts ------------------------------ */

const BASE_RULES = `تو نقش یک مربی تشخیص مسیر کسب‌وکار در آکادمی رفیعی رو داری (لحن رضا رفیعی: مستقیم، صادق، بدون اغراق).
قوانین قطعی:
- فقط فارسی محاوره‌ای و روان بنویس. هیچ markdown ای نزن.
- فقط از همین ۵ مسیر استفاده کن: dropshipping, drop_service, digital_product, ai, vibe_coding.
- هر نتیجه‌گیری باید به جواب واقعی کاربر گره خورده باشه. شواهد جعل نکن.
- امتیازهای عددی (path_scores) فقط «شواهد» هستن، نه جواب نهایی. مجازی که با دلیل، انتخاب دیگری داشته باشی.
- هیچ تضمین درآمد یا نتیجه نده. عدد درآمد از خودت نساز.
- کوتاه، دقیق و انسانی بنویس؛ شعار انگیزشی توخالی ننویس.`;

const MODE_PROMPT: Record<string, string> = {
  checkpoint: `${BASE_RULES}

الان وسط تست هستی. فقط یک مشاهده کوتاه (حداکثر ۲ تا ۳ جمله) بنویس که نشون بده جواب‌های تا اینجا رو واقعاً خوندی.
اگر بین جواب‌ها تضاد هست، مستقیم بهش اشاره کن (tone=conflict). اگر هم‌جهت‌ان، همین رو بگو (tone=aligned).
در evidence، کلید سؤال‌هایی که به اون‌ها تکیه کردی رو بذار (مثل q2_time).`,
  adaptive: `${BASE_RULES}

همه سؤال‌های اصلی جواب داده شده. تصمیم بگیر: آیا شواهد برای یک پیشنهاد مطمئن کافیه؟
اگر کافیه needs_clarification=false و questions خالی.
اگر دو مسیر خیلی نزدیک‌ان یا تناقض حل‌نشده وجود داره، حداکثر ۳ (معمولاً ۱ یا ۲) سؤال بساز که دقیقاً همون ابهام رو حل کنه.
هر سؤال باید ۲ تا ۴ گزینه واقعی و متقابل داشته باشه و هر گزینه به یک مسیر تمایل (leans) داشته باشه.
سؤال عمومی یا تکراری نساز.`,
  final: `${BASE_RULES}

الان تشخیص نهایی رو بساز.
- diagnosis باید مثل حرف زدن یک مربی باشه: «اگر جای تو بودم، الان ... رو شروع می‌کردم، نه ...» و بعد دلیلش با جواب‌های خودش.
- بین «مسیری که در بلندمدت بهش می‌خوره» و «مسیری که باید امروز شروع کنه» تفاوت قائل شو (اگر یکی هستن، هر دو رو یکی بذار).
- اگر ترکیب منطقی‌تره (مثلاً Drop Service با اهرم AI)، hybrid_label رو پر کن؛ وگرنه null.
- why_not_secondary_yet باید دلیل واقعی بده، نه «امتیازش کمتر بود».
- objection_response: اگر کاربر اعتراضی داشته، شخصی‌سازی‌شده جوابش رو بده و اگر با جواب‌های قبلیش تناقض داره همون رو رک بگو؛ اگر اعتراضی نداشت null.
- readiness_interpretation: عدد آمادگی رو تفسیر کن و بگو دقیقاً چی اون رو پایین یا بالا برده.
- first_30_days دقیقاً ۴ آیتم (هفته به هفته) و قابل اجرا.`,
 - path_comparison فقط برای دو مسیر اول و با تفاوت واقعی fit و friction نوشته شود.
 - execution_gaps شکاف‌های واقعی آموزش، فروش، تحویل، ابزار یا پرداخت را از جواب‌ها استخراج کند؛ حداکثر ۵ مورد.
 - personalized_stack فقط ابزارهایی را پیشنهاد دهد که برای مسیر و شکاف‌های همین کاربر لازم‌اند؛ قیمت یا تخفیف نسازد.`,
};

/* ------------------------------ gateway ------------------------------ */

async function callGateway(apiKey: string, mode: string, context: unknown, schemaName: string, schema: unknown) {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': apiKey,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra',
      stream: true,
      reasoning: { effort: mode === 'final' ? 'medium' : 'low' },
      input: [
        { role: 'developer', content: [{ type: 'input_text', text: MODE_PROMPT[mode] }] },
        { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(context) }] },
      ],
      text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    console.error('gateway error', res.status, text.slice(0, 600));
    return { error: res.status === 429 ? 'rate_limit' : res.status === 402 ? 'credits_exhausted' : 'ai_failed', status: res.status };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === 'response.output_text.delta' && typeof evt.delta === 'string') out += evt.delta;
        else if (evt.type === 'response.completed' && !out) out = evt.response?.output_text ?? '';
      } catch { /* partial frame */ }
    }
  }

  if (!out.trim()) return { error: 'empty_response', status: 502 };
  try {
    return { data: JSON.parse(out) };
  } catch {
    const match = out.match(/\{[\s\S]*\}/);
    if (match) { try { return { data: JSON.parse(match[0]) }; } catch { /* fallthrough */ } }
    return { error: 'invalid_json', status: 502 };
  }
}

/* ------------------------------ validation ------------------------------ */

const isPath = (v: unknown): v is PathId => typeof v === 'string' && (PATHS as readonly string[]).includes(v);

function validateFinal(d: any, fallbackPrimary: PathId, fallbackSecondary: PathId) {
  if (!d || typeof d !== 'object') return null;
  if (!isPath(d.recommended_path)) d.recommended_path = fallbackPrimary;
  if (!isPath(d.secondary_path) || d.secondary_path === d.recommended_path) d.secondary_path = fallbackSecondary;
  if (!isPath(d.long_term_fit)) d.long_term_fit = d.recommended_path;
  if (!isPath(d.best_starting_path)) d.best_starting_path = d.recommended_path;
  if (!['high', 'medium', 'low'].includes(d.confidence)) d.confidence = 'medium';
  if (typeof d.diagnosis !== 'string' || d.diagnosis.trim().length < 20) return null;
  d.why_this_path = Array.isArray(d.why_this_path) ? d.why_this_path.slice(0, 5) : [];
  d.contradictions = Array.isArray(d.contradictions) ? d.contradictions.slice(0, 4) : [];
  d.first_30_days = Array.isArray(d.first_30_days) ? d.first_30_days.slice(0, 4) : [];
  d.path_comparison = Array.isArray(d.path_comparison) ? d.path_comparison.filter((item: any) => isPath(item?.path)).slice(0, 2) : [];
  d.execution_gaps = Array.isArray(d.execution_gaps) ? d.execution_gaps.slice(0, 5) : [];
  d.personalized_stack = Array.isArray(d.personalized_stack) ? d.personalized_stack.slice(0, 7) : [];
  if (!['continue_maza', 'start_course', 'consultation', 'boundless'].includes(d.recommended_next_action)) {
    d.recommended_next_action = 'start_course';
  }
  return d;
}

function validateAdaptive(d: any) {
  if (!d || typeof d !== 'object') return { needs_clarification: false, reason: '', questions: [] };
  const questions = (Array.isArray(d.questions) ? d.questions : [])
    .filter((q: any) => typeof q?.question === 'string' && Array.isArray(q.options) && q.options.length >= 2)
    .slice(0, 3)
    .map((q: any, i: number) => ({
      id: typeof q.id === 'string' && q.id ? `adaptive_${q.id}`.slice(0, 40) : `adaptive_${i + 1}`,
      question: q.question,
      reason: typeof q.reason === 'string' ? q.reason : '',
      resolves: (Array.isArray(q.resolves) ? q.resolves : []).filter(isPath),
      expected_information_gain: typeof q.expected_information_gain === 'string' ? q.expected_information_gain : '',
      options: q.options.slice(0, 4).map((o: any, j: number) => ({
        value: typeof o?.value === 'string' && o.value ? o.value : `opt_${j + 1}`,
        label: String(o?.label ?? ''),
        leans: isPath(o?.leans) ? o.leans : 'none',
      })).filter((o: any) => o.label),
    }))
    .filter((q: any) => q.options.length >= 2);
  return { needs_clarification: questions.length > 0, reason: typeof d.reason === 'string' ? d.reason : '', questions };
}

/* ------------------------------ handler ------------------------------ */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode || '');
    const context = body?.context;
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : null;
    const checkpoint = Number(body?.checkpoint || 0);

    if (!['checkpoint', 'adaptive', 'final'].includes(mode)) return json({ error: 'invalid_mode' }, 400);
    if (!context || typeof context !== 'object') return json({ error: 'invalid_context' }, 400);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'missing_api_key' }, 500);

    const schema = mode === 'final' ? FINAL_SCHEMA : mode === 'adaptive' ? ADAPTIVE_SCHEMA : CHECKPOINT_SCHEMA;
    const result = await callGateway(apiKey, mode, context, `stv2_${mode}`, schema);
    if ('error' in result) return json({ error: result.error }, result.status ?? 502);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (mode === 'checkpoint') {
      const data = result.data as any;
      if (typeof data?.observation !== 'string' || !data.observation.trim()) return json({ error: 'empty_response' }, 502);
      if (submissionId) {
        const { data: row } = await supabase.from('smart_test_v2_submissions').select('ai_checkpoints').eq('id', submissionId).maybeSingle();
        const next = { ...((row as any)?.ai_checkpoints || {}), [`cp${checkpoint}`]: { ...data, at: new Date().toISOString() } };
        await supabase.from('smart_test_v2_submissions').update({ ai_checkpoints: next }).eq('id', submissionId);
      }
      return json(data);
    }

    if (mode === 'adaptive') {
      const data = validateAdaptive(result.data);
      if (submissionId) await supabase.from('smart_test_v2_submissions').update({ adaptive_questions: data.questions }).eq('id', submissionId);
      return json(data);
    }

    const scores = (context as any)?.path_scores || {};
    const ordered = [...PATHS].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
    const data = validateFinal(result.data, ordered[0], ordered[1]);
    if (!data) return json({ error: 'invalid_diagnosis' }, 502);

    if (submissionId) {
      await supabase.from('smart_test_v2_submissions').update({
        ai_diagnosis: data,
        ai_status: 'ready',
        ai_confidence: data.confidence,
        long_term_fit: data.long_term_fit,
        best_starting_path: data.best_starting_path,
        next_action: data.recommended_next_action,
        ai_reality_check: data.diagnosis,
      }).eq('id', submissionId);
    }
    return json(data);
  } catch (e) {
    console.error('smart-test-v2-diagnose error', e);
    return json({ error: e instanceof Error ? e.message : 'error' }, 500);
  }
});
