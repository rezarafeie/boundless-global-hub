import bcrypt from 'npm:bcryptjs@3.0.2';
import { HubError, parseHubUser } from '../_shared/hub-policy.ts';
import { AUTH_LIMITS, parseAuth, normalizeIdentifier, maskDestination, randomCode, randomTicket, hmac } from './auth-policy.ts';
import type { deliverCode } from './auth-delivery.ts';

type Dependencies = { db: any; onUser: (id: number) => Promise<void>; deliver?: typeof deliverCode };
const dummyHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
export async function handleAuth(action: string, body: unknown, req: Request, dependencies: Dependencies) {
  const { db, onUser } = dependencies;
  const p = parseAuth(action, body);
  const check = async (query: PromiseLike<any>) => {
    const { data, error } = await query;
    if (error) throw new HubError(503, 'سرویس ورود موقتاً در دسترس نیست');
    return data;
  };
  if (action === 'auth.capabilities') {
    const methods = new Set((await check(db.from('hub_auth_readiness').select('method'))).map((r: any) => r.method));
    return { version: 1, password: methods.has('password'), email_otp: methods.has('email_otp'),
      sms_otp: methods.has('sms_otp') && Boolean(Deno.env.get('KAVENEGAR_API_KEY') && Deno.env.get('KAVENEGAR_VERIFY_TEMPLATE')),
      session_exchange: methods.has('session_exchange'), account_link: methods.has('account_link') };
  }
  const secret = Deno.env.get('HUB_AUTH_HMAC_SECRET');
  if (!secret) throw new HubError(503, 'سرویس ورود تنظیم نشده است');
  const hash = (value: string) => hmac(value, secret);
  const rate = async (bucket: string, max: number, window: number, gap = 0) => {
    if (!(await check(db.rpc('hub_auth_rate', { p_bucket: bucket, p_max: max, p_window: window, p_gap: gap }))))
      throw new HubError(429, 'تعداد درخواست‌ها زیاد است؛ کمی صبر کنید');
  };
  // Independent global abuse ceiling cannot be bypassed by forging forwarded-IP headers.
  await rate('hub-auth:global', 300, 60);
  const issue = async (userId: number) => {
    const ticket = randomTicket();
    await check(db.from('hub_exchange_tickets').insert({ ticket_hash: await hash(`ticket:${ticket}`), user_id: userId,
      audience: 'rafiei-hub', expires_at: new Date(Date.now() + AUTH_LIMITS.ticketSeconds * 1000).toISOString() }));
    await onUser(userId);
    return { exchange_ticket: ticket };
  };
  const consume = async (ticket: string, continuation = false) => {
    await rate(`exchange:${await hash(ticket)}`, 10, 60);
    const result = await check(db.rpc('hub_auth_exchange', { p_hash: await hash(`ticket:${ticket}`), p_audience: p.audience, p_email_continuation: continuation }));
    if (result.error === 'email_required') throw new HubError(403, 'ابتدا مالکیت ایمیل واقعی را با auth.email.send تأیید کنید');
    if (result.error) throw new HubError(401, 'تیکت نامعتبر، منقضی یا مصرف‌شده است');
    await onUser(Number(result.user_id || result.source_user_id));
    if (result.authenticated_at) result.authenticated_at = new Date(result.authenticated_at).toISOString();
    return result;
  };
  const send = async (identifier: string, channel: 'email' | 'sms', continuationUser?: number) => {
    const destination = normalizeIdentifier(identifier, channel);
    const destinationHash = await hash(`destination:${destination}`);
    await rate(`send:${destinationHash}`, AUTH_LIMITS.sendsPerHour, 3600, AUTH_LIMITS.retryAfter);
    const user = continuationUser ? { id: continuationUser } : await check(db.rpc('hub_auth_lookup', { p_identifier: destination, p_channel: channel }));
    const requestId = crypto.randomUUID(), code = randomCode();
    await check(db.from('hub_auth_requests').insert({ id: requestId, user_id: user?.id || null, channel,
      destination_hash: destinationHash, code_hash: await hash(`otp:${requestId}:${code}`), verified_email: channel === 'email' ? destination : null,
      verified_phone: channel === 'sms' ? destination.slice(1) : null,
      expires_at: new Date(Date.now() + AUTH_LIMITS.expiresIn * 1000).toISOString() }));
    // Delivery has the same behavior for present, absent and conflicting accounts.
    try {
      const deliver = dependencies.deliver || (await import('./auth-delivery.ts')).deliverCode;
      await deliver(channel, destination, code, requestId);
    }
    catch (error) {
      await check(db.from('hub_auth_requests').update({ consumed_at: new Date().toISOString() }).eq('id', requestId));
      throw error;
    }
    await check(db.from('hub_auth_requests').update({ delivered: true }).eq('id', requestId));
    return { request_id: requestId, expires_in: AUTH_LIMITS.expiresIn, retry_after: AUTH_LIMITS.retryAfter,
      destination: maskDestination(destination, channel), code_length: AUTH_LIMITS.codeLength };
  };
  if (action === 'auth.password') {
    const channel = p.identifier.includes('@') ? 'email' : 'sms';
    const identifier = normalizeIdentifier(p.identifier, channel);
    await rate(`password:${await hash(identifier)}`, 10, 60);
    const user = await check(db.rpc('hub_auth_lookup', { p_identifier: identifier, p_channel: channel }));
    const matches = await bcrypt.compare(p.password, user?.password_hash || dummyHash);
    if (!matches || !user?.password_hash) throw new HubError(401, 'اطلاعات ورود معتبر نیست');
    return issue(user.id);
  }
  if (action === 'auth.otp.send') return send(p.identifier, p.channel);
  if (action === 'auth.email.send') {
    const result = await consume(p.exchange_ticket, true);
    return send(p.email, 'email', result.user_id);
  }
  if (action === 'auth.otp.verify') {
    await rate(`verify:${await hash(p.request_id)}`, 30, 60);
    const ticket = randomTicket();
    const result = await check(db.rpc('hub_auth_verify', { p_id: p.request_id, p_code_hash: await hash(`otp:${p.request_id}:${p.code}`), p_ticket_hash: await hash(`ticket:${ticket}`) }));
    if (result.error === 'conflict' || result.error === 'account_unavailable') throw new HubError(409, 'حساب قابل اتصال نیست؛ بررسی پشتیبانی لازم است');
    if (result.error) throw new HubError(401, 'کد نامعتبر، منقضی یا مصرف‌شده است');
    await onUser(result.user_id);
    return { exchange_ticket: ticket };
  }
  if (action === 'auth.exchange') return consume(p.exchange_ticket);
  if (action === 'account.link') {
    const identity = parseHubUser(req.headers.get('X-Hub-User'));
    const result = await check(db.rpc('hub_link_account', { p_user_id: Number(p.source_user_id), p_hub_user_id: identity.hub_user_id, p_email: identity.email }));
    if (result.error === 'proof_required') throw new HubError(403, 'ابتدا ورود و تبادل حساب را کامل کنید');
    if (result.error) throw new HubError(409, 'شماره، ایمیل یا پیوند حساب متداخل است؛ ادغام خودکار انجام نمی‌شود');
    await onUser(result.user_id);
    return { ok: true };
  }
  throw new HubError(404, 'عملیات ورود یافت نشد');
}