import { createClient } from 'npm:@supabase/supabase-js@2';
import { novinhub } from './novinhub.ts';

export const db = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase connection unavailable');
  return createClient(url, key);
};

export function valueAt(obj: any, path: string): any {
  return path.split('.').reduce((v, key) => v?.[key], obj);
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[^0-9]/g, '');
  const local = digits.replace(/^(0098|98)/, '');
  return /^9\d{9}$/.test(local) ? `0${local}` : local;
}

export function fieldsFrom(payload: any, mapping: Record<string, string>) {
  const answers: Record<string, unknown> = {};
  for (const a of Array.isArray(payload.answers) ? payload.answers : []) {
    const key = a.field_id ?? a.key ?? a.name ?? a.question_id;
    if (key != null) answers[String(key)] = a.value ?? a.answer ?? a.text;
  }
  const input = { ...payload, answers: Array.isArray(payload.answers) ? answers : payload.answers };
  const take = (key: string) => String(valueAt(input, mapping[key] || key) ?? '').trim();
  let name = take('name'), phone = normalizePhone(take('phone')), email = take('email').toLowerCase();
  // NovinHub auto-forms deliver answers as an ordered list of user messages; auto-detect fields.
  const texts: string[] = [];
  const lists = [payload.messages, payload.auto_form_messages, payload.answers, payload.responses];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const m of list) {
      if (m && (m.direction === 'out' || m.is_outgoing || m.is_auto_response)) continue;
      const t = typeof m === 'string' ? m : (m?.text ?? m?.content ?? m?.answer ?? m?.value);
      if (t != null && String(t).trim()) texts.push(String(t).trim());
    }
    if (texts.length) break;
  }
  const names: string[] = [];
  for (const t of texts) {
    const asPhone = normalizePhone(t);
    if (/^09\d{9}$/.test(asPhone)) { if (!/^09\d{9}$/.test(phone)) phone = asPhone; continue; }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { if (!email.includes('@')) email = t.toLowerCase(); continue; }
    if (!/^\d+$/.test(normalizePhone(t) || 'x') && t.length <= 60) names.push(t);
  }
  if (!name && names.length) name = names.slice(0, 2).join(' ');
  return { name, phone, email };
}

export function triggerMatches(rule: any, event: any): boolean {
  if (!rule.enabled || rule.event_type !== event.type) return false;
  const p = event.payload;
  if (event.type === 'autoform_completed') {
    return String(p.auto_form_id ?? p.autoform_id ?? p.automation_form_id ?? p.automationForm?.id ?? p.auto_form?.id ?? p.form_id ?? p.form?.id ?? '') === String(rule.trigger_value).trim();
  }
  if (p.is_auto_response || p.direction === 'out' || p.is_outgoing) return false;
  const text = String(p.text ?? p.content ?? '').normalize('NFKC').trim().toLowerCase();
  return text === rule.trigger_value.normalize('NFKC').trim().toLowerCase();
}

export function renderReply(template: string, values: Record<string, string>): string {
  return template.replace(/\{(name|course_title|telegram_link|bale_link|enrollment_link)\}/g, (_, k) => values[k] || '');
}

export const eligibleFreeCourse = (price: unknown) => price !== null && price !== undefined && Number(price) === 0;

export async function requireSocialAdmin(req: Request, client: ReturnType<typeof db>) {
  const token = req.headers.get('x-session-token');
  let userId: number | null = null;
  if (token) {
    const { data, error } = await client.from('user_sessions').select('user_id').eq('session_token', token)
      .eq('is_active', true).gt('last_activity', new Date(Date.now() - 86400000).toISOString()).maybeSingle();
    if (!error && data) userId = data.user_id;
  }
  if (!userId) {
    const bearer = (req.headers.get('authorization') || token)?.replace(/^Bearer\s+/i, '');
    if (bearer) {
      const { data: auth } = await client.auth.getUser(bearer);
      if (auth.user?.id) {
        const { data: academy } = await client.from('academy_users').select('role').eq('id', auth.user.id).maybeSingle();
        if (academy?.role === 'admin') return;
      }
    }
    throw new Error('دسترسی مدیریت معتبر نیست');
  }
  const { data: roles } = await client.from('user_roles').select('role_name').eq('user_id', userId).eq('is_active', true)
    .in('role_name', ['admin', 'social_admin', 'enrollments_manager']);
  if (roles?.length) return;
  // Reuse the established server-side administrator assertion for legacy sessions.
  const { data: adminId, error: adminError } = await client.rpc('assert_webinar_followup_admin', { p_session_token: token });
  if (adminError || !adminId) throw new Error('دسترسی مدیریت معتبر نیست');
}

async function invoke(name: string, body: unknown) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase invocation unavailable');
  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(120000),
  });
  const data = await res.json();
  if (!res.ok || data.error || data.success === false) throw new Error(`${name}: ${data.error || res.status}`);
  return data;
}

