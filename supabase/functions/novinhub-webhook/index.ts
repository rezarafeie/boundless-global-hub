import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { db, processEnrollmentQueue } from '../_shared/social-enrollment.ts';

const schema = z.object({ type: z.enum(['autoform_completed', 'message_created', 'leed_created', 'revalidate']), user_id: z.union([z.string(), z.number()]).optional(), payload: z.record(z.unknown()) });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const secret = Deno.env.get('NOVINHUB_ENROLLMENT_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'Webhook not configured' }, 503);
  const supplied = new URL(req.url).searchParams.get('key') || req.headers.get('x-webhook-secret');
  if (!supplied || supplied !== secret) return json({ error: 'Unauthorized' }, 401);
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  try {
    const text = await req.text();
    if (text.length > 100000) return json({ error: 'Payload too large' }, 413);
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) return json({ error: 'Invalid NovinHub event' }, 400);
    const event = parsed.data;
    if (!['autoform_completed', 'message_created'].includes(event.type)) return json({ accepted: true, ignored: true });
    const id = event.payload.id ?? event.payload.message_id ?? event.payload.response_id;
    const material = id != null ? JSON.stringify([event.type, event.user_id, event.payload.account_id ?? event.payload.account, id]) : JSON.stringify(event);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
    const eventKey = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const { error } = await db().from('social_enrollment_events').insert({ event_key: eventKey, event_type: event.type, payload: event });
    if (error && error.code !== '23505') return json({ error: 'Event queue unavailable' }, 503);
    EdgeRuntime.waitUntil(processEnrollmentQueue().catch(() => {}));
    return json({ accepted: true, duplicate: error?.code === '23505' });
  } catch { return json({ error: 'Invalid event or unavailable queue' }, 400); }
});