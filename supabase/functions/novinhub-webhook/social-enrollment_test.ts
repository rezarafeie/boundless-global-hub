import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { fieldsFrom, normalizePhone, triggerMatches, renderReply, eligibleFreeCourse, sameFormResponse, ownsConversation, directActivationLink } from '../_shared/social-enrollment.ts';

Deno.test('form completion registers only the configured form', () => {
  const rule = { enabled: true, event_type: 'autoform_completed', trigger_value: '123' };
  assertEquals(triggerMatches(rule, { type: 'autoform_completed', payload: { form_id: 123 } }), true);
  assertEquals(triggerMatches(rule, { type: 'autoform_completed', payload: { form_id: 124 } }), false);
});
Deno.test('Reza Rafiei form 10424 matches independently of the academy form 9808', () => {
  const rule = { enabled: true, event_type: 'autoform_completed', trigger_value: '10424' };
  assertEquals(triggerMatches(rule, { type: 'autoform_completed', payload: { auto_form_id: 10424 } }), true);
  assertEquals(triggerMatches(rule, { type: 'autoform_completed', payload: { auto_form_id: 9808 } }), false);
  assertEquals(triggerMatches(rule, { type: 'message_created', payload: { text: '10424' } }), false);
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
Deno.test('sparse form webhook requires exact provider response and person identity', () => {
  const event = { type: 'autoform_completed', payload: { id: 4368140, social_user_id: 77 } };
  assertEquals(sameFormResponse(event, { id: 4368140, social_user_id: 77, status: 'completed' }), true);
  assertEquals(sameFormResponse(event, { id: 4368141, social_user_id: 77, status: 'completed' }), false);
  assertEquals(sameFormResponse(event, { id: 4368140, social_user_id: 78, status: 'completed' }), false);
  assertEquals(sameFormResponse(event, { id: 4368140, social_user_id: 77, status: 'pending' }), false);
});
Deno.test('form recipient must belong to both the configured page and conversation', () => {
  const conversation = { account_id: 210093, participants: [{ social_user_id: 77 }] };
  assertEquals(ownsConversation(conversation, '210093', '77'), true);
  assertEquals(ownsConversation(conversation, '231633', '77'), false);
  assertEquals(ownsConversation(conversation, '210093', '78'), false);
  assertEquals(ownsConversation({ account_id: 210093 }, '210093', '77'), false);
});
Deno.test('name and phone form never fabricates an email', () => {
  assertEquals(fieldsFrom({ messages: [{ text: 'کاربر آزمایش' }, { text: '۰۹۱۲۱۲۳۴۵۶۷' }] }, {}).email, '');
});
Deno.test('long prefilled activation uses the same existing bot activation token', () => {
  const activation = { support_prefilled_link: 'https://t.me/rafieiacademy?text=' + 'a'.repeat(1540),
    activation_token: 'test-token', bot_deep_link: 'https://t.me/rafiei_bot?start=sact_test-token' };
  const link = directActivationLink(activation);
  assertEquals(link, activation.bot_deep_link);
  assertEquals(renderReply('{name} عزیز\n{telegram_link}', { name: 'آزمایش', telegram_link: link }).length < 1000, true);
});
Deno.test('short support prefill links are preserved', () => {
  assertEquals(directActivationLink({ support_prefilled_link: 'https://t.me/rafieiacademy?text=hello' }),
    'https://t.me/rafieiacademy?text=hello');
});
Deno.test('legacy telegram.me deep links are still accepted', () => {
  const activation = { support_prefilled_link: 'https://t.me/rafieiacademy?text=' + 'a'.repeat(1540),
    activation_token: 'test-token', bot_deep_link: 'https://telegram.me/rafiei_bot?start=sact_test-token' };
  assertEquals(directActivationLink(activation), activation.bot_deep_link);
});