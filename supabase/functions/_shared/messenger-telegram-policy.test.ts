import { assertEquals } from 'jsr:@std/assert@1';
import { relayRecipients } from './messenger-telegram-policy.ts';

Deno.test('private messages go only to the other member', () => {
  assertEquals(relayRecipients({ kind: 'private', sender_id: 1, text: 'hi' }, { privateMembers: [1, 2] }), [2]);
});
Deno.test('group messages reach Telegram only for replies and mentions', () => {
  const users = new Map([['ali', 5], ['sara', 6]]);
  assertEquals(relayRecipients({ kind: 'group', sender_id: 1, text: 'سلام همه' }, { groupUsernames: users }), []);
  assertEquals(relayRecipients({ kind: 'group', sender_id: 1, text: 'hey @Ali' }, { groupUsernames: users }).sort(), [5]);
  assertEquals(relayRecipients({ kind: 'group', sender_id: 1, text: 'ok', reply_to_sender_id: 6 }, {}), [6]);
  assertEquals(relayRecipients({ kind: 'group', sender_id: 6, text: 'me @sara', reply_to_sender_id: 6 }, { groupUsernames: users }), []);
});
Deno.test('support: user messages are not echoed to their own Telegram; staff replies are', () => {
  assertEquals(relayRecipients({ kind: 'support', sender_id: 9, text: 'help' }, { supportOwner: 9 }), []);
  assertEquals(relayRecipients({ kind: 'support', sender_id: 1, text: 'answer' }, { supportOwner: 9 }), [9]);
});
