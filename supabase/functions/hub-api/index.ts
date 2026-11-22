import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { authorizeHub, HubError, parseHubUser, parseAction, effectiveCoursePrice, validateAnswers, resultHtml } from '../_shared/hub-policy.ts';
import { buildStatus, completeMission } from '../_shared/gamification.ts';
import { HubEsanj } from './esanj.ts';
import { courseCover } from './course-images.ts';
import { handleAuth } from './auth.ts';

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-hub-user, x-hub-source`, 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

type User = { id: number; email: string; name: string; phone: string | null; hub_user_id: string };

export async function handleHub(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const secret = Deno.env.get('HUB_SHARED_SECRET');
  if (!url || !serviceKey || !anonKey) return json({ data: { error: 'سرویس هاب تنظیم نشده است' } }, 503);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let user: User | null = null;
  let action = 'unknown';
  let status = 200;
  let outcome = 'success';
  const checked = async (query: PromiseLike<any>) => {
    const { data, error } = await query;
    if (error) throw new HubError(500, 'ذخیره یا دریافت اطلاعات انجام نشد');
    return data;
  };
  // Every list is fully paginated; never silently return the API's first 1000 rows.
  const all = async (query: () => any) => {
    const rows: any[] = [];
    for (let offset = 0; ; offset += 500) {
      const page = await checked(query().range(offset, offset + 499));
      rows.push(...page);
      if (page.length < 500) return rows;
    }
  };
  const invoke = async (name: string, body: Record<string, unknown>, extra: Record<string, string> = {}) => {
    const response = await fetch(`${url}/functions/v1/${name}`, {
      method: 'POST', headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey, 'Content-Type': 'application/json', ...extra },
      body: JSON.stringify(body), signal: AbortSignal.timeout(90000),
    });
    const result = await response.json();
    if (!response.ok || result.success === false || result.error) throw new HubError(502, 'سرویس آکادمی درخواست را انجام نداد');
    return result;
  };
  const course = async (slug: string) => {
    const row = await checked(db.from('courses').select('*').eq('slug', slug).eq('is_active', true).maybeSingle());
    if (!row) throw new HubError(404, 'دوره یافت نشد');
    return row;
  };
  const courseShape = (row: any) => ({
    slug: row.slug, title: row.title, summary: row.description || '', image_url: courseCover(row.slug, row.title),
    category: null, badge: null, is_free: effectiveCoursePrice(row) === 0,
    is_coming_soon: Boolean(row.launch_date && new Date(row.launch_date).getTime() > Date.now()), price_toman: effectiveCoursePrice(row),
  });
  const paidEnrollment = async (uid: number, courseId: string) => checked(db.from('enrollments').select('id')
    .eq('chat_user_id', uid).eq('course_id', courseId).eq('payment_status', 'completed').order('created_at', { ascending: false }).limit(1).maybeSingle());
  const requireAccess = async (uid: number, row: any) => {
    if (!(await paidEnrollment(uid, row.id))) throw new HubError(403, 'ابتدا در این دوره ثبت‌نام کنید');
    const access = await buildStatus(uid, row.id);
    if (access.enabled && (!access.window || (access.window.status !== 'completed' &&
      (access.window.status !== 'active' || new Date(access.window.expires_at).getTime() <= Date.now())))) {
      throw new HubError(403, 'مهلت دسترسی به دوره پایان یافته است');
    }
  };
  const esanj = new HubEsanj(invoke);
  const test = async (slug: string) => {
    const row = await checked(db.from('tests').select('*').eq('slug', slug).eq('is_active', true).maybeSingle());
    if (!row) throw new HubError(404, 'آزمون یافت نشد');
    return row;
  };
  const testShape = (row: any) => ({ id: row.id, slug: row.slug, title: row.title, description: row.description || '', duration_min: null, question_count: null });
  try {
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    action = parts.at(-1) || 'unknown';
    await authorizeHub(req.headers.get('Authorization'), secret);
    if (req.headers.has('X-Hub-Source') && req.headers.get('X-Hub-Source') !== 'rafiei-hub') throw new HubError(400, 'منبع درخواست معتبر نیست');
    if (action === 'health') {
      if (req.method !== 'GET') throw new HubError(405, 'روش درخواست معتبر نیست');
      return json({ data: { ok: true } });
    }
    if (req.method !== 'POST') throw new HubError(405, 'روش درخواست معتبر نیست');
    if (Number(req.headers.get('Content-Length')) > 65536) throw new HubError(413, 'حجم درخواست بیش از حد مجاز است');
    const text = await req.text();
    if (text.length > 65536) throw new HubError(413, 'حجم درخواست بیش از حد مجاز است');
    let body: unknown;
    try { body = text ? JSON.parse(text) : {}; } catch { throw new HubError(400, 'بدنه درخواست معتبر نیست'); }
    if (action.startsWith('auth.') || action === 'account.link' || action === 'account.resolve') {
      const data = await handleAuth(action, body, req, { db, onUser: async (id) => {
        user = await checked(db.from('chat_users').select('id,email,name,phone,hub_user_id').eq('id', id).single());
      } });
      return json({ data });
    }
    const parsed = parseAction(action, body);
    const p = parsed.payload;
    const publicAction = ['courses.list', 'course.get', 'tests.list', 'test.get'].includes(action);
    if (!publicAction || req.headers.has('X-Hub-User')) {
      const identity = parseHubUser(req.headers.get('X-Hub-User'));
      const resolved = await db.rpc('hub_resolve_user', { p_hub_user_id: identity.hub_user_id, p_email: identity.email, p_name: identity.name });
      if (resolved.error || !resolved.data) throw new HubError(409, 'اتصال حساب هاب به آکادمی انجام نشد؛ با پشتیبانی تماس بگیرید');
      user = resolved.data as User;
    }
    let data: unknown;
    if (parsed.action === 'courses.list') {
      data = (await all(() => db.from('courses').select('*').eq('is_active', true).order('id'))).map(courseShape);
    } else if (parsed.action === 'course.get') {
      const row = await course(p.slug);
      let unlocked = false;
      if (user) {
        try { await requireAccess(user.id, row); unlocked = true; } catch (error) { if (!(error instanceof HubError) || error.status !== 403) throw error; }
      }
      const sections = await all(() => db.from('course_sections').select('id,title,order_index').eq('course_id', row.id).order('order_index').order('id'));
      const lessons = await all(() => db.from('course_lessons').select('*').eq('course_id', row.id).order('order_index').order('id'));
      const sectionOrder = new Map(sections.map((s: any, i: number) => [s.id, i]));
      lessons.sort((a, b) => Number(sectionOrder.get(a.section_id) ?? 9999) - Number(sectionOrder.get(b.section_id) ?? 9999) || a.order_index - b.order_index || a.id.localeCompare(b.id));
      data = { ...courseShape(row), lessons: lessons.map(l => ({ id: l.id, title: l.title,
        body: unlocked ? l.content : '', video_url: unlocked ? l.video_url : null, file_url: unlocked ? l.file_url : null,
        duration_min: l.duration, is_preview: false, section: sections.find((s: any) => s.id === l.section_id)?.title || '',
      })) };
    } else if (parsed.action === 'tests.list') {
      data = (await all(() => db.from('tests').select('*').eq('is_active', true).order('id'))).map(testShape);
    } else if (parsed.action === 'test.get') {
      const row = await test(p.slug);
      const questions = await esanj.questionnaire(row.test_id);
      data = { slug: row.slug, title: row.title, description: row.description || '', duration_min: null, questions };
    } else {
      if (!user) throw new HubError(400, 'اطلاعات کاربر هاب الزامی است');
      const currentUser = user;
      if (parsed.action === 'me.enrollments') {
        const rows = await all(() => db.from('enrollments').select('course_id,courses(slug,title)').eq('chat_user_id', currentUser.id).eq('payment_status', 'completed').order('id'));
        data = [...new Map(rows.filter(r => r.courses).map(r => [r.course_id, { ...r.courses, image_url: courseCover(r.courses.slug, r.courses.title) }])).values()];
      } else if (parsed.action === 'course.enroll') {
        const row = await course(p.slug);
        if (await paidEnrollment(user.id, row.id)) data = { enrolled: true };
        else if (effectiveCoursePrice(row) === 0) {
          const result = await invoke('create-enrollment', { course_id: row.id, chat_user_id: user.id, full_name: user.name,
            email: user.email, phone: user.phone, payment_amount: 0, payment_method: 'free', force_create: true },
          { 'x-hub-internal-auth': req.headers.get('Authorization') || '' });
          const saved = await checked(db.from('enrollments').select('chat_user_id,payment_status').eq('id', result.enrollment?.id).single());
          if (saved.chat_user_id !== user.id || saved.payment_status !== 'completed') throw new HubError(502, 'ثبت‌نام تایید نشد');
          data = { enrolled: true };
        } else {
          const [firstName, ...last] = user.name.split(' ');
          const result = await invoke('rafieipay-request', { courseSlug: row.slug, firstName, lastName: last.join(' '),
            email: user.email, phone: user.phone, userId: user.id, customAmount: effectiveCoursePrice(row), customerMetadata: { source: 'rafiei-hub' } });
          if (!result.enrollmentId || typeof result.paymentUrl !== 'string') throw new HubError(502, 'لینک پرداخت دریافت نشد');
          await checked(db.from('enrollments').update({ chat_user_id: user.id }).eq('id', result.enrollmentId).eq('email', user.email));
          data = { payment_url: result.paymentUrl };
        }
      } else if (parsed.action === 'me.progress') {
        const row = await course(p.slug);
        data = (await all(() => db.from('user_lesson_progress').select('lesson_id').eq('user_id', currentUser.id).eq('course_id', row.id).eq('is_completed', true).order('id'))).map(r => r.lesson_id);
      } else if (parsed.action === 'lesson.complete' || parsed.action === 'lesson.uncomplete') {
        const lesson = await checked(db.from('course_lessons').select('course_id').eq('id', p.lesson_id).maybeSingle());
        if (!lesson) throw new HubError(404, 'درس یافت نشد');
        const row = await checked(db.from('courses').select('*').eq('id', lesson.course_id).eq('is_active', true).single());
        await requireAccess(user.id, row);
        const complete = parsed.action === 'lesson.complete';
        const now = new Date().toISOString();
        await checked(db.from('user_lesson_progress').upsert({ user_id: user.id, course_id: row.id, lesson_id: p.lesson_id,
          is_completed: complete, completed_at: complete ? now : null, updated_at: now, last_accessed_at: now }, { onConflict: 'user_id,lesson_id' }));
        if (complete) await completeMission(user.id, row.id, p.lesson_id);
        data = { ok: true };
      } else if (parsed.action === 'test.submit') {
        const row = await test(p.slug);
        const currentYear = Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Tehran', year: 'numeric' }).format(new Date()));
        const age = currentYear - p.birth_year;
        if (age < 1 || age > 125) throw new HubError(400, 'سال تولد میلادی معتبر نیست');
        const questions = await esanj.questionnaire(row.test_id);
        const answers = validateAnswers(questions, p.answers);
        const uuid = crypto.randomUUID();
        let attempt: any;
        if (Number(row.price) > 0) {
          const entitlement = await checked(db.from('test_enrollments').select('id').eq('test_id', row.id).eq('user_id', user.id)
            .eq('payment_status', 'completed').is('esanj_uuid', null).order('created_at').limit(1).maybeSingle());
          if (!entitlement) throw new HubError(402, 'برای این آزمون ابتدا پرداخت را انجام دهید');
          attempt = await checked(db.from('test_enrollments').update({ user_id: user.id, esanj_uuid: uuid, birth_year: p.birth_year,
            sex: p.sex, enrollment_status: 'in_progress', test_started_at: new Date().toISOString() }).eq('id', entitlement.id).is('esanj_uuid', null).select().maybeSingle());
          if (!attempt) throw new HubError(409, 'این آزمون در حال انجام است');
        } else {
          attempt = await checked(db.from('test_enrollments').insert({ test_id: row.id, user_id: user.id, email: user.email,
            full_name: user.name, phone: user.phone, payment_amount: 0, payment_status: 'completed', payment_method: 'free',
            enrollment_status: 'in_progress', esanj_uuid: uuid, birth_year: p.birth_year, sex: p.sex, test_started_at: new Date().toISOString() }).select().single());
        }
        let employeeId: number;
        try { employeeId = await esanj.employee(user, p.birth_year, p.sex); }
        catch (error) {
          await checked(db.from('test_enrollments').update({ enrollment_status: 'failed' }).eq('id', attempt.id).eq('user_id', user.id));
          throw error;
        }
        await checked(db.from('test_enrollments').update({ esanj_employee_id: employeeId }).eq('id', attempt.id).eq('user_id', user.id));
        await esanj.submit(row.test_id, uuid, employeeId, age, p.sex, answers);
        const html = await esanj.result(uuid);
        await checked(db.from('test_enrollments').update({ result_data: { response: html, result_html: html }, enrollment_status: 'completed', test_completed_at: new Date().toISOString() }).eq('id', attempt.id).eq('user_id', user.id));
        data = { attempt_id: attempt.id, result_html: html };
      } else if (parsed.action === 'me.tests') {
        data = (await all(() => db.from('test_enrollments').select('id,created_at,tests(slug,title)').eq('user_id', currentUser.id).order('created_at', { ascending: false }).order('id')))
          .filter(r => r.tests).map(r => ({ attempt_id: r.id, slug: r.tests.slug, title: r.tests.title, created_at: r.created_at }));
      } else if (parsed.action === 'test.result') {
        const attempt = await checked(db.from('test_enrollments').select('*').eq('id', p.attempt_id).eq('user_id', user.id).maybeSingle());
        if (!attempt || attempt.payment_status !== 'completed') throw new HubError(404, 'نتیجه آزمون یافت نشد');
        if (attempt.result_data?.result_html || attempt.result_data?.response) data = { result_html: resultHtml(attempt.result_data) };
        else {
          if (!attempt.esanj_uuid) throw new HubError(409, 'آزمون هنوز انجام نشده است');
          const html = await esanj.result(attempt.esanj_uuid);
          await checked(db.from('test_enrollments').update({ result_data: { response: html, result_html: html }, enrollment_status: 'completed', test_completed_at: new Date().toISOString() }).eq('id', attempt.id).eq('user_id', user.id));
          data = { result_html: html };
        }
      } else if (parsed.action === 'support.create') {
        const room = await checked(db.from('support_rooms').select('id,thread_type_id').eq('is_active', true).eq('is_default', true).order('id').limit(1).maybeSingle());
        if (!room) throw new HubError(503, 'اتاق پشتیبانی فعال نیست');
        const ticket = await checked(db.from('support_conversations').insert({ user_id: user.id, support_room_id: room.id,
          thread_type_id: room.thread_type_id, status: 'open', priority: 'normal', subject: p.subject, initial_message: p.message,
          last_message_at: new Date().toISOString() }).select('id').single());
        await checked(db.from('messenger_messages').insert({ sender_id: user.id, recipient_id: 1, conversation_id: ticket.id,
          message: `${p.subject}\n\n${p.message}`, message_type: 'text', unread_by_support: true }));
        data = { id: ticket.id };
      } else if (parsed.action === 'me.tickets') {
        data = await all(() => db.from('support_conversations').select('id,subject,initial_message,status,created_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }).order('id'));
        data = (data as any[]).map(r => ({ id: r.id, subject: r.subject || '', message: r.initial_message || '', status: r.status, created_at: r.created_at }));
      }
    }
    return json({ data });
  } catch (error) {
    status = error instanceof HubError ? error.status : 500;
    outcome = error instanceof HubError ? error.message : 'خطای داخلی سرویس هاب';
    return json({ data: { error: outcome } }, status);
  } finally {
    // Log outcomes, not credentials, answer contents, HTML or customer contact details.
    const metadata = { source: 'rafiei-hub', action, result: outcome, status };
    if (user) {
      const { error } = await db.rpc('log_user_activity', { p_user_id: user.id, p_event_type: 'hub_api', p_reference: action, p_metadata: metadata });
      if (error) console.error('Hub activity log failed', { code: error.code });
    } else {
      const safeAction = /^[a-z.]{1,60}$/.test(action) ? action : 'unknown';
      const { error } = await db.from('analytics_events').insert({ session_id: crypto.randomUUID(), path: `/api/public/hub/${safeAction}`, source: 'rafiei-hub', event_type: `hub_api_${status}` });
      if (error) console.error('Hub analytics log failed', { code: error.code });
    }
  }
}

if (import.meta.main) Deno.serve(handleHub);