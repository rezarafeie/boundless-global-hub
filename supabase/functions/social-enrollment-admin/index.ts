import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { db, requireSocialAdmin, eligibleFreeCourse } from '../_shared/social-enrollment.ts';

const ruleSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(200), enabled: z.boolean(),
  account_id: z.string().uuid(), course_id: z.string().uuid(),
  event_type: z.enum(['autoform_completed', 'message_created']), trigger_value: z.string().trim().min(1).max(200),
  field_mapping: z.object({ name: z.string().min(1).max(200), phone: z.string().min(1).max(200), email: z.string().min(1).max(200) }),
  reply_template: z.string().min(1).max(3000), missing_fields_message: z.string().min(1).max(1000),
});

Deno.serve(async req => {
  const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-session-token`, 'Content-Type': 'application/json' };
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
  if (req.method === 'OPTIONS') return json({});
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const client = db();
  try { await requireSocialAdmin(req, client); } catch { return json({ error: 'دسترسی مدیریت معتبر نیست' }, 403); }
  try {
    const body = await req.json();
    if (body.action === 'list') {
      const [rules, events, accounts, courses] = await Promise.all([
        client.from('social_enrollment_rules').select('*').order('created_at', { ascending: false }),
        client.from('social_enrollment_events').select('id,event_type,status,rule_id,enrollment_id,attempts,last_error,created_at').order('created_at', { ascending: false }).limit(50),
        client.from('social_accounts').select('id,username').eq('provider', 'instagram').eq('is_active', true),
        client.from('courses').select('id,title,price').order('title'),
      ]);
      for (const result of [rules, events, accounts, courses]) if (result.error) throw result.error;
      return json({ rules: rules.data, events: events.data, accounts: accounts.data, courses: courses.data,
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/novinhub-webhook`,
        secret_configured: !!Deno.env.get('NOVINHUB_ENROLLMENT_WEBHOOK_SECRET') });
    }
    if (body.action === 'save') {
      const parsed = ruleSchema.safeParse(body.rule);
      if (!parsed.success) return json({ error: 'اطلاعات قانون کامل یا معتبر نیست' }, 400);
      const { id, ...rule } = parsed.data;
      const [{ data: course }, { data: account }] = await Promise.all([
        client.from('courses').select('price').eq('id', rule.course_id).single(),
        client.from('social_accounts').select('id').eq('id', rule.account_id).eq('provider', 'instagram').eq('is_active', true).single(),
      ]);
      if (!account || !course || !eligibleFreeCourse(course.price)) return json({ error: 'صفحه معتبر و دوره رایگان انتخاب کنید؛ دوره پولی نیازمند پرداخت است' }, 400);
      const { data: conflicts } = await client.from('social_enrollment_rules').select('id,trigger_value').eq('account_id', rule.account_id).eq('event_type', rule.event_type).eq('enabled', true);
      if (rule.enabled && conflicts?.some(r => r.id !== id && r.trigger_value.trim().toLowerCase() === rule.trigger_value.trim().toLowerCase())) {
        return json({ error: 'برای این فرم یا کلمه کلیدی قبلاً قانون فعال وجود دارد' }, 400);
      }
      const result = id ? await client.from('social_enrollment_rules').update(rule).eq('id', id) : await client.from('social_enrollment_rules').insert(rule);
      if (result.error) throw result.error;
      return json({ success: true });
    }
    if (body.action === 'retry') {
      const id = z.string().uuid().parse(body.id);
      const { error } = await client.from('social_enrollment_events').update({ status: 'retry', attempts: 0, next_attempt_at: new Date().toISOString() })
        .eq('id', id).in('status', ['failed', 'retry']);
      if (error) throw error;
      return json({ success: true });
    }
    return json({ error: 'عملیات نامعتبر' }, 400);
  } catch (e) { return json({ error: (e as Error).message }, 400); }
});