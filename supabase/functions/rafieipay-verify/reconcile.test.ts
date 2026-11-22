import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
Deno.env.set('SUPABASE_URL', 'https://rafieipay-test.supabase.co');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-only-key');
Deno.env.set('RAFIEIPAY_URL', 'https://rafieipay-provider-test.invalid');
Deno.env.set('RAFIEIPAY_SECRET', 'test-only-signing-secret');
const { reconcileRafieipayEnrollment } = await import('../_shared/rafieipay-reconcile.ts');
async function fixture(work: (db: SupabaseClient, counts: () => { writes: number; calls: any[] }) => Promise<void>, status = 'verified') {
  let row: any = { id: '4025047e-f713-434c-b3db-1121733656d1', payment_status: 'failed', payment_method: 'rafieipay_zarinpal', payment_amount: 26915000, zarinpal_authority: '5d58338a-3caf-4253-8937-c3c18ed5cfc2', courses: { title: 'Test course' } };
  let writes = 0;
  const db = { from() {
    let patch: any;
    const builder: any = {
      eq: () => builder, not: () => builder,
      update: (value: any) => { patch = value; return builder; },
      select: () => builder,
      single: async () => ({ data: { ...row }, error: null }),
      then: (resolve: any) => { if (patch) { writes++; row = { ...row, ...patch }; } return Promise.resolve({ data: [{ id: row.id }], error: null }).then(resolve); },
    };
    return builder;
  } } as unknown as SupabaseClient;
  const previous = globalThis.fetch, calls: any[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('payments-get')) return Response.json({ success: true, payment: { id: row.zarinpal_authority, order_id: row.id, status, amount_toman: row.payment_amount, ref_id: '95116489301' } });
    if (url.hostname === 'rafieipay-test.supabase.co' && !url.pathname.startsWith('/rest')) calls.push({ path: url.pathname, body: JSON.parse(String(init?.body)) });
    return Response.json({ success: true });
  };
  try { await work(db, () => ({ writes, calls })); } finally { globalThis.fetch = previous; }
}
Deno.test('verified failed enrollment becomes completed, reads back correctly and sends successful lifecycle once', async () => {
  await fixture(async (db, counts) => {
    const first = await reconcileRafieipayEnrollment(db, '4025047e-f713-434c-b3db-1121733656d1', 'course');
    assertEquals(first.success, true);
    assertEquals(first.enrollment?.payment_status, 'completed');
    assertEquals(first.refId, '95116489301');
    assertEquals(counts().writes, 1);
    assertEquals(counts().calls[0].body.payload.data.enrollment.payment_status, 'completed');
    const second = await reconcileRafieipayEnrollment(db, '4025047e-f713-434c-b3db-1121733656d1', 'course');
    assertEquals(second.alreadyProcessed, true);
    assertEquals(counts().writes, 1);
    assertEquals(counts().calls.length, 2);
  });
});
Deno.test('pending provider payment cannot change enrollment or send success lifecycle', async () => {
  await fixture(async (db, counts) => {
    const result = await reconcileRafieipayEnrollment(db, '4025047e-f713-434c-b3db-1121733656d1', 'course');
    assertEquals(result.success, false);
    assertEquals(counts(), { writes: 0, calls: [] });
  }, 'pending');
});