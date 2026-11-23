import { assert, assertEquals, assertRejects, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { AUTH_LIMITS, hmac, maskDestination, normalizeIdentifier, parseAuth, randomCode, randomTicket } from './auth-policy.ts';

Deno.test('Hub OTP is exactly six digits from secure random generation', () => {
  assertEquals(AUTH_LIMITS.codeLength, 6);
  for (let i = 0; i < 100; i++) assert(/^\d{6}$/.test(randomCode()));
});
Deno.test('Hub OTP expires after exactly 120 seconds', () => assertEquals(AUTH_LIMITS.expiresIn, 120));
Deno.test('Hub OTP resend interval is exactly 60 seconds', () => assertEquals(AUTH_LIMITS.retryAfter, 60));
Deno.test('Hub OTP allows at most five attempts', () => assertEquals(AUTH_LIMITS.attempts, 5));
Deno.test('Hub destination allows at most five sends per hour', () => assertEquals(AUTH_LIMITS.sendsPerHour, 5));
Deno.test('Hub exchange ticket lifetime is at most 60 seconds', () => assertEquals(AUTH_LIMITS.ticketSeconds, 60));
Deno.test('Hub phone normalization returns E164 Iranian mobiles only', () => {
  for (const phone of ['09000000001', '00989000000001', '+989000000001', '۹۰۰۰۰۰۰۰۰۱']) assertEquals(normalizeIdentifier(phone, 'sms'), '+989000000001');
  assertThrows(() => normalizeIdentifier('+12125551234', 'sms'));
});
Deno.test('Hub destination masks identifying contact information', () => {
  assertEquals(maskDestination('+989000000001', 'sms'), '+9890******01');
  assertEquals(maskDestination('test@example.invalid', 'email'), 't***@e***.invalid');
});
Deno.test('Hub hashes are bound to request id and namespace', async () => {
  const digest = await hmac('otp:request-one:000001', 'test-only-key');
  assertEquals(digest.length, 64);
  assert(digest !== await hmac('otp:request-two:000001', 'test-only-key'));
  assert(digest !== await hmac('ticket:request-one:000001', 'test-only-key'));
});
Deno.test('Hub audience cannot be changed or passed as an app session', () => {
  assertThrows(() => parseAuth('auth.exchange', { exchange_ticket: randomTicket(), audience: 'academy' }));
  assertThrows(() => parseAuth('auth.password', { identifier: 'test@example.invalid', password: 'test', audience: 'rafiei-hub', session_token: 'old' }));
});
Deno.test('Hub auth verification rejects non-six-digit codes and link rejects arbitrary IDs', () => {
  assertThrows(() => parseAuth('auth.otp.verify', { request_id: crypto.randomUUID(), code: '1234', audience: 'rafiei-hub' }));
  assertThrows(() => parseAuth('account.link', { source_user_id: '-1' }));
});
Deno.test('Hub account.resolve requires verified email and forbids account creation', () => {
  assertEquals(parseAuth('account.resolve', { email_verified: true, create_if_missing: false }), { email_verified: true, create_if_missing: false });
  assertThrows(() => parseAuth('account.resolve', { email_verified: false, create_if_missing: false }));
  assertThrows(() => parseAuth('account.resolve', { email_verified: true, create_if_missing: true }));
  assertThrows(() => parseAuth('account.resolve', { email_verified: true, create_if_missing: false, name: 'Name only' }));
});