export function paymentCallbackGateway(gateway: string | null, zibalTrackId: string | null, storedMethod?: string | null) {
  if (String(storedMethod ?? '').startsWith('rafieipay') || gateway === 'rafieipay') return 'rafieipay';
  if (gateway === 'snapppay') return 'snapppay';
  if (gateway === 'zibal' || zibalTrackId) return 'zibal';
  return gateway;
}