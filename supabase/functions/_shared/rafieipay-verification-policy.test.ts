import { assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { verifiedRafieipayPayment } from './rafieipay-verification-policy.ts';
const order = { id: '4025047e-f713-434c-b3db-1121733656d1', zarinpal_authority: '5d58338a-3caf-4253-8937-c3c18ed5cfc2', payment_amount: 26915000 };
const payment = { id: order.zarinpal_authority, order_id: order.id, status: 'verified', amount_toman: 26915000, ref_id: '95116489301' };
const response = (changes = {}) => ({ ok: true, body: { success: true, payment: { ...payment, ...changes } } });
Deno.test('actual verified Zarinpal-through-RafieiPay payment is accepted at its exact Toman amount', () => assertEquals(verifiedRafieipayPayment(response(), order).paid, true));
Deno.test('actual SnappPay-through-RafieiPay amount is verified without multiplying Toman by ten', () => {
  assertEquals(verifiedRafieipayPayment(response({ amount_toman: 2691500 }), { ...order, payment_amount: 2691500 }).paid, true);
});
Deno.test('successful HTTP and callback status alone do not confirm a pending payment', () => {
  assertEquals(verifiedRafieipayPayment(response({ status: 'pending' }), order).paid, false);
  assertEquals(verifiedRafieipayPayment(response({ status: 'created' }), order).paid, false);
});
Deno.test('payment identity and order identity must both belong to the enrollment', () => {
  assertThrows(() => verifiedRafieipayPayment(response({ id: 'another-payment' }), order));
  assertThrows(() => verifiedRafieipayPayment(response({ order_id: 'another-order' }), order));
});
Deno.test('verified payment cannot pass with missing, different or invalid amount', () => {
  for (const amount_toman of [null, undefined, 'invalid', 2691500, 0]) assertThrows(() => verifiedRafieipayPayment(response({ amount_toman }), order));
});
Deno.test('provider outage or negative response never authorizes payment confirmation', () => {
  assertThrows(() => verifiedRafieipayPayment({ ...response(), ok: false }, order));
  assertThrows(() => verifiedRafieipayPayment({ ok: true, body: { success: false, payment } }, order));
});