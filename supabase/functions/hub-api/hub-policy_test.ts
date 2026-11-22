import { assertEquals, assertRejects, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { authorizeHub, constantTimeEqual, effectiveCoursePrice, esanjBirthYear, HubError, mapQuestionnaire, parseAction, parseHubUser, resultHtml, validateAnswers } from '../_shared/hub-policy.ts';

Deno.test('every unauthorized Hub request fails with 401', async () => {
  for (const header of [null, '', 'Basic test-key', 'Bearer wrong-key', 'Bearer test-key extra']) {
    const error = await assertRejects(() => authorizeHub(header, 'test-key'), HubError);
    assertEquals((error as HubError).status, 401);
  }
});
Deno.test('missing configured secret fails closed with 401', async () => {
  const error = await assertRejects(() => authorizeHub('Bearer test-key', undefined), HubError);
  assertEquals((error as HubError).status, 401);
});
Deno.test('matching shared bearer token is authorized', async () => {
  await authorizeHub('Bearer test-key', 'test-key');
});
Deno.test('constant-time comparison distinguishes unequal tokens and lengths', async () => {
  assertEquals(await constantTimeEqual('test-key', 'test-key'), true);
  assertEquals(await constantTimeEqual('test-key', 'test-keX'), false);
  assertEquals(await constantTimeEqual('test-key', 'test-key-long'), false);
});
Deno.test('X-Hub-User URL-encoded JSON preserves identity and normalizes email', () => {
  const result = parseHubUser(encodeURIComponent(JSON.stringify({ hub_user_id: 'hub-123', email: 'Student@Example.com', name: 'دانشجو' })));
  assertEquals(result, { hub_user_id: 'hub-123', email: 'student@example.com', name: 'دانشجو' });
});
Deno.test('Hub users do not need a fabricated phone', () => {
  assertEquals(parseHubUser(encodeURIComponent(JSON.stringify({ hub_user_id: 'hub-123', email: 'student@example.com', name: 'دانشجو' }))).hub_user_id, 'hub-123');
});
Deno.test('malformed Hub identity is rejected with 400', () => {
  for (const value of [null, '%bad', '{}', encodeURIComponent(JSON.stringify({ hub_user_id: 'x', email: 'invalid', name: 'x' }))]) {
    assertEquals((assertThrows(() => parseHubUser(value), HubError) as HubError).status, 400);
  }
});
Deno.test('Hub identity cannot request an admin role', () => {
  assertThrows(() => parseHubUser(encodeURIComponent(JSON.stringify({ hub_user_id: 'x', email: 'x@example.com', name: 'x', role: 'admin' }))), HubError);
});
Deno.test('all 14 academy actions are recognized and validated', () => {
  const slug = { slug: 'boundless-taste' }, lesson = { lesson_id: 'b97c19b7-98d3-4891-b00f-93bfb7711487' };
  const examples = {
    'courses.list': {}, 'course.get': slug, 'me.enrollments': {}, 'course.enroll': slug, 'me.progress': slug,
    'lesson.complete': lesson, 'lesson.uncomplete': lesson, 'tests.list': {}, 'test.get': slug,
    'test.submit': { ...slug, answers: { '1': '2' }, birth_year: 2000, sex: 'male' }, 'me.tests': {},
    'test.result': { attempt_id: lesson.lesson_id }, 'support.create': { subject: 'موضوع', message: 'پیام' }, 'me.tickets': {},
  };
  assertEquals(Object.keys(examples).length, 14);
  for (const [action, body] of Object.entries(examples)) assertEquals(parseAction(action, body).action, action);
});
Deno.test('unknown action fails with 404', () => {
  assertEquals((assertThrows(() => parseAction('admin.delete', {}), HubError) as HubError).status, 404);
});
Deno.test('callers cannot supply another academy user ID or a payment amount', () => {
  assertThrows(() => parseAction('course.enroll', { slug: 'course', user_id: 99 }), HubError);
  assertThrows(() => parseAction('course.enroll', { slug: 'course', price: 0 }), HubError);
});
Deno.test('server course pricing distinguishes free from paid and respects sale expiry', () => {
  assertEquals(effectiveCoursePrice({ price: 0 }), 0);
  assertEquals(effectiveCoursePrice({ price: 88000 }), 88000);
  assertEquals(effectiveCoursePrice({ price: 88000, is_sale_enabled: true, sale_price: 44000, sale_expires_at: '2026-12-01' }, Date.parse('2026-11-22')), 44000);
  assertEquals(effectiveCoursePrice({ price: 88000, is_sale_enabled: true, sale_price: 44000, sale_expires_at: '2026-11-01' }, Date.parse('2026-11-22')), 88000);
});
const questionnaire = { questions: [{ row: 1, title: 'پرسش', answers: [{ row: 1, value: '2', title: 'پاسخ' }] }] };
Deno.test('Esanj rows map to the exact Hub question and option shape', () => {
  assertEquals(mapQuestionnaire(questionnaire), [{ id: '1', text: 'پرسش', options: [{ value: '2', label: 'پاسخ' }] }]);
});
Deno.test('real Esanj informational blocks are not answerable questions', () => {
  assertEquals(mapQuestionnaire({ questions: [{ row_show: 1, comment: '<p>اطلاعات</p>' }, ...questionnaire.questions] }), mapQuestionnaire(questionnaire));
});
Deno.test('blank provider question text is never fabricated', () => {
  assertThrows(() => mapQuestionnaire({ questions: [{ row: 1, title: '', answers: [{ row: 1, title: null, value: '0' }] }] }), HubError);
});
Deno.test('submissions require a valid answer to every real question', () => {
  const questions = mapQuestionnaire(questionnaire);
  assertEquals(validateAnswers(questions, { '1': '2' }), [{ row: 1, value: 2 }]);
  assertThrows(() => validateAnswers(questions, {}), HubError);
  assertThrows(() => validateAnswers(questions, { '1': 999 }), HubError);
  assertThrows(() => validateAnswers(questions, { '1': 2, '9': 2 }), HubError);
});
Deno.test('test results return real provider HTML, not invented success', () => {
  assertEquals(resultHtml({ response: '<html>نتیجه</html>' }), '<html>نتیجه</html>');
  assertThrows(() => resultHtml({ response: 'pending' }), HubError);
});
Deno.test('employee creation converts Gregorian birth year to the existing Esanj convention', () => {
  assertEquals(esanjBirthYear(2000), 1379);
  assertEquals(esanjBirthYear(1997), 1376);
});