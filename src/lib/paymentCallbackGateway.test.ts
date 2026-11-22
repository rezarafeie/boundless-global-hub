import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { paymentCallbackGateway } from './paymentCallbackGateway';
test('Rafiei Pay callback containing Zibal trackId stays on Rafiei Pay verification', () => {
  assert.equal(paymentCallbackGateway('rafieipay', '123456'), 'rafieipay');
});
test('stored Rafiei Pay payment method wins over missing or misleading callback gateway', () => {
  assert.equal(paymentCallbackGateway(null, '123456', 'rafieipay_zibal'), 'rafieipay');
  assert.equal(paymentCallbackGateway('zibal', '123456', 'rafieipay'), 'rafieipay');
});
test('direct gateway callbacks retain their original verifier', () => {
  assert.equal(paymentCallbackGateway('zibal', '123456', 'zibal'), 'zibal');
  assert.equal(paymentCallbackGateway('snapppay', null, 'snapppay'), 'snapppay');
});