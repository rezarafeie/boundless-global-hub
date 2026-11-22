import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleEnrollmentReport, deliverEnrollmentReport, ENROLLMENT_REPORT_BUTTON } from './enrollment-report.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

function client(access: unknown) {
  let rpcCalls = 0, writes = 0;
  const db = {
    from(table: string) {
      const result = { data: table === 'telegram_enrollment_report_access' ? access : null, error: null };
      const builder: any = { select: () => builder, eq: () => builder, maybeSingle: async () => result, upsert: async () => { writes++; return { error: null }; } };
      return builder;
    },
    rpc: async () => { rpcCalls++; return { data: [], error: null }; },
  } as unknown as SupabaseClient;
  return { db, counts: () => ({ rpcCalls, writes }) };
}
const update = (text: string) => ({ message: { text, from: { id: 123456789 }, chat: { id: 123456789, type: 'private' } } });
async function mockedMessages(fn: (messages: any[]) => Promise<void>) {
  const previous = globalThis.fetch;
  const messages: any[] = [];
  globalThis.fetch = async (_input, init) => { messages.push(JSON.parse(String(init?.body))); return Response.json({ ok: true, result: { message_id: messages.length } }); };
  try { await fn(messages); } finally { globalThis.fetch = previous; }
}
Deno.test('unapproved account cannot query enrollment data', async () => {
  await mockedMessages(async messages => {
    const { db, counts } = client(null);
    assertEquals(await handleEnrollmentReport(db, update('/enrollments day')), true);
    assertEquals(counts().rpcCalls, 0);
    assertEquals(messages.length, 1);
  });
});
Deno.test('authorized account opens reports by button without issuing a command or querying data yet', async () => {
  await mockedMessages(async () => {
    const { db, counts } = client({ active: true, can_manage: false });
    assertEquals(await handleEnrollmentReport(db, update(ENROLLMENT_REPORT_BUTTON)), true);
    assertEquals(counts(), { rpcCalls: 0, writes: 1 });
  });
});
Deno.test('unauthorized account cannot open reports through the button', async () => {
  await mockedMessages(async () => {
    const { db, counts } = client(null);
    assertEquals(await handleEnrollmentReport(db, update(ENROLLMENT_REPORT_BUTTON)), true);
    assertEquals(counts(), { rpcCalls: 0, writes: 0 });
  });
});
Deno.test('report button setup preserves the regular start flow for managers and delegated readers', async () => {
  await mockedMessages(async () => {
    for (const can_manage of [true, false]) {
      const { db, counts } = client({ active: true, can_manage });
      assertEquals(await handleEnrollmentReport(db, update('/start')), false);
      assertEquals(counts(), { rpcCalls: 0, writes: 0 });
    }
  });
});
Deno.test('delegated reader receives a real report without gaining management permission', async () => {
  await mockedMessages(async messages => {
    const { db, counts } = client({ active: true, can_manage: false });
    assertEquals(await handleEnrollmentReport(db, update('/enrollments hour')), true);
    assertEquals(counts().rpcCalls, 1);
    assertEquals(messages.some(m => (JSON.stringify(m.reply_markup) ?? '').includes('ereg:access')), false);
  });
});
Deno.test('forged management callback from a reader does not mutate access', async () => {
  await mockedMessages(async () => {
    const { db, counts } = client({ active: true, can_manage: false });
    await handleEnrollmentReport(db, { callback_query: { id: 'test', data: 'ereg:grant', from: { id: 123456789 }, message: { chat: { id: 123456789, type: 'private' } } } });
    assertEquals(counts().writes, 0);
    assertEquals(counts().rpcCalls, 0);
  });
});
Deno.test('group report requests never disclose enrollments', async () => {
  await mockedMessages(async () => {
    const { db, counts } = client({ active: true, can_manage: true });
    const request = update('/enrollments'); request.message.chat.type = 'group';
    assertEquals(await handleEnrollmentReport(db, request), false);
    assertEquals(counts().rpcCalls, 0);
  });
});
Deno.test('large per-course report is split below Telegram message limit and preserves every course', async () => {
  await mockedMessages(async messages => {
    const rows = Array.from({ length: 80 }, (_, i) => ({ title: `دوره ${i}`, total: i === 0 ? 2000 : 0, completed: 0 }));
    const db = { rpc: async () => ({ data: rows, error: null }) } as unknown as SupabaseClient;
    await deliverEnrollmentReport(db, 123456789, { from: '2026-11-01T00:00:00Z', to: '2026-11-22T00:00:00Z' }, 'آزمون', { active: true, can_manage: false });
    assertEquals(messages.every(m => m.text.length < 4096), true);
    assertEquals(messages.filter(m => m.text.includes('🎓')).flatMap(m => m.text.match(/🎓/g) ?? []).length, 80);
  });
});