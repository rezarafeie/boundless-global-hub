import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AnswerInput {
  field_id: string;
  value_text?: string | null;
  file_url?: string | null;
  file_mime?: string | null;
}

interface Body {
  form_id: string;
  chat_user_id?: number | null;
  phone?: string | null;
  full_name?: string | null;
  answers: AnswerInput[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.form_id || !Array.isArray(body.answers)) {
      return new Response(JSON.stringify({ error: 'invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Load form
    const { data: form, error: formErr } = await supabase
      .from('telegram_forms')
      .select('id, title, is_active, require_login')
      .eq('id', body.form_id)
      .single();
    if (formErr || !form) {
      return new Response(JSON.stringify({ error: 'form not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!form.is_active) {
      return new Response(JSON.stringify({ error: 'form inactive' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (form.require_login && !body.chat_user_id) {
      return new Response(JSON.stringify({ error: 'login required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to resolve chat_user from phone if not provided
    let chatUserId = body.chat_user_id ?? null;
    let phone = body.phone?.trim() || null;
    let fullName = body.full_name?.trim() || null;

    if (chatUserId) {
      const { data: u } = await supabase
        .from('chat_users')
        .select('id, phone, name, full_name')
        .eq('id', chatUserId)
        .maybeSingle();
      if (u) {
        phone = phone || u.phone || null;
        fullName = fullName || u.full_name || u.name || null;
      }
    } else if (phone) {
      const { data: u } = await supabase
        .from('chat_users')
        .select('id, name, full_name')
        .eq('phone', phone)
        .maybeSingle();
      if (u) {
        chatUserId = u.id;
        fullName = fullName || u.full_name || u.name || null;
      }
    }

    // Insert submission
    const { data: sub, error: subErr } = await supabase
      .from('telegram_form_submissions')
      .insert({
        form_id: form.id,
        chat_id: 0,
        source: 'web',
        status: 'completed',
        completed_at: new Date().toISOString(),
        chat_user_id: chatUserId,
        phone,
        full_name: fullName,
      })
      .select('id')
      .single();
    if (subErr || !sub) {
      return new Response(JSON.stringify({ error: subErr?.message ?? 'submission failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert answers
    if (body.answers.length) {
      const rows = body.answers
        .filter((a) => a.field_id)
        .map((a) => ({
          submission_id: sub.id,
          field_id: a.field_id,
          value_text: a.value_text ?? null,
          file_url: a.file_url ?? null,
          file_mime: a.file_mime ?? null,
        }));
      if (rows.length) {
        await supabase.from('telegram_form_answers').insert(rows);
      }
    }

    // Build summary for CRM / lead
    const { data: fields } = await supabase
      .from('telegram_form_fields')
      .select('id, label, order_index')
      .eq('form_id', form.id)
      .order('order_index');
    const labelMap = new Map((fields ?? []).map((f) => [f.id, f.label]));
    const summaryLines = body.answers.map((a) => {
      const label = labelMap.get(a.field_id) || a.field_id;
      const val = a.value_text ?? a.file_url ?? '—';
      return `${label}: ${val}`;
    });
    const summary = `📝 فرم: ${form.title}\n${summaryLines.join('\n')}`;

    // Create CRM note if linked to a chat user
    let crmNoteId: string | null = null;
    if (chatUserId) {
      const { data: note } = await supabase
        .from('crm_notes')
        .insert({
          user_id: chatUserId,
          type: 'form_submission',
          content: summary,
          created_by: `form:${form.title}`,
          status: 'new',
        })
        .select('id')
        .single();
      crmNoteId = note?.id ?? null;
    }

    // Create lead_request if phone is provided
    let leadRequestId: string | null = null;
    if (phone) {
      const answersJson: Record<string, unknown> = {};
      for (const a of body.answers) {
        const label = labelMap.get(a.field_id) || a.field_id;
        answersJson[label] = a.value_text ?? a.file_url ?? null;
      }
      const { data: lr } = await supabase
        .from('lead_requests')
        .insert({
          phone,
          name: fullName,
          answers: { source: 'web_form', form_id: form.id, form_title: form.title, ...answersJson },
          status: 'new',
        })
        .select('id')
        .single();
      leadRequestId = lr?.id ?? null;
    }

    // Backfill submission with crm/lead refs
    if (crmNoteId || leadRequestId) {
      await supabase
        .from('telegram_form_submissions')
        .update({ crm_note_id: crmNoteId, lead_request_id: leadRequestId })
        .eq('id', sub.id);
    }

    return new Response(JSON.stringify({
      ok: true,
      submission_id: sub.id,
      crm_note_id: crmNoteId,
      lead_request_id: leadRequestId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
