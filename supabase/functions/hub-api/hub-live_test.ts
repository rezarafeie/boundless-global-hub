import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Explicit opt-in: these tests create real, clearly named QA registrations and tickets.
const enabled = Deno.env.get('HUB_API_LIVE_TESTS') === '1';
const base = 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api';
const user = { hub_user_id: `hub-qa-${crypto.randomUUID()}`, email: `hub-qa-${crypto.randomUUID()}@example.invalid`, name: 'Hub API QA' };
const other = { hub_user_id: `hub-qa-${crypto.randomUUID()}`, email: `hub-qa-${crypto.randomUUID()}@example.invalid`, name: 'Hub API isolation QA' };
let lessonId = '', attemptId = '';

async function call(action: string, payload: unknown = {}, identity = user, method = 'POST', authorize = true) {
  const secret = Deno.env.get('HUB_SHARED_SECRET');
  if (!secret) throw new Error('HUB_SHARED_SECRET is required for explicit live checks');
  const response = await fetch(`${base}/${action}`, {
    method, headers: { Authorization: authorize ? `Bearer ${secret}` : 'Bearer invalid-test-key',
      'Content-Type': 'application/json', 'X-Hub-Source': 'rafiei-hub',
      'X-Hub-User': encodeURIComponent(JSON.stringify(identity)) },
    body: method === 'GET' ? undefined : JSON.stringify(payload),
  });
  const result = await response.json();
  return { status: response.status, data: result.data, error: result.error };
}
const live = (name: string, fn: () => Promise<void>) => Deno.test({ name, ignore: !enabled, fn });

live('hosted health authenticates the shared secret and rejects mismatches with 401', async () => {
  assertEquals((await call('health', {}, user, 'GET')).data, { ok: true });
  assertEquals((await call('health', {}, user, 'GET', false)).status, 401);
});
live('hosted catalog returns real courses and protects unenrolled lesson URLs', async () => {
  const list = await call('courses.list');
  assertEquals(list.status, 200);
  assert(list.data.some((course: any) => course.slug === 'boundless-taste' && course.price_toman === 0));
  const detail = await call('course.get', { slug: 'boundless-taste' });
  assertEquals(detail.status, 200);
  assert(detail.data.lessons.length > 0);
  assert(detail.data.lessons.every((lesson: any) => lesson.video_url === null && lesson.file_url === null && lesson.body === ''));
  lessonId = detail.data.lessons[0].id;
  assertEquals((await call('lesson.complete', { lesson_id: lessonId })).status, 403);
});
live('free Hub enrollment without a phone saves and reads back under the mapped user', async () => {
  assertEquals((await call('course.enroll', { slug: 'boundless-taste' })).data, { enrolled: true });
  assertEquals((await call('course.enroll', { slug: 'boundless-taste' })).data, { enrolled: true });
  assert((await call('me.enrollments')).data.some((course: any) => course.slug === 'boundless-taste'));
  assertEquals((await call('me.enrollments', {}, other)).data, []);
  assertEquals((await call('me.enrollments', {}, { ...user, hub_user_id: crypto.randomUUID() })).status, 409);
});
live('lesson complete and uncomplete change the saved progress only for their owner', async () => {
  assertEquals((await call('lesson.complete', { lesson_id: lessonId })).data, { ok: true });
  assert((await call('me.progress', { slug: 'boundless-taste' })).data.includes(lessonId));
  assertEquals((await call('me.progress', { slug: 'boundless-taste' }, other)).data, []);
  assertEquals((await call('lesson.uncomplete', { lesson_id: lessonId })).data, { ok: true });
  assert(!(await call('me.progress', { slug: 'boundless-taste' })).data.includes(lessonId));
});
live('support creates a real existing-system ticket and reads back its message', async () => {
  const ticket = await call('support.create', { subject: 'Hub API integration verification', message: 'Dedicated Hub API test ticket.' });
  assertEquals(ticket.status, 200);
  assert((await call('me.tickets')).data.some((row: any) => row.id === ticket.data.id && row.message === 'Dedicated Hub API test ticket.'));
  assertEquals((await call('me.tickets', {}, other)).data, []);
});
live('paid course enrollment returns a real gateway URL without pretending payment succeeded', async () => {
  const result = await call('course.enroll', { slug: 'instagram' });
  assertEquals(result.status, 200);
  assert(typeof result.data.payment_url === 'string' && result.data.payment_url.startsWith('https://'));
  assert(!(await call('me.enrollments')).data.some((course: any) => course.slug === 'instagram'));
});
live('real Esanj questionnaire submission saves scored HTML before returning success', async () => {
  const tests = await call('tests.list');
  assertEquals(tests.status, 200);
  assert(tests.data.some((test: any) => test.slug === '-cmhq'));
  const questionnaire = await call('test.get', { slug: '-cmhq' });
  assertEquals(questionnaire.status, 200);
  const answers = Object.fromEntries(questionnaire.data.questions.map((q: any) => [q.id, q.options[0].value]));
  const result = await call('test.submit', { slug: '-cmhq', answers, birth_year: 2000, sex: 'male' });
  assertEquals(result.status, 200);
  assert(result.data.attempt_id && result.data.result_html.startsWith('<'));
  attemptId = result.data.attempt_id;
  assertEquals((await call('test.result', { attempt_id: attemptId })).data.result_html, result.data.result_html);
  assert((await call('me.tests')).data.some((test: any) => test.attempt_id === attemptId));
});
live('one Hub user cannot read another user’s scored test result', async () => {
  assert(attemptId.length > 0);
  assertEquals((await call('test.result', { attempt_id: attemptId }, other)).status, 404);
});