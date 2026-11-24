import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { processSms } from './index.ts';

function fixture(kind = 'activation', responseStatus = 200, providerStatus = 200) {
  const activation = { id: 'a', enrollment_id: 'e', user_id: 1, course_id: 'c', activation_token: 'Ab3kX9pQ12', status: 'not_started', created_at: '2026-11-01' };
  if (kind === 'start') Object.assign(activation, { status: 'activated', activated_at: '2026-11-01' });
  const enrollment = { id: 'e', chat_user_id: 1, course_id: 'c', payment_status: 'completed', created_at: '2026-11-01', full_name: 'تست', phone: '09123456789' };
  let claimed = false, sends = 0, progress: any[] = [], saved: any = null;
  const tables: Record<string, any> = {
    support_activations: activation, enrollments: enrollment,
    course_enrollment_sms_settings: { welcome_enabled: true, activation_enabled: true, start_enabled: true, enabled_from: '2026-10-01', activation_delay_minutes: 60, start_delay_minutes: 720 },
    courses: { title: 'مزه بدون مرز', is_active: true }, course_gamification_settings: null, course_access_windows: null,
  };
  const client: any = {
    rpc: () => Promise.resolve({ data: [{ activation_id: 'a', kind }], error: null }),
    from: (table: string) => {
      let op = 'select', value: any;
      const query: any = {
        select: () => query, eq: () => query, maybeSingle: () => query, single: () => query,
        insert: (v: any) => { op = 'insert'; value = v; return query; },
        update: (v: any) => { op = 'update'; value = v; return query; },
        then: (resolve: any) => {
          if (table === 'enrollment_sms_deliveries' && op === 'insert') {
            if (claimed) return Promise.resolve({ error: { code: '23505' } }).then(resolve);
            claimed = true;
          }
          if (table === 'enrollment_sms_deliveries' && op === 'update') saved = value;
          return Promise.resolve({ data: table === 'user_lesson_progress' ? progress : tables[table], error: null }).then(resolve);
        },
      };
      return query;
    },
  };
  const send: typeof fetch = async (_input, options) => {
    sends++;
    const params = options?.body as URLSearchParams;
    assertEquals(params.get('template'), kind === 'start' ? 'rafieicoursestart' : 'rafieisupportactivation');
    return new Response(JSON.stringify({ return: { status: providerStatus }, entries: [{ messageid: 12345 }] }), { status: responseStatus });
  };
  return { client, send, activation, enrollment, tables, setProgress: (p: any[]) => { progress = p; }, sends: () => sends, saved: () => saved };
}

Deno.test('claimed enrollment/kind cannot send twice when worker repeats', async () => {
  const f = fixture();
  await processSms(f.client, f.send); await processSms(f.client, f.send);
  assertEquals(f.sends(), 1); assertEquals(f.saved().status, 'sent');
});
Deno.test('provider rejection is saved as failed, never success', async () => {
  const f = fixture('activation', 400, 422);
  await processSms(f.client, f.send);
  assertEquals(f.saved().status, 'failed'); assertEquals(f.saved().error_code, 'provider_422');
});
Deno.test('ambiguous provider timeout never triggers blind automatic retry', async () => {
  const f = fixture(); let calls = 0;
  const failing: typeof fetch = async () => { calls++; throw new Error('timeout'); };
  await processSms(f.client, failing); await processSms(f.client, failing);
  assertEquals(calls, 1); assertEquals(f.saved().status, 'unknown');
});
Deno.test('course-start message is not sent for any saved lesson opening', async () => {
  const f = fixture('start'); f.setProgress([{ is_opened: true }]);
  await processSms(f.client, f.send); assertEquals(f.sends(), 0);
});
Deno.test('course-start reminder becomes due 12 hours after activation, not before', async () => {
  const f = fixture('start');
  Object.assign(f.activation, { activated_at: new Date(Date.now() - 719 * 60000).toISOString() });
  await processSms(f.client, f.send);
  assertEquals(f.sends(), 0);
  Object.assign(f.activation, { activated_at: new Date(Date.now() - 720 * 60000).toISOString() });
  await processSms(f.client, f.send);
  assertEquals(f.sends(), 1);
});
Deno.test('course-start message is skipped for course access lock', async () => {
  const f = fixture('start'); f.tables.course_access_windows = { status: 'locked' };
  await processSms(f.client, f.send); assertEquals(f.sends(), 0); assertEquals(f.saved().status, 'skipped');
});
Deno.test('fresh activation before provider send prevents reminder', async () => {
  const f = fixture();
  const original = f.client.from; let reads = 0;
  f.client.from = (table: string) => {
    if (table === 'support_activations' && ++reads > 1) Object.assign(f.activation, { status: 'activated', activated_at: new Date().toISOString() });
    return original(table);
  };
  await processSms(f.client, f.send); assertEquals(f.sends(), 0); assertEquals(f.saved().status, 'skipped');
});