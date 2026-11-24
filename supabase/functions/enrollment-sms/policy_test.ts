import { assertEquals, assertMatch, assertThrows } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { SMS_TEMPLATES, accessValid, courseStarted, randomLoginCode, smsEligible, smsParameters } from './policy.ts';
const activation = { enrollment_id: 'e1', user_id: 5, course_id: 'c1', status: 'not_started', activated_at: null };
const enrollment = { id: 'e1', chat_user_id: 5, course_id: 'c1', payment_status: 'completed' };
Deno.test('welcome uses approved rafieienrollmentwelcome and only successful payment', () => {
  assertEquals(SMS_TEMPLATES.welcome, 'rafieienrollmentwelcome');
  assertEquals(smsEligible('welcome', activation, enrollment, false), true);
  assertEquals(smsEligible('welcome', activation, { ...enrollment, payment_status: 'pending' }, false), false);
});
Deno.test('rafieisupportactivation stops after activation status or timestamp', () => {
  assertEquals(SMS_TEMPLATES.activation, 'rafieisupportactivation');
  assertEquals(smsEligible('activation', activation, enrollment, false), true);
  assertEquals(smsEligible('activation', { ...activation, status: 'activated' }, enrollment, false), false);
  assertEquals(smsEligible('activation', { ...activation, activated_at: '2026-11-24' }, enrollment, false), false);
});
Deno.test('rafieicoursestart requires activation and stops when this course starts', () => {
  assertEquals(SMS_TEMPLATES.start, 'rafieicoursestart');
  const active = { ...activation, status: 'activated', activated_at: '2026-11-24' };
  assertEquals(smsEligible('start', activation, enrollment, false), false);
  assertEquals(smsEligible('start', active, enrollment, false), true);
  assertEquals(smsEligible('start', active, enrollment, true), false);
});
Deno.test('messages never use another enrollment or course owner', () => {
  assertEquals(smsEligible('welcome', activation, { ...enrollment, chat_user_id: 6 }, false), false);
  assertEquals(smsEligible('welcome', activation, { ...enrollment, course_id: 'c2' }, false), false);
  assertEquals(smsEligible('welcome', activation, { ...enrollment, id: 'e2' }, false), false);
});
Deno.test('opening, completing or watch time each means learning started', () => {
  assertEquals(courseStarted([]), false);
  assertEquals(courseStarted([{ is_opened: false, is_completed: false, total_time_spent: 0 }]), false);
  assertEquals(courseStarted([{ is_opened: true }]), true);
  assertEquals(courseStarted([{ is_completed: true }]), true);
  assertEquals(courseStarted([{ total_time_spent: 1 }]), true);
});
Deno.test('short login cannot bypass locked or expired course access', () => {
  assertEquals(accessValid({ enabled: true }, null), false);
  assertEquals(accessValid({ enabled: true }, { status: 'locked', expires_at: '2027-01-01' }), false);
  assertEquals(accessValid({ enabled: true }, { status: 'active', expires_at: '2026-11-23' }, Date.parse('2026-11-24')), false);
  assertEquals(accessValid({ enabled: true }, { status: 'active', expires_at: '2026-11-25' }, Date.parse('2026-11-24')), true);
});
Deno.test('template variables use first name, full course title and short code', () => {
  const p = smsParameters('start', 'عباس رفیعی', 'مزه بدون مرز', 'Ab3kX9pQ12', '+989123456789');
  assertEquals(p.get('token'), 'عباس'); assertEquals(p.get('token20'), 'مزه بدون مرز');
  assertEquals(p.get('token2'), 'Ab3kX9pQ12'); assertEquals(p.get('receptor'), '09123456789');
  assertThrows(() => smsParameters('start', 'عباس', 'مزه بدون مرز', 'with_under_score', '09123456789'));
});
Deno.test('short login codes contain exactly ten alphanumeric characters', () => {
  for (let i = 0; i < 100; i++) assertMatch(randomLoginCode(), /^[A-Za-z0-9]{10}$/);
});