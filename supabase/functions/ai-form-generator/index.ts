// AI form generator: takes a natural-language prompt and returns a form schema
// (title, description, ai_prompt, fields[]). Optionally accepts an existing form
// to edit/extend.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM = `You design Persian web forms. Output ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "string (Persian)",
  "description": "string (Persian, short)",
  "ai_prompt": "string (optional, instructions for AI to analyze submissions)",
  "fields": [
    {
      "label": "Persian label",
      "field_key": "snake_case_key",
      "field_type": "text | long_text | phone | email | number | dropdown | image | voice | file | message | ai_analysis",
      "required": true,
      "options": ["choice1","choice2"] | null,
      "help_text": "optional Persian helper",
      "content": "for field_type=message: the text/markdown to display"
    }
  ]
}
Rules:
- Use "message" field_type for static informational notes/instructions (no input).
- Use "ai_analysis" ONCE at the end if the form benefits from AI feedback to the user.
- Use "dropdown" for single-choice; put options as a JSON array of strings.
- Use "phone" for mobile, "email" for email, "long_text" for descriptions/paragraphs.
- Keep field_key in English snake_case.
- Be concise: 3-8 fields typical.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { prompt, existing } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'prompt required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userMsg = existing
      ? `EXISTING FORM:\n${JSON.stringify(existing)}\n\nINSTRUCTION: ${prompt}\n\nReturn the FULL updated JSON.`
      : `Build a form for: ${prompt}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Lovable-API-Key': key,
        'Content-Type': 'application/json',
        'X-Lovable-AIG-SDK': 'edge-function',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userMsg },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${resp.status}`, detail: txt }), {
        status: resp.status === 402 || resp.status === 429 ? resp.status : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // Normalize fields
    const fields = Array.isArray(parsed.fields) ? parsed.fields.map((f: any, i: number) => ({
      label: String(f.label ?? ''),
      field_key: String(f.field_key ?? `f_${i + 1}`),
      field_type: String(f.field_type ?? 'text'),
      required: f.required !== false,
      options: f.options ?? null,
      help_text: f.help_text ?? null,
      content: f.content ?? null,
    })) : [];

    return new Response(JSON.stringify({
      title: parsed.title ?? '',
      description: parsed.description ?? '',
      ai_prompt: parsed.ai_prompt ?? '',
      fields,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
