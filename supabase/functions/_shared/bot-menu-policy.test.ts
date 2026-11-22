import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { botVisibleForms, privilegedActions, privilegedReplyKeyboard, allowsPrivilegedAction, replyAction } from './bot-menu-policy.ts';

Deno.test('forms are hidden by default unless explicitly selected for bot display', () => {
  const forms = [{ id: 'default', is_active: true }, { id: 'off', is_active: true, show_in_bot: false }, { id: 'selected', is_active: true, show_in_bot: true }, { id: 'inactive', is_active: false, show_in_bot: true }];
  assertEquals(botVisibleForms(forms).map(f => f.id), ['selected']);
});
Deno.test('ordinary users have no privileged buttons', () => {
  assertEquals(privilegedReplyKeyboard('student'), []);
  assertEquals(privilegedReplyKeyboard(null), []);
});
Deno.test('admin keyboard actions reuse their existing handlers without public account actions', () => {
  assertEquals(privilegedActions('admin').map(a => a.callback_data), ['menu:my_leads', 'menu:all_leads', 'bulk:start', 'menu:reports', 'social:menu', 'admin:menu']);
  assertEquals(replyAction('⚙️ مدیریت سیستم')?.callback_data, 'admin:menu');
});
Deno.test('agents cannot use manager or administrator buttons even if they send the text', () => {
  assertEquals(allowsPrivilegedAction('sales_agent', 'menu:my_leads'), true);
  for (const action of ['menu:all_leads', 'bulk:start', 'admin:menu', 'social:menu']) assertEquals(allowsPrivilegedAction('sales_agent', action), false);
  assertEquals(allowsPrivilegedAction('student', 'menu:my_leads'), false);
});
Deno.test('delegated report access adds only the report action without requiring account linking', () => {
  assertEquals(privilegedActions(null, true).map(a => a.callback_data), ['ereg:menu']);
  assertEquals(allowsPrivilegedAction(null, 'ereg:menu', false), false);
  assertEquals(privilegedActions('admin', true).length, 7);
});