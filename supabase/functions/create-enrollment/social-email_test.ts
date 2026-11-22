import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { allowsMissingSocialEmail } from '../_shared/social-email-policy.ts';

Deno.test('trusted free direct enrollment allows optional email', () => {
  assertEquals(allowsMissingSocialEmail('test-secret', 'test-secret', '0.00', 0), true);
});
Deno.test('public website cannot bypass email using a flag or missing secret', () => {
  assertEquals(allowsMissingSocialEmail(null, 'test-secret', 0, 0), false);
  assertEquals(allowsMissingSocialEmail('wrong', 'test-secret', 0, 0), false);
  assertEquals(allowsMissingSocialEmail('', undefined, 0, 0), false);
});
Deno.test('optional email never grants a paid course free enrollment', () => {
  assertEquals(allowsMissingSocialEmail('test-secret', 'test-secret', 100000, 0), false);
  assertEquals(allowsMissingSocialEmail('test-secret', 'test-secret', 0, 100000), false);
  assertEquals(allowsMissingSocialEmail('test-secret', 'test-secret', null, 0), false);
});