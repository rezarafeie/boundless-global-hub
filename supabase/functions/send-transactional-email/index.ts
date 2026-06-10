import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const SITE_NAME = 'boundless-global-hub'
const SENDER_DOMAIN = 'notify.academy.rafiei.co'
const FROM_DOMAIN = 'academy.rafiei.co'

const LOVABLE_EMAIL_URL = 'https://api.lovable.dev/v1/messaging/email/send'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

  if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
    console.error('Missing required environment variables')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!templateName) {
    return new Response(JSON.stringify({ error: 'templateName is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    return new Response(
      JSON.stringify({ error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const effectiveRecipient = template.to || recipientEmail
  if (!effectiveRecipient) {
    return new Response(JSON.stringify({ error: 'recipientEmail is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const normalizedEmail = effectiveRecipient.toLowerCase()

  // Suppression check (best-effort: skip silently if table missing)
  const { data: suppressed } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressed) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })
    return new Response(JSON.stringify({ success: false, reason: 'email_suppressed' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Get or create unsubscribe token (best-effort)
  let unsubscribeToken = generateToken()
  try {
    const { data: existingToken } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (existingToken?.token) {
      unsubscribeToken = existingToken.token
    } else {
      await supabase
        .from('email_unsubscribe_tokens')
        .upsert({ token: unsubscribeToken, email: normalizedEmail }, { onConflict: 'email', ignoreDuplicates: true })
    }
  } catch (e) {
    console.warn('Unsubscribe token handling skipped:', e)
  }

  const html = await renderAsync(React.createElement(template.component, templateData))
  const plainText = await renderAsync(React.createElement(template.component, templateData), { plainText: true })
  const resolvedSubject =
    typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  // Send directly via Lovable Email API
  try {
    const payload = {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
    }

    const resp = await fetch(LOVABLE_EMAIL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('Lovable email API error', { status: resp.status, body: errText.slice(0, 500) })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: `Email API ${resp.status}: ${errText.slice(0, 200)}`,
      })
      return new Response(JSON.stringify({ error: 'Failed to send email', status: resp.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'sent',
    })

    return new Response(JSON.stringify({ success: true, sent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Email send exception', err)
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: String(err).slice(0, 200),
    })
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
