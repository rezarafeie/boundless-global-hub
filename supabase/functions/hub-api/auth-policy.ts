import { z } from 'npm:zod@3.23.8';
import { HubError } from '../_shared/hub-policy.ts';

export const AUTH_LIMITS = { codeLength: 6, expiresIn: 120, retryAfter: 60, attempts: 5, sendsPerHour: 5, ticketSeconds: 60 } as const;
const identifier = z.string().trim().min(3).max(254);
const audience = z.literal('rafiei-hub');
const ticket = z.string().regex(/^[a-f0-9]{64}$/);
export const authSchemas = {
  'auth.capabilities': z.object({}).strict(),
  'auth.password': z.object({ identifier, password: z.string().min(1).max(1024), audience }).strict(),
  'auth.otp.send': z.object({ identifier, channel: z.enum(['email', 'sms']), purpose: z.literal('login') }).strict(),
  'auth.otp.verify': z.object({ request_id: z.string().uuid(), code: z.string().regex(/^\d{6}$/), audience }).strict(),
  'auth.exchange': z.object({ exchange_ticket: ticket, audience }).strict(),
  'auth.email.send': z.object({ exchange_ticket: ticket, email: z.string().trim().email().max(254), audience }).strict(),
  'account.resolve': z.object({ email_verified: z.literal(true), create_if_missing: z.literal(false) }).strict(),
  'account.link': z.object({ source_user_id: z.string().regex(/^[1-9]\d{0,9}$/) }).strict(),
};
export function parseAuth(action: string, body: unknown): Record<string, any> {
  const schema = authSchemas[action as keyof typeof authSchemas];
  if (!schema) throw new HubError(404, 'عملیات ورود یافت نشد');
  const result = schema.safeParse(body);
  if (!result.success) throw new HubError(400, 'اطلاعات ورود معتبر نیست');
  return result.data;
}
export function normalizeIdentifier(raw: string, channel: 'email' | 'sms') {
  if (channel === 'email') {
    const result = z.string().email().max(254).safeParse(raw.trim().toLowerCase());
    if (!result.success) throw new HubError(400, 'ایمیل معتبر نیست');
    return result.data;
  }
  const digits = raw.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\s()-]/g, '');
  const match = /^(?:\+98|0098|98|0)?(9\d{9})$/.exec(digits);
  if (!match) throw new HubError(400, 'شماره موبایل ایران معتبر نیست');
  return `+98${match[1]}`;
}
export function maskDestination(value: string, channel: 'email' | 'sms') {
  if (channel === 'sms') return `${value.slice(0, 5)}******${value.slice(-2)}`;
  const [local, domain] = value.split('@');
  return `${local[0]}***@${domain[0]}***.${domain.split('.').at(-1)}`;
}
export function randomTicket() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}
export function randomCode() {
  const buffer = new Uint32Array(1);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= 4294000000);
  return String(buffer[0] % 1000000).padStart(6, '0');
}
export async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}