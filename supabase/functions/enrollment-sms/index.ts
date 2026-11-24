import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { db, requireSocialAdmin } from '../_shared/social-enrollment.ts';
import { constantTimeEqual } from '../_shared/hub-policy.ts';
import { SMS_TEMPLATES, accessValid, courseStarted, hashCode, randomLoginCode, smsEligible, smsParameters, type SmsKind } from './policy.ts';

const settingsSchema = z.object({
  welcome_enabled: z.boolean(), activation_enabled: z.boolean(), start_enabled: z.boolean(),
  activation_delay_minutes: z.number().int().min(0).max(43200),
  start_delay_minutes: z.number().int().min(0).max(43200),
}).strict();
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('worker') }).strict(),
  z.object({ action: z.literal('test'), activation_id: z.string().uuid(), kind: z.enum(['welcome', 'activation', 'start']) }).strict(),
  z.object({ action: z.literal('get'), course_id: z.string().uuid() }).strict(),
  z.object({ action: z.literal('save'), course_id: z.string().uuid(), settings: settingsSchema }).strict(),
  z.object({ action: z.literal('login'), code: z.string().regex(/^[A-Za-z0-9]{10}$/) }).strict(),
]);

export async function processSms(client: ReturnType<typeof db>, send = fetch, test?: { activation_id: string; kind: SmsKind }) {
  const { data: candidates, error } = test ? { data: [test], error: null } : await client.rpc('enrollment_sms_candidates');
  if (error) throw error;
  const summary: Record<string, number> = { sent: 0, failed: 0, skipped: 0, unknown: 0 };
  for (const candidate of candidates ?? []) {
    const kind = candidate.kind as SmsKind;
    if (!(kind in SMS_TEMPLATES)) continue;
    const { data: activation, error: activationError } = await client.from('support_activations').select('*').eq('id', candidate.activation_id).maybeSingle();
    if (activationError) throw activationError;
    if (!activation) continue;
    const [{ data: enrollment, error: enrollmentError }, { data: settings, error: settingsError }] = await Promise.all([
      client.from('enrollments').select('*').eq('id', activation.enrollment_id).maybeSingle(),
      client.from('course_enrollment_sms_settings').select('*').eq('course_id', activation.course_id).maybeSingle(),
    ]);
    if (enrollmentError || settingsError) throw enrollmentError || settingsError;
    if (!enrollment || (!test && (!settings?.[`${kind}_enabled`] || Date.parse(enrollment.created_at) < Date.parse(settings.enabled_from)))) continue;
    const { data: progress, error: progressError } = await client.from('user_lesson_progress').select('is_opened,is_completed,total_time_spent').eq('user_id', activation.user_id).eq('course_id', activation.course_id);
    if (progressError) throw progressError;
    if (!smsEligible(kind, activation, enrollment, courseStarted(progress ?? []))) continue;
    const elapsedFrom = kind === 'start' ? activation.activated_at : activation.created_at;
    const delay = kind === 'welcome' || test ? 0 : settings[`${kind}_delay_minutes`];
    if (Date.now() < Date.parse(elapsedFrom) + delay * 60000) continue;
    const { error: claimError } = await client.from('enrollment_sms_deliveries').insert({ enrollment_id: enrollment.id, kind });
    if (claimError?.code === '23505') continue;
    if (claimError) throw claimError;
    let status = 'failed', errorCode: string | null = null, messageId: string | null = null;
    try {
      const key = Deno.env.get('KAVENEGAR_API_KEY');
      if (!key) throw new Error('kavenegar_not_configured');
      const { data: course, error: courseError } = await client.from('courses').select('title,is_active').eq('id', activation.course_id).single();
      if (courseError) throw new Error('course_lookup_failed');
      if (!course?.is_active) throw new Error('course_inactive');
      let code = activation.activation_token;
      if (kind === 'start') {
        const [{ data: gam, error: gamError }, { data: window, error: windowError }] = await Promise.all([
          client.from('course_gamification_settings').select('enabled').eq('course_id', activation.course_id).maybeSingle(),
          client.from('course_access_windows').select('status,expires_at').eq('user_id', activation.user_id).eq('course_id', activation.course_id).maybeSingle(),
        ]);
        if (gamError || windowError) throw new Error('access_lookup_failed');
        if (!accessValid(gam, window)) { status = 'skipped'; throw new Error('course_access_unavailable'); }
        code = randomLoginCode();
        const { error: tokenError } = await client.from('course_sms_login_tokens').insert({
          token_hash: await hashCode(code), enrollment_id: enrollment.id, expires_at: new Date(Date.now() + 86400000).toISOString(),
        });
        if (tokenError) throw new Error('login_link_not_saved');
      }
      const params = smsParameters(kind, enrollment.full_name || 'دانشجو', course.title, code, enrollment.phone || '');
      // Fresh guard immediately before paid provider work: activation/progress can change during processing.
      const { data: fresh, error: freshError } = await client.from('support_activations').select('*').eq('id', activation.id).single();
      const { data: freshEnrollment, error: paymentError } = await client.from('enrollments').select('*').eq('id', enrollment.id).single();
      const { data: freshProgress, error: freshProgressError } = await client.from('user_lesson_progress').select('is_opened,is_completed,total_time_spent').eq('user_id', activation.user_id).eq('course_id', activation.course_id);
      if (freshError || paymentError || freshProgressError) throw new Error('fresh_eligibility_lookup_failed');
      if (!smsEligible(kind, fresh, freshEnrollment, courseStarted(freshProgress ?? []))) { status = 'skipped'; throw new Error('recipient_no_longer_eligible'); }
      let response: Response;
      try {
        response = await send(`https://api.kavenegar.com/v1/${key}/verify/lookup.json`, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params,
          signal: AbortSignal.timeout(15000),
        });
      } catch { status = 'unknown'; throw new Error('provider_outcome_unknown_no_auto_retry'); }
      const body = await response.json().catch(() => null);
      if (response.ok && body?.return?.status === 200 && body?.entries?.[0]?.messageid) {
        status = 'sent'; messageId = String(body.entries[0].messageid);
      } else {
        status = response.status >= 500 || !body ? 'unknown' : 'failed';
        errorCode = `provider_${body?.return?.status ?? response.status}`;
      }
    } catch (e) { errorCode = e instanceof Error ? e.message.slice(0, 100) : 'delivery_failed'; }
    const { error: saveError } = await client.from('enrollment_sms_deliveries').update({ status, error_code: errorCode, provider_message_id: messageId }).eq('enrollment_id', enrollment.id).eq('kind', kind);
    if (saveError) throw saveError;
    await client.from('support_activation_followup_log').insert({ support_activation_id: activation.id, course_id: activation.course_id,
      user_id: activation.user_id, stage: 0, channel: 'sms', status, error_message: errorCode,
      payload: { kind, template: SMS_TEMPLATES[kind], provider_message_id: messageId, is_test: Boolean(test) } });
    summary[status] = (summary[status] ?? 0) + 1;
  }
  return summary;
}

