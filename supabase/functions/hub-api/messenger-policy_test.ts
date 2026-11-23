import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { parseHubUser } from '../_shared/hub-policy.ts';
import { decodeCursor, encodeCursor, idempotencyKey, parseMessenger, parseRef, storagePath, MESSENGER_LIMITS } from './messenger.ts';

const identity = { hub_user_id: 'h-1', email: 'A@Example.com', name: 'رضا' };
Deno.test('X-Hub-User accepts percent-encoded and UTF-8 base64url JSON', () => {
  const enc = encodeURIComponent(JSON.stringify(identity));
  const bytes = new TextEncoder().encode(JSON.stringify(identity));
  const b64url = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assertEquals(parseHubUser(enc).email, 'a@example.com');
  assertEquals(parseHubUser(b64url).name, 'رضا');
  assertThrows(() => parseHubUser('!!not-valid!!'));
});
Deno.test('conversation refs are typed and payload cannot carry requester identity', () => {
  assertEquals(parseRef('private:12'), { kind: 'private', id: 12 });
  assertThrows(() => parseMessenger('conversation.get', { id: 'room:1' }));
  assertThrows(() => parseMessenger('conversations.list', { user_id: 3 }));
  assertThrows(() => parseMessenger('messages.list', { conversation_id: 'group:1', limit: MESSENGER_LIMITS.maxLimit + 1 }));
  assertThrows(() => parseMessenger('message.send', { conversation_id: 'group:1', text: 'x'.repeat(4001) }));
});
Deno.test('cursors are opaque and bound to their type', () => {
  const c = encodeCursor({ t: 's', c: 'group:1', id: 5 });
  assertEquals(decodeCursor(c, 's').id, 5);
  assertThrows(() => decodeCursor(c, 'h'));
  assertThrows(() => decodeCursor('garbage', 's'));
});
Deno.test('idempotency key is required and attachments only come from messenger buckets', () => {
  assertThrows(() => idempotencyKey(null));
  assertEquals(idempotencyKey('abc-12345'), 'abc-12345');
  const base = 'https://x.supabase.co';
  assertEquals(storagePath(`${base}/storage/v1/object/public/voice-messages/3/a.webm`, base), { bucket: 'voice-messages', path: '3/a.webm' });
  assertEquals(storagePath(`${base}/storage/v1/object/public/private-bucket/a`, base), null);
  assertEquals(storagePath('https://evil.example/a.png', base), null);
});
