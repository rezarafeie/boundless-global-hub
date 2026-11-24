import { assertEquals } from 'jsr:@std/assert@1';
import { instagramActivationPending, instagramEnrollmentMatches } from './instagram-followup-policy.ts';

Deno.test('Instagram activation reminders stop after activation including stale status', () => {
  assertEquals(instagramActivationPending({ status: 'not_started' }), true);
  assertEquals(instagramActivationPending({ status: 'activated' }), false);
  assertEquals(instagramActivationPending({ status: 'opened_bot', activated_at: '2026-11-24T15:31:00Z' }), false);
  assertEquals(instagramActivationPending(null), false);
});

Deno.test('Instagram followups require the same paid-complete enrollment, person and course', () => {
  const row = { enrollment_id: 'enrollment-a', user_id: 42, course_id: 'course-a' };
  const enrollment = { id: 'enrollment-a', chat_user_id: 42, course_id: 'course-a', payment_status: 'completed' };
  assertEquals(instagramEnrollmentMatches(row, enrollment), true);
  assertEquals(instagramEnrollmentMatches(row, { ...enrollment, chat_user_id: 43 }), false);
  assertEquals(instagramEnrollmentMatches(row, { ...enrollment, course_id: 'course-b' }), false);
  assertEquals(instagramEnrollmentMatches(row, { ...enrollment, id: 'enrollment-b' }), false);
  assertEquals(instagramEnrollmentMatches(row, { ...enrollment, payment_status: 'pending' }), false);
});