export async function processEnrollmentQueue(limit = 10) {
  const client = db();
  let processed = 0;
  for (let n = 0; n < limit; n++) {
    const { data: jobs, error } = await client.rpc('claim_social_enrollment_event');
    if (error) throw error;
    const job = jobs?.[0];
    if (!job) break;
    const save = async (data: any) => {
      const { error } = await client.from('social_enrollment_events').update(data).eq('id', job.id);
      if (error) throw error;
    };
    try {
      const event = job.payload;
      const p = event.payload;
      const accountId = String(p.account_id ?? p.account?.id ?? p.messages?.[0]?.account_id ?? '');
      const { data: account } = await client.from('social_accounts').select('*').eq('novinhub_account_id', accountId)
        .eq('provider', 'instagram').eq('is_active', true).maybeSingle();
      if (!account || String(p.social_user_id ?? p.socialUser?.id ?? '') === String(account.meta?.social_user_id ?? '__own__')) {
        await save({ status: 'ignored', last_error: 'Unrecognized account or outgoing event' }); continue;
      }
      const { data: rules, error: ruleErr } = await client.from('social_enrollment_rules').select('*').eq('account_id', account.id).eq('enabled', true);
      if (ruleErr) throw ruleErr;
      const matched = (rules || []).filter(r => triggerMatches(r, event));
      if (!matched.length) { await save({ status: 'ignored' }); continue; }
      if (matched.length !== 1) throw new Error('بیش از یک قانون با رویداد مطابقت دارد');
      const rule = matched[0];
      await save({ rule_id: rule.id });
      const conversationId = String(p.conversation_id ?? p.conversation?.id ?? p.messages?.[0]?.conversation_id ?? '');
      if (!/^\d+$/.test(conversationId)) throw new Error('شناسه گفتگو در رویداد موجود نیست');
      // Verify the target conversation belongs to the configured page before replying.
      const remote = await novinhub.getConversation(conversationId);
      const conv = remote?.data ?? remote;
      if (String(conv.account_id ?? conv.account?.id ?? '') !== accountId) throw new Error('صفحه گفتگو با قانون مطابقت ندارد');
      const person = fieldsFrom(p, rule.field_mapping);
      const { data: course, error: courseErr } = await client.from('courses').select('id,title,slug,price').eq('id', rule.course_id).single();
      if (courseErr) throw courseErr;
      if (!eligibleFreeCourse(course.price)) throw new Error('ثبت‌نام مستقیم فقط برای دوره رایگان مجاز است؛ دوره پولی به پرداخت نیاز دارد');
      if (!person.name || !/^09\d{9}$/.test(person.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) {
        if (!job.reply_sent_at) await novinhub.reply(conversationId, rule.missing_fields_message);
        await save({ status: 'needs_info', reply_sent_at: new Date().toISOString(), last_error: 'نام، موبایل یا ایمیل معتبر موجود نیست' });
        continue;
      }
      const [{ data: emailUser }, { data: phoneUser }] = await Promise.all([
        client.from('chat_users').select('id,phone,email').eq('email', person.email).maybeSingle(),
        client.from('chat_users').select('id,phone,email').eq('phone', person.phone).maybeSingle(),
      ]);
      if (emailUser && normalizePhone(emailUser.phone || '') !== person.phone) throw new Error('ایمیل و شماره موبایل با حساب موجود مطابقت ندارند؛ بررسی مدیر لازم است');
      if (phoneUser?.email && phoneUser.email.toLowerCase() !== person.email) throw new Error('ایمیل فرم با حساب شماره موبایل مطابقت ندارد؛ بررسی مدیر لازم است');
      if (emailUser && phoneUser && emailUser.id !== phoneUser.id) throw new Error('تعارض حساب ایمیل و موبایل؛ بررسی مدیر لازم است');
      const existingUser = phoneUser || emailUser;
      let enrollment: any;
      if (job.enrollment_id) {
        const { data, error } = await client.from('enrollments').select('*').eq('id', job.enrollment_id).single();
        if (error) throw error;
        enrollment = data;
      } else if (existingUser) {
        const { data, error } = await client.from('enrollments').select('*').eq('course_id', course.id)
          .eq('chat_user_id', existingUser.id).in('payment_status', ['completed', 'success']).order('created_at').limit(1).maybeSingle();
        if (error) throw error;
        enrollment = data;
      }
      if (!enrollment) {
        const result = await invoke('create-enrollment', {
          course_id: course.id, full_name: person.name, phone: person.phone, email: person.email,
          payment_amount: 0, payment_method: 'free', country_code: '+98', chat_user_id: existingUser?.id,
        });
        enrollment = result.enrollment;
      }
      if (!enrollment?.id || !enrollment.chat_user_id || !['completed', 'success'].includes(enrollment.payment_status)) {
        throw new Error('ثبت‌نام کامل نیست؛ فعال‌سازی پشتیبانی ارسال نشد');
      }
      await save({ enrollment_id: enrollment.id });
      if (!existingUser) {
        await client.from('chat_users').update({ signup_source: 'instagram_direct' }).eq('id', enrollment.chat_user_id).eq('signup_source', 'enrollment');
      }
      const activation = await invoke('support-activation-create', { user_id: enrollment.chat_user_id, course_id: course.id, enrollment_id: enrollment.id });
      const token = activation.activation?.activation_token;
      if (!token) throw new Error('کد فعال‌سازی ساخته نشد');
      const telegramLink = activation.activation.support_prefilled_link;
      if (!telegramLink) throw new Error('لینک پشتیبانی تلگرام ساخته نشد');
      // Use the configured support link returned by the website activation flow.
      const reply = renderReply(rule.reply_template, {
        name: person.name, course_title: course.title,
        telegram_link: telegramLink,
        bale_link: activation.bale_link || '',
        enrollment_link: `https://academy.rafiei.co/enroll/success?enrollment=${enrollment.id}`,
      });
      if (!job.reply_sent_at) await novinhub.reply(conversationId, reply);
      await save({ status: 'completed', reply_sent_at: job.reply_sent_at || new Date().toISOString(), last_error: null });
      processed++;
    } catch (e) {
      await save({ status: job.attempts >= 5 ? 'failed' : 'retry', last_error: (e as Error).message.slice(0, 500),
        next_attempt_at: new Date(Date.now() + job.attempts * 60000).toISOString() });
    }
  }
  return { processed };
}