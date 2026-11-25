import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { courseInstallmentPlan } from './courseInstallments';

const gateways = {
  snapppay_enabled: true,
  rafieipay_snapppay_enabled: true,
  digipay_enabled: true,
  snapppay_max_amount_toman: 50_000_000,
  digipay_max_amount_toman: 100_000_000,
};

test('a course with both installment switches off never advertises installments', () => {
  assert.equal(courseInstallmentPlan(
    { snapppay_enabled: false, digipay_enabled: false },
    gateways,
    1_076_600,
  ), null);
});

test('an eligible SnappPay course shows four equal installments', () => {
  assert.deepEqual(courseInstallmentPlan(
    { snapppay_enabled: true, digipay_enabled: true },
    gateways,
    1_076_600,
  ), { gateway: 'snapppay', count: 4, amount: 1_076_600, firstPayment: 269_150 });
});

test('DigiPay shows six installments when SnappPay is disabled for the course', () => {
  assert.equal(courseInstallmentPlan(
    { snapppay_enabled: false, digipay_enabled: true },
    gateways,
    12_000_000,
  )?.count, 6);
});

test('an amount above the SnappPay limit can use DigiPay within its own limit', () => {
  assert.equal(courseInstallmentPlan(
    { snapppay_enabled: true, digipay_enabled: true },
    gateways,
    60_000_000,
  )?.gateway, 'digipay');
});

test('globally disabled gateways do not advertise installments', () => {
  assert.equal(courseInstallmentPlan(
    { snapppay_enabled: true, digipay_enabled: true },
    { snapppay_enabled: false, rafieipay_snapppay_enabled: false, digipay_enabled: false },
    1_000_000,
  ), null);
});
