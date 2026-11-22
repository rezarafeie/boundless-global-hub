import { createClient } from 'npm:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@3.0.2';
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleAuth } from './auth.ts';
import { hmac, randomTicket } from './auth-policy.ts';

// Explicit opt-in. Uses isolated synthetic fixtures, never sends email/SMS to them,
// and removes only its own fixture rows. No real account password/proof is modified.
Deno.test({ name: 'Hub hosted atomic auth, password, limits, conflicts and preserved history',
  ignore: Deno.env.get('HUB_AUTH_LIVE_TESTS') !== '1', fn: async () => {
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), secret = Deno.env.get('HUB_AUTH_HMAC_SECRET');
  assert(url && key && secret);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const tag = crypto.randomUUID(), mail = `auth-qa-${tag}@example.invalid`, password = randomTicket();
  const identity = { hub_user_id: `auth-qa-${tag}`, email: mail, name: 'Hub auth isolated QA' };
  const req = new Request(`${url}/functions/v1/hub-api/account.link`, { headers: { 'X-Hub-User': encodeURIComponent(JSON.stringify(identity)) } });
  const checked = async (q: PromiseLike<any>) => { const { data, error } = await q; assertEquals(error, null); return data; };
  const user = await checked(db.from('chat_users').insert({ email: mail, phone: null, name: identity.name,
    password_hash: await bcrypt.hash(password, 10), signup_source: 'hub-auth-isolated-qa' }).select('id').single());
  let code = '', requestId = '', currentId = 0;
  const deps = { db, onUser: async (id: number) => { currentId = id; }, deliver: async (_channel: any, _destination: string, c: string, id: string) => { code = c; requestId = id; } };
  const call = (a: string, p: any) => handleAuth(a, p, req, deps);
  const rejected = async (a: string, p: any, status: number) => {
    let thrown: any; try { await call(a, p); } catch (error) { thrown = error; }
    assertEquals(thrown?.status, status);
  };
  const ticketHashes: string[] = [];
  try {
    await rejected('auth.password', { identifier: mail, password: 'wrong', audience: 'rafiei-hub' }, 401);
    const login = await call('auth.password', { identifier: mail, password, audience: 'rafiei-hub' });
    assertEquals(Object.keys(login), ['exchange_ticket']);
    assertEquals(currentId, user.id);
    await rejected('auth.exchange', { ...login, audience: 'rafiei-hub' }, 403); // unverified email cannot escape
    const sent = await call('auth.otp.send', { identifier: mail, channel: 'email', purpose: 'login' });
    assertEquals(sent.expires_in, 120); assertEquals(sent.retry_after, 60); assertEquals(sent.code_length, 6);
    await rejected('auth.otp.send', { identifier: mail, channel: 'email', purpose: 'login' }, 429);
    await rejected('auth.otp.verify', { request_id: sent.request_id, code: code === '000000' ? '000001' : '000000', audience: 'rafiei-hub' }, 401);
    const concurrent = await Promise.allSettled([1, 2].map(() => call('auth.otp.verify', { request_id: sent.request_id, code, audience: 'rafiei-hub' })));
    assertEquals(concurrent.filter(r => r.status === 'fulfilled').length, 1);
    const success = concurrent.find(r => r.status === 'fulfilled'); assert(success?.status === 'fulfilled');
    const ticket = success.value.exchange_ticket;
    const exchanges = await Promise.allSettled([1, 2].map(() => call('auth.exchange', { exchange_ticket: ticket, audience: 'rafiei-hub' })));
    assertEquals(exchanges.filter(r => r.status === 'fulfilled').length, 1);
    const exchanged = exchanges.find(r => r.status === 'fulfilled'); assert(exchanged?.status === 'fulfilled');
    assertEquals(exchanged.value.source_user_id, String(user.id)); assertEquals(exchanged.value.email_verified, true);
    assertEquals(exchanged.value.phone, null); assertEquals(exchanged.value.phone_verified, false);
    assertEquals(exchanged.value.audience, 'rafiei-hub'); assert(exchanged.value.authenticated_at.endsWith('Z'));
    assertEquals(Object.keys(exchanged.value).sort(), ['source_user_id','email','email_verified','name','phone','phone_verified','authenticated_at','audience'].sort());
    await rejected('auth.otp.verify', { request_id: sent.request_id, code, audience: 'rafiei-hub' }, 401);
    const expiredTicket = randomTicket(), expiredHash = await hmac(`ticket:${expiredTicket}`, secret);
    await checked(db.from('hub_exchange_tickets').insert({ ticket_hash: expiredHash, user_id: user.id, audience: 'rafiei-hub', expires_at: new Date(Date.now() - 1000).toISOString() }));
    await rejected('auth.exchange', { exchange_ticket: expiredTicket, audience: 'rafiei-hub' }, 401);
    assertEquals(await call('account.link', { source_user_id: String(user.id) }), { ok: true });
    const resolved = await checked(db.rpc('hub_resolve_user', { p_hub_user_id: identity.hub_user_id, p_email: mail, p_name: 'different name' }));
    assertEquals(resolved.id, user.id); assertEquals(resolved.name, identity.name);
    // Rebinding an already linked account to another Hub identity is forbidden.
    await checked(db.from('hub_identity_proofs').update({ link_authorized_until: new Date(Date.now() + 60000).toISOString() }).eq('user_id', user.id));
    const conflictReq = new Request(req.url, { headers: { 'X-Hub-User': encodeURIComponent(JSON.stringify({ ...identity, hub_user_id: 'conflicting-hub-id' })) } });
    let conflict: any; try { await handleAuth('account.link', { source_user_id: String(user.id) }, conflictReq, deps); } catch (e) { conflict = e; }
    assertEquals(conflict?.status, 409);
    // Concrete hourly ceiling and gap are enforced by the real hosted RPC.
    for (let i = 0; i < 5; i++) assertEquals(await checked(db.rpc('hub_auth_rate', { p_bucket: `qa-rate-${tag}`, p_max: 5, p_window: 3600, p_gap: 0 })), true);
    assertEquals(await checked(db.rpc('hub_auth_rate', { p_bucket: `qa-rate-${tag}`, p_max: 5, p_window: 3600, p_gap: 0 })), false);
    // Five wrong tries permanently disable that OTP, even when the sixth is correct.
    const exhausted = crypto.randomUUID(), correctHash = await hmac(`otp:${exhausted}:123456`, secret);
    await checked(db.from('hub_auth_requests').insert({ id: exhausted, user_id: user.id, channel: 'email', destination_hash: tag, code_hash: correctHash, verified_email: mail, delivered: true, expires_at: new Date(Date.now()+120000).toISOString() }));
    for (let i = 0; i < 5; i++) assertEquals((await checked(db.rpc('hub_auth_verify', { p_id: exhausted, p_code_hash: 'wrong-hash', p_ticket_hash: randomTicket() }))).error, 'invalid');
    assertEquals((await checked(db.rpc('hub_auth_verify', { p_id: exhausted, p_code_hash: correctHash, p_ticket_hash: randomTicket() }))).error, 'invalid');
    const expiredId = crypto.randomUUID();
    await checked(db.from('hub_auth_requests').insert({ id: expiredId, user_id: user.id, channel: 'email', destination_hash: tag, code_hash: correctHash, delivered: true, expires_at: new Date(Date.now()-1000).toISOString() }));
    assertEquals((await checked(db.rpc('hub_auth_verify', { p_id: expiredId, p_code_hash: correctHash, p_ticket_hash: randomTicket() }))).error, 'invalid');
    console.log('Hosted auth: password, unverified-email guard, OTP race/replay/expiry, five tries/sends, exchange race/expiry, stable identity and 409 conflict passed');
  } finally {
    await checked(db.from('hub_auth_requests').delete().eq('user_id', user.id));
    await checked(db.from('hub_exchange_tickets').delete().eq('user_id', user.id));
    await checked(db.from('hub_identity_proofs').delete().eq('user_id', user.id));
    await checked(db.from('chat_users').delete().eq('id', user.id).eq('signup_source', 'hub-auth-isolated-qa'));
  }
} });