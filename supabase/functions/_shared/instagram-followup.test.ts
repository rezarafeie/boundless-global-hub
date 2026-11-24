import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

// Synthetic transport fixtures: never contact NovinHub or send to real users.
Deno.env.set('SUPABASE_URL', 'https://followup-fixture.invalid');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'fixture-only-not-a-real-key');
Deno.env.set('NOVINHUB_API_KEY', 'fixture-only-not-a-real-key');
const { sendInstagramActivationFollowup } = await import('./instagram-followup.ts');
const row = { id: 'activation-fixture', enrollment_id: 'enrollment-fixture', user_id: 42, course_id: 'course-fixture' };

async function fixture(options: { activated?: boolean; wrongOwner?: boolean; wrongCourse?: boolean; sendFails?: boolean; buttonFails?: boolean }, check: (sent: unknown[]) => Promise<void>) {
  const originalFetch = globalThis.fetch;
  const sent: unknown[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const response = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));
    if (url.host === 'followup-fixture.invalid') {
      const table = url.pathname.split('/').pop();
      if (table === 'enrollments') return response({ id: row.enrollment_id, chat_user_id: 42, course_id: options.wrongCourse ? 'other-course' : row.course_id, payment_status: 'completed' });
      if (table === 'social_enrollment_events') return response({ rule_id: 'rule-fixture', created_at: '2026-11-24T15:31:00Z', payload: { type: 'autoform_completed', payload: { account_id: '210', auto_form_id: '100', conversation_id: '123', social_user_id: '456' } } });
      if (table === 'social_enrollment_rules') return response({ account_id: 'account-fixture', course_id: row.course_id });
      if (table === 'social_accounts') return response({ novinhub_account_id: '210' });
      if (table === 'support_activations') return response({ status: options.activated ? 'activated' : 'not_started', activated_at: options.activated ? '2026-11-24T15:32:00Z' : null });
    }
    if (url.host === 'api.novinhub.com' && url.pathname.endsWith('/conversation/123')) {
      return response({ data: { account_id: '210', participants: [{ social_user_id: options.wrongOwner ? '999' : '456' }] } });
    }
    if (url.host === 'api.novinhub.com' && url.pathname.endsWith('/conversation/123/reply')) {
      const body = JSON.parse(String(init?.body));
      sent.push(body);
      return response({ successful: !options.sendFails }, options.buttonFails && body.buttons ? 400 : 200);
    }
    throw new Error(`Unexpected fixture request: ${url.pathname}`);
  };
  try { await check(sent); } finally { globalThis.fetch = originalFetch; }
}

Deno.test('Instagram followup delivers to the verified enrollment conversation without needing email', async () => {
  await fixture({}, async sent => {
    const result = await sendInstagramActivationFollowup(row, 'fixture reminder', 'https://t.me/fixture_bot?start=sact_test');
    assertEquals(result.ok, true);
    assertEquals(result.conversation_id, '123');
    assertEquals(sent.length, 2);
  });
});
Deno.test('activation occurring after scheduler selection stops Instagram delivery', async () => {
  await fixture({ activated: true }, async sent => {
    assertEquals((await sendInstagramActivationFollowup(row, 'fixture', '')).skipped, true);
    assertEquals(sent.length, 0);
  });
});
Deno.test('different conversation owner blocks all Instagram messages', async () => {
  await fixture({ wrongOwner: true }, async sent => {
    await assertRejects(() => sendInstagramActivationFollowup(row, 'fixture', ''));
    assertEquals(sent.length, 0);
  });
});
Deno.test('different enrolled course never resolves a recipient', async () => {
  await fixture({ wrongCourse: true }, async sent => {
    assertEquals((await sendInstagramActivationFollowup(row, 'fixture', '')).unreachable, true);
    assertEquals(sent.length, 0);
  });
});
Deno.test('provider rejection cannot be reported as sent', async () => {
  await fixture({ sendFails: true }, async sent => {
    await assertRejects(() => sendInstagramActivationFollowup(row, 'fixture', ''));
    assertEquals(sent.length, 1);
  });
});
Deno.test('optional button failure does not fail or retry the delivered reminder', async () => {
  await fixture({ buttonFails: true }, async sent => {
    const result = await sendInstagramActivationFollowup(row, 'fixture', 'https://t.me/fixture_bot?start=sact_test');
    assertEquals(result.ok, true);
    assertEquals(result.button_sent, false);
    assertEquals(sent.length, 2);
  });
});