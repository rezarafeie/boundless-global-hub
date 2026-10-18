import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { fieldsFrom, normalizePhone, triggerMatches, renderReply, eligibleFreeCourse } from '../_shared/social-enrollment.ts';

Deno.test('form completion registers only the configured form', () => {
  const rule = { enabled: true, event_type: 'autoform_completed', trigger_value: '123' };
  assertEquals(triggerMatches(rule, { type: 'autoform_completed', payload: { form_id: 123 } }), true);
  assertEquals(triggerMatches(rule, { type: 'autoform_completed', payload: { form_id: 124 } }), false);
});
Deno.test('keyword trigger ignores outgoing and automatic bot messages', () => {
  const rule = { enabled: true, event_type: 'message_created', trigger_value: 'شروع' };
  assertEquals(triggerMatches(rule, { type: 'message_created', payload: { text: 'شروع' } }), true);
  assertEquals(triggerMatches(rule, { type: 'message_created', payload: { text: 'شروع', direction: 'out' } }), false);
  assertEquals(triggerMatches(rule, { type: 'message_created', payload: { text: 'شروع', is_auto_response: true } }), false);
});
Deno.test('disabled activation rule never enrolls', () => {
  assertEquals(triggerMatches({ enabled: false, event_type: 'message_created', trigger_value: 'شروع' }, { type: 'message_created', payload: { text: 'شروع' } }), false);
});
Deno.test('mapped form answers preserve real email and normalize Persian phone', () => {
  assertEquals(fieldsFrom({ answers: [{ field_id: 'n', answer: 'رضا' }, { field_id: 'p', value: '۰۹۱۲۱۲۳۴۵۶۷' }, { field_id: 'e', value: 'TEST@example.com' }] },
    { name: 'answers.n', phone: 'answers.p', email: 'answers.e' }), { name: 'رضا', phone: '09121234567', email: 'test@example.com' });
  assertEquals(normalizePhone('+98 912 123 4567'), '09121234567');
});
Deno.test('success response includes Telegram and Bale links from existing activation flow', () => {
  assertEquals(renderReply('{telegram_link}\n{bale_link}', { telegram_link: 'https://t.me/a?start=sact_123', bale_link: 'https://ble.ir/a?start=sact_123' }),
    'https://t.me/a?start=sact_123\nhttps://ble.ir/a?start=sact_123');
});
Deno.test('paid courses never become completed free enrollments', () => {
  assertEquals(eligibleFreeCourse(0), true);
  assertEquals(eligibleFreeCourse('0.00'), true);
  assertEquals(eligibleFreeCourse(26000000), false);
  assertEquals(eligibleFreeCourse(null), false);
});
Deno.test('NovinHub form messages auto-detect name, phone and email', () => {
  const p = { auto_form_id: 9808, messages: [{ text: 'رضا' }, { text: 'رفیعی' }, { text: '۰۹۱۲۰۷۸۴۴۵۷' }, { text: 'ReRafeie@gmail.com' }] };
  assertEquals(fieldsFrom(p, {}), { name: 'رضا رفیعی', phone: '09120784457', email: 'rerafeie@gmail.com' });
  assertEquals(triggerMatches({ enabled: true, event_type: 'autoform_completed', trigger_value: '9808' }, { type: 'autoform_completed', payload: p }), true);
});