export async function handleEnrollmentSms(req: Request) {
  const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-session-token, x-enrollment-sms-secret`,
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === 'OPTIONS') return json({});
  if (req.method !== 'POST') return json({ error: 'روش درخواست معتبر نیست' }, 405);
  if (Number(req.headers.get('Content-Length')) > 4096) return json({ error: 'درخواست بیش از حد بزرگ است' }, 413);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'اطلاعات درخواست معتبر نیست' }, 400);
  try {
    const client = db(); const b = parsed.data;
    if (b.action === 'login') {
      const session = `session_${crypto.randomUUID()}_${crypto.randomUUID()}`;
      const { data, error } = await client.rpc('consume_course_sms_login', { p_hash: await hashCode(b.code), p_session: session });
      if (error) throw error;
      if (!data) return json({ error: 'لینک منقضی شده، قبلاً استفاده شده یا دسترسی دوره فعال نیست؛ از صفحه ورود وارد شوید.' }, 410);
      return json({ data });
    }
    if (b.action === 'worker' || b.action === 'test') {
      const supplied = req.headers.get('x-enrollment-sms-secret');
      if (!supplied) return json({ error: 'دسترسی ارسال معتبر نیست' }, 403);
      const { data: key, error } = await client.rpc('enrollment_sms_worker_key');
      if (error || !key || !(await constantTimeEqual(supplied, key))) return json({ error: 'دسترسی ارسال معتبر نیست' }, 403);
      return json({ data: await processSms(client, fetch, b.action === 'test' ? { activation_id: b.activation_id, kind: b.kind } : undefined) });
    }
    try { await requireSocialAdmin(req, client); } catch { return json({ error: 'دسترسی مدیریت معتبر نیست' }, 403); }
    const { data: course, error: courseError } = await client.from('courses').select('id').eq('id', b.course_id).maybeSingle();
    if (courseError || !course) return json({ error: 'دوره یافت نشد' }, 404);
    if (b.action === 'save') {
      const { data, error } = await client.from('course_enrollment_sms_settings').upsert({ course_id: b.course_id, ...b.settings }, { onConflict: 'course_id' }).select().single();
      if (error) throw error;
      return json({ data });
    }
    const { data, error } = await client.from('course_enrollment_sms_settings').select('*').eq('course_id', b.course_id).maybeSingle();
    if (error) throw error;
    const { data: logs, error: logsError } = await client.from('enrollment_sms_deliveries').select('kind,status,error_code,created_at,enrollments!inner(course_id)').eq('enrollments.course_id', b.course_id).order('created_at', { ascending: false }).limit(10);
    if (logsError) throw logsError;
    return json({ data: data ?? { course_id: b.course_id, welcome_enabled: false, activation_enabled: false, start_enabled: false, activation_delay_minutes: 60, start_delay_minutes: 720 }, logs });
  } catch { return json({ error: 'ذخیره یا دریافت اطلاعات پیامک انجام نشد' }, 500); }
}
if (import.meta.main) Deno.serve(handleEnrollmentSms);