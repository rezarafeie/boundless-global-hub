import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Fixture is provisioned explicitly through the database tool, not by this test.
// Password/tickets are read privately from a temporary file and never printed.
Deno.test({ name: 'Hub HTTP password, atomic exchange, linking and saved nonempty history',
  ignore: Deno.env.get('HUB_AUTH_HTTP_TESTS') !== '1', fn: async () => {
    const fixturePath = Deno.env.get('HUB_AUTH_FIXTURE_PATH');
    const shared = Deno.env.get('HUB_SHARED_SECRET');
    assert(fixturePath && shared);
    const fixture = JSON.parse(await Deno.readTextFile(fixturePath));
    const identity = { hub_user_id: 'hub-auth-isolated-20261122', email: fixture.email, name: 'This header must not overwrite the account name' };
    const base = 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api';
    const call = async (action: string, body: any, hubIdentity?: typeof identity, valid = true) => {
      const response = await fetch(`${base}/${action}`, { method: 'POST',
        headers: { Authorization: valid ? `Bearer ${shared}` : 'Bearer invalid', 'Content-Type': 'application/json', 'X-Hub-Source': 'rafiei-hub',
          ...(hubIdentity ? { 'X-Hub-User': encodeURIComponent(JSON.stringify(hubIdentity)) } : {}) }, body: JSON.stringify(body) });
      const result = await response.json();
      assertEquals(Object.keys(result), ['data']);
      return { status: response.status, data: result.data };
    };
    assertEquals((await call('auth.capabilities', {}, undefined, false)).status, 401);
    assertEquals((await call('auth.password', { identifier: fixture.email, password: 'incorrect-test-password', audience: 'rafiei-hub' })).status, 401);
    const login = await call('auth.password', { identifier: fixture.email, password: fixture.password, audience: 'rafiei-hub' });
    assertEquals(login.status, 200); assertEquals(Object.keys(login.data), ['exchange_ticket']);
    const results = await Promise.all([1, 2].map(() => call('auth.exchange', { exchange_ticket: login.data.exchange_ticket, audience: 'rafiei-hub' })));
    assertEquals(results.map(r => r.status).sort(), [200, 401]);
    const source = results.find(r => r.status === 200)?.data; assert(source);
    assertEquals(Object.keys(source).sort(), ['source_user_id','email','email_verified','name','phone','phone_verified','authenticated_at','audience'].sort());
    assertEquals(source.email_verified, true); assertEquals(source.name, 'Hub authentication isolated QA');
    assertEquals(source.phone, null); assertEquals(source.phone_verified, false); assert(source.authenticated_at.endsWith('Z'));
    assertEquals((await call('auth.exchange', { exchange_ticket: fixture.expired, audience: 'rafiei-hub' })).status, 401);
    assertEquals((await call('auth.exchange', { exchange_ticket: login.data.exchange_ticket, audience: 'other-app' })).status, 400);
    const linked = await call('account.link', { source_user_id: source.source_user_id }, identity);
    assertEquals(linked.status, 200); assertEquals(linked.data, { ok: true });
    const tickets = await call('me.tickets', {}, identity);
    assertEquals(tickets.status, 200);
    assert(tickets.data.some((r: any) => r.subject === 'Hub isolated QA existing history' && r.message === 'Synthetic history fixture, not a customer ticket'));
    assertEquals((await call('me.tickets', {}, { ...identity, hub_user_id: 'not-the-linked-user' })).status, 409);
    const second = await call('auth.password', { identifier: fixture.email, password: fixture.password, audience: 'rafiei-hub' });
    assertEquals(second.status, 200);
    assertEquals((await call('auth.exchange', { exchange_ticket: second.data.exchange_ticket, audience: 'rafiei-hub' })).status, 200);
    assertEquals((await call('account.link', { source_user_id: source.source_user_id }, { ...identity, hub_user_id: 'conflicting-hub-user' })).status, 409);
    assertEquals((await call('me.tickets', {}, identity)).data, tickets.data);
    console.log('Live HTTP: correct/wrong password, concurrent/replayed/expired ticket, unchanged account name, 409 rebinding, existing ticket history and ownership isolation passed');
} });

Deno.test({ name: 'Hub HTTP OTP wrong expired consumed five attempts and simultaneous verification',
  ignore: Deno.env.get('HUB_AUTH_HTTP_TESTS') !== '1', fn: async () => {
    const path = Deno.env.get('HUB_AUTH_FIXTURE_PATH'), shared = Deno.env.get('HUB_SHARED_SECRET'); assert(path && shared);
    const fixture = JSON.parse(await Deno.readTextFile(path));
    const verify = async (test: any, code = test.code) => {
      const response = await fetch('https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api/auth.otp.verify', {
        method: 'POST', headers: { Authorization: `Bearer ${shared}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: test.id, code, audience: 'rafiei-hub' }) });
      const result = await response.json();
      return { status: response.status, data: result.data };
    };
    const race = fixture.otpCases.find((t: any) => t.name === 'race');
    const concurrent = await Promise.all([1, 2].map(() => verify(race)));
    assertEquals(concurrent.map(r => r.status).sort(), [200, 401]);
    assertEquals(Object.keys(concurrent.find(r => r.status === 200)?.data), ['exchange_ticket']);
    assertEquals((await verify(race)).status, 401);
    const exhausted = fixture.otpCases.find((t: any) => t.name === 'exhausted');
    const wrong = exhausted.code === '000000' ? '000001' : '000000';
    for (let i = 0; i < 5; i++) assertEquals((await verify(exhausted, wrong)).status, 401);
    assertEquals((await verify(exhausted)).status, 401);
    assertEquals((await verify(fixture.otpCases.find((t: any) => t.name === 'expired'))).status, 401);
    assertEquals((await verify(fixture.otpCases.find((t: any) => t.name === 'changedPhone'))).status, 409);
    console.log('Hosted OTP: two real concurrent requests yielded one ticket; replay, expiry, five wrong tries and changed-phone ownership checks passed');
} });