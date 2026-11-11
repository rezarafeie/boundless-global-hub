import { createClient } from 'npm:@supabase/supabase-js@2'

export const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

/* ------------------------------------------------------------------ */
/* Phone normalization                                                 */
/* ------------------------------------------------------------------ */

export { normalizePhone, phoneTail } from './call-phone.ts'
import { normalizePhone, phoneTail } from './call-phone.ts'

/* ------------------------------------------------------------------ */
/* Permissions                                                         */
/* ------------------------------------------------------------------ */

export type Permission =
  | 'calls.view'
  | 'calls.create'
  | 'calls.listen_recording'
  | 'calls.view_transcript'
  | 'calls.manage'
  | 'calls.analytics'
  | 'calls.ai_analysis'
  | 'calls.admin'

const ALL: Permission[] = [
  'calls.view', 'calls.create', 'calls.listen_recording', 'calls.view_transcript',
  'calls.manage', 'calls.analytics', 'calls.ai_analysis', 'calls.admin',
]

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ALL,
  enrollments_manager: ['calls.view', 'calls.create', 'calls.listen_recording', 'calls.view_transcript', 'calls.manage', 'calls.analytics'],
  sales_manager: ['calls.view', 'calls.create', 'calls.listen_recording', 'calls.view_transcript', 'calls.manage', 'calls.analytics', 'calls.ai_analysis'],
  sales_agent: ['calls.view', 'calls.create', 'calls.listen_recording', 'calls.view_transcript', 'calls.manage'],
  support_agent: ['calls.view', 'calls.create'],
}

export interface AuthContext {
  userId: number
  name: string
  phone: string | null
  email: string | null
  role: string
  isAdmin: boolean
  /** sales agents are restricted to their own calls */
  restrictedToSelf: boolean
  permissions: Permission[]
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

/** Validates the Rafiei session token (header `x-session-token` or body field). */
export async function authenticate(req: Request, bodyToken?: string): Promise<AuthContext> {
  const token = req.headers.get('x-session-token') || bodyToken || ''
  if (!token) throw new AuthError('نشست معتبر نیست', 401)

  const { data: session } = await admin
    .from('user_sessions')
    .select('user_id, is_active, last_activity')
    .eq('session_token', token)
    .eq('is_active', true)
    .maybeSingle()

  if (!session?.user_id) throw new AuthError('نشست معتبر نیست', 401)

  const lastActivity = session.last_activity ? new Date(session.last_activity).getTime() : 0
  if (Date.now() - lastActivity > 24 * 60 * 60 * 1000) throw new AuthError('نشست منقضی شده است', 401)

  const { data: user } = await admin
    .from('chat_users')
    .select('id, name, phone, email, role, is_messenger_admin, is_support_agent')
    .eq('id', session.user_id)
    .maybeSingle()

  if (!user) throw new AuthError('کاربر یافت نشد', 401)

  const { data: extraRoles } = await admin
    .from('user_roles')
    .select('role_name')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const roleNames = new Set<string>([user.role ?? 'user', ...(extraRoles ?? []).map((r: any) => r.role_name)])
  if (user.is_messenger_admin) roleNames.add('admin')
  if (user.is_support_agent) roleNames.add('support_agent')

  const isAdmin = roleNames.has('admin')
  const permissions = new Set<Permission>()
  for (const r of roleNames) (ROLE_PERMISSIONS[r] ?? []).forEach((p) => permissions.add(p))

  const primaryRole = isAdmin
    ? 'admin'
    : roleNames.has('sales_manager')
      ? 'sales_manager'
      : roleNames.has('enrollments_manager')
        ? 'enrollments_manager'
        : roleNames.has('sales_agent')
          ? 'sales_agent'
          : roleNames.has('support_agent')
            ? 'support_agent'
            : 'user'

  return {
    userId: user.id,
    name: user.name ?? '',
    phone: user.phone ?? null,
    email: (user as any).email ?? null,
    role: primaryRole,
    isAdmin,
    restrictedToSelf: !isAdmin && !roleNames.has('sales_manager') && !roleNames.has('enrollments_manager'),
    permissions: [...permissions],
  }
}

/**
 * Resolves the agent phone that DaftareShoma calls first for a click-to-call.
 * The legacy DB column is named `extension`, but OutgoingCall requires this value
 * in `from_number` and rejects short PBX extensions. The academy line is sent
 * separately as `caller_extension`.
 */
export async function resolveAgentExtension(
  ctx: AuthContext,
  requested?: string | null,
  fallbackDefault?: string | null,
): Promise<{ extension: string | null; source: string }> {
  const clean = (v?: string | null) => {
    const d = (v ?? '').replace(/[^0-9]/g, '')
    return d || null
  }

  const asLocalDialNumber = (value?: string | null) => {
    const digits = clean(value)
    if (!digits || digits.length < 7) return null
    if (digits.startsWith('98')) return '0' + digits.slice(2)
    if (digits.length === 10 && digits.startsWith('9')) return '0' + digits
    return digits
  }

  if (requested && (ctx.isAdmin || !ctx.restrictedToSelf)) {
    const ext = asLocalDialNumber(requested)
    if (ext) return { extension: ext, source: 'manual' }
  }

  let mapping: any = null
  if (ctx.email) {
    const { data } = await admin
      .from('call_agent_extensions')
      .select('extension, is_active')
      .ilike('email', ctx.email)
      .maybeSingle()
    if (data?.is_active) mapping = data
  }
  if (!mapping) {
    const { data } = await admin
      .from('call_agent_extensions')
      .select('extension, is_active')
      .eq('user_id', ctx.userId)
      .maybeSingle()
    if (data?.is_active) mapping = data
  }
  const mappedPhone = asLocalDialNumber(mapping?.extension)
  if (mappedPhone) return { extension: mappedPhone, source: 'agent_mapping' }

  const fallback = asLocalDialNumber(fallbackDefault)
  if (fallback) return { extension: fallback, source: 'default_extension' }

  const accountPhone = asLocalDialNumber(ctx.phone)
  if (accountPhone) return { extension: accountPhone, source: 'account_phone' }

  return { extension: null, source: 'none' }
}

export function requirePermission(ctx: AuthContext, permission: Permission) {
  if (!ctx.permissions.includes(permission)) {
    throw new AuthError('شما دسترسی لازم برای این عملیات را ندارید', 403)
  }
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export async function audit(
  ctx: AuthContext | null,
  action: string,
  entity: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    await admin.from('call_audit_logs').insert({
      actor_id: ctx?.userId ?? null,
      actor_name: ctx?.name ?? 'system',
      action,
      entity,
      entity_id: entityId ?? null,
      metadata,
    })
  } catch (e) {
    console.error('audit log failed', e)
  }
}

/* ------------------------------------------------------------------ */
/* Rate limiting (DB backed, per actor + action)                       */
/* ------------------------------------------------------------------ */

export async function checkRateLimit(actorId: number, action: string, max: number, windowSeconds: number) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString()
  const { count } = await admin
    .from('call_audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', actorId)
    .eq('action', action)
    .gte('created_at', since)

  if ((count ?? 0) >= max) {
    throw new AuthError('تعداد درخواست‌ها بیش از حد مجاز است. کمی صبر کنید.', 429)
  }
}

/* ------------------------------------------------------------------ */
/* DaftareShoma API client                                             */
/* ------------------------------------------------------------------ */

const DS_BASE = (Deno.env.get('DAFTARESHOMA_BASE_URL') || 'https://coreapi.daftareshoma.com').replace(/\/+$/, '')

export class ProviderError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function dsRequest(
  path: string,
  opts: { method?: string; body?: unknown; query?: Record<string, string | number | undefined>; raw?: boolean; timeoutMs?: number } = {},
): Promise<any> {
  const token = Deno.env.get('DAFTARESHOMA_API_TOKEN')
  if (!token) throw new ProviderError('DAFTARESHOMA_API_TOKEN تنظیم نشده است', 500, null)

  const url = new URL(DS_BASE + (path.startsWith('/') ? path : '/' + path))
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000)

  try {
    const res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers: {
        // Verified Customize API uses Bearer authentication.
        'Authorization': `Bearer ${token.replace(/^Bearer\s+/i, '')}`,
        'Accept': 'application/json',
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    })

    if (opts.raw) {
      if (!res.ok) throw new ProviderError(`خطای سرویس تلفنی (${res.status})`, res.status, await res.text().catch(() => ''))
      return res
    }

    const text = await res.text()
    let parsed: unknown = text
    try { parsed = text ? JSON.parse(text) : null } catch { /* keep text */ }

    if (!res.ok) {
      const msg = res.status === 401 || res.status === 403
        ? 'توکن دفتر شما معتبر نیست یا دسترسی ندارد'
        : res.status === 429
          ? 'محدودیت نرخ درخواست سرویس تلفنی'
          : `خطای سرویس تلفنی (${res.status})`
      throw new ProviderError(msg, res.status, parsed)
    }
    return parsed
  } catch (e) {
    if (e instanceof ProviderError) throw e
    if ((e as Error).name === 'AbortError') throw new ProviderError('پاسخ سرویس تلفنی دریافت نشد (timeout)', 504, null)
    throw new ProviderError((e as Error).message || 'خطای ارتباط با سرویس تلفنی', 502, null)
  } finally {
    clearTimeout(timer)
  }
}

/** Portal call-history API. This endpoint uses the customer-admin JWT with a
 * Bearer prefix, unlike the public Customize API which expects a raw token. */
export async function dsPortalRequest(
  path: string,
  body: unknown,
  timeoutMs = 25000,
): Promise<any> {
  const token = Deno.env.get('DAFTARESHOMA_PORTAL_TOKEN')
  if (!token) throw new ProviderError('DAFTARESHOMA_PORTAL_TOKEN تنظیم نشده است', 500, null)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(DS_BASE + (path.startsWith('/') ? path : '/' + path), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}`,
        Accept: 'application/json',
        'Accept-Language': 'fa',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const text = await res.text()
    let parsed: unknown = text
    try { parsed = text ? JSON.parse(text) : null } catch { /* keep text */ }
    if (!res.ok) {
      const message = res.status === 401 || res.status === 403
        ? 'توکن پنل دفترشما منقضی یا نامعتبر است'
        : `خطای سرویس تلفنی (${res.status})`
      throw new ProviderError(message, res.status, parsed)
    }
    return parsed
  } catch (e) {
    if (e instanceof ProviderError) throw e
    if ((e as Error).name === 'AbortError') throw new ProviderError('پاسخ پنل دفترشما دریافت نشد (timeout)', 504, null)
    throw new ProviderError((e as Error).message || 'خطای ارتباط با پنل دفترشما', 502, null)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Tries the documented candidate endpoints until one responds successfully.
 * DaftareShoma exposes slightly different paths per portal version, so we
 * probe rather than hardcode a single path.
 */
export async function dsTryEndpoints(
  candidates: { path: string; method?: string; body?: unknown; query?: Record<string, any> }[],
): Promise<{ path: string; body?: unknown; data: any; attempts: { path: string; status: number; message: string; body?: unknown }[] }> {
  let lastError: unknown = null
  const attempts: { path: string; status: number; message: string; body?: unknown }[] = []
  for (const c of candidates) {
    try {
      const data = await dsRequest(c.path, { method: c.method, body: c.body, query: c.query })
      return { path: c.path, body: c.body, data, attempts }
    } catch (e) {
      lastError = e
      if (e instanceof ProviderError) {
        const snippet = typeof e.body === 'string' ? e.body.slice(0, 300) : e.body
        attempts.push({ path: c.path, status: e.status, message: e.message, body: snippet })
        if (e.status === 401 || e.status === 403) {
          ;(e as any).attempts = attempts
          throw e
        }
      } else {
        attempts.push({ path: c.path, status: 0, message: (e as Error).message })
      }
    }
  }
  const err = lastError instanceof ProviderError
    ? lastError
    : new ProviderError('هیچ اندپوینتی پاسخ نداد', 502, null)
  ;(err as any).attempts = attempts
  throw err
}


/* ------------------------------------------------------------------ */
/* Normalizing provider call payloads                                  */
/* ------------------------------------------------------------------ */

const pick = (o: Record<string, any>, keys: string[]) => {
  for (const k of keys) {
    if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== '') return o[k]
  }
  const wanted = new Set(keys.map((key) => key.toLowerCase()))
  for (const [key, value] of Object.entries(o ?? {})) {
    if (wanted.has(key.toLowerCase()) && value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

const toSeconds = (v: unknown): number => {
  if (v === undefined || v === null || v === '') return 0
  if (typeof v === 'number') return Math.max(0, Math.round(v))
  const s = String(v)
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  const parts = s.split(':').map((p) => parseInt(p, 10) || 0)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

/**
 * DaftareShoma returns naive timestamps in **UTC** (`persianTime` carries the
 * Tehran rendering of the same instant). Treat any string without an explicit
 * offset as UTC.
 */
const toDate = (v: unknown): string | null => {
  if (!v) return null
  if (typeof v === 'number') return new Date(v > 1e12 ? v : v * 1000).toISOString()
  let s = String(v).trim().replace(' ', 'T')
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) s += 'Z'
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d.toISOString()
}


/** Formats a UTC instant as a naive Tehran-local string the provider understands. */
export const tehranNaive = (d: Date, sep = 'T'): string =>
  new Date(d.getTime() + 3.5 * 3600 * 1000).toISOString().slice(0, 19).replace('T', sep)


export interface NormalizedCall {
  provider_call_id: string
  direction: string
  status: string
  caller_number: string | null
  caller_number_normalized: string | null
  destination_number: string | null
  destination_number_normalized: string | null
  extension: string | null
  started_at: string | null
  answered_at: string | null
  ended_at: string | null
  waiting_seconds: number
  talk_seconds: number
  total_seconds: number
  recording_id: string | null
  raw_payload: Record<string, unknown>
}

export function normalizeProviderCall(rec: Record<string, any>): NormalizedCall | null {
  const id = pick(rec, ['uniqueId', 'uniqueid', 'unique_id', 'callId', 'call_id', 'id', 'uuid'])
  if (id === undefined) return null

  const rawDirection = String(pick(rec, ['direction', 'directionType', 'callType', 'call_type', 'type', 'dir']) ?? '').toLowerCase()
  const direction = /^out|outgoing|outbound|خروج/.test(rawDirection)
    ? 'outgoing'
    : /^in(coming)?$|inbound|ورود/.test(rawDirection)
      ? 'incoming'
      : /internal|داخلی/.test(rawDirection)
        ? 'internal'
        : 'unknown'

  const rawStatus = String(
    pick(rec, ['reportDispositionType', 'status', 'disposition', 'callStatus', 'call_status', 'result']) ?? '',
  ).toLowerCase()
  const talk = toSeconds(pick(rec, ['talkTime', 'talk_time', 'billsec', 'answeredDuration', 'talkDuration', 'duration']))
  const answeredFlag = pick(rec, ['answered', 'isAnswered', 'is_answered'])
  const answered = answeredFlag === true
    || (/answer|پاسخ داده|success|connected/.test(rawStatus) && !/noanswer|no_answer|missed/.test(rawStatus))
    || (talk > 0 && !/noanswer|no_answer|missed|blocked/.test(rawStatus))
  const status = answered
    ? 'answered'
    : /busy|مشغول/.test(rawStatus)
      ? 'busy'
      : /block/.test(rawStatus)
        ? 'failed'
        : /fail|error|congestion/.test(rawStatus)
          ? 'failed'
          : /cancel/.test(rawStatus)
            ? 'cancelled'
            : 'no_answer'

  const caller = pick(rec, ['fromNumber', 'callerNumber', 'caller_number', 'source', 'src', 'from', 'callerId', 'caller'])
  const destination = pick(rec, ['toNumber', 'destinationNumber', 'destination_number', 'destination', 'dst', 'to', 'calleeNumber', 'callee'])
  const cn = normalizePhone(caller ? String(caller) : null)
  const dn = normalizePhone(destination ? String(destination) : null)

  const startedAt = toDate(pick(rec, ['startTime', 'start_time', 'startedAt', 'calldate', 'date', 'created_at', 'callStartTime']))
  const endedAt = toDate(pick(rec, ['endTime', 'end_time', 'endedAt', 'callEndTime', 'hangupTime']))
  const answeredAt = toDate(pick(rec, ['answerTime', 'answer_time', 'answeredAt']))

  const waiting = toSeconds(pick(rec, ['waitingTime', 'waiting_time', 'ringTime', 'ring_time', 'waitTime']))
  const total = toSeconds(pick(rec, ['totalCallTime', 'totalTime', 'total_time', 'duration', 'callDuration'])) || (waiting + talk)

  const recordingId = pick(rec, ['recordingId', 'recording_id', 'recordId', 'record_id', 'recordingFile', 'recordFile'])

  return {
    provider_call_id: String(id),
    direction,
    status,
    caller_number: caller ? String(caller) : null,
    caller_number_normalized: cn.normalized,
    destination_number: destination ? String(destination) : null,
    destination_number_normalized: dn.normalized,
    extension: (() => {
      const ext = pick(rec, ['extension', 'ext', 'agentExtension', 'agent_extension', 'internalNumber'])
      return ext ? String(ext) : direction === 'outgoing' ? cn.normalized : dn.normalized
    })(),
    started_at: startedAt,
    answered_at: answeredAt ?? (answered ? startedAt : null),
    ended_at: endedAt,
    waiting_seconds: waiting,
    talk_seconds: talk,
    total_seconds: total,
    recording_id: recordingId && String(recordingId) !== '00000000-0000-0000-0000-000000000000' ? String(recordingId) : null,
    raw_payload: rec,
  }
}

/* ------------------------------------------------------------------ */
/* CRM matching                                                        */
/* ------------------------------------------------------------------ */

export interface CrmMatch {
  user_id: number | null
  lead_id: string | null
  consultation_id: string | null
  webinar_registration_id: string | null
  order_id: string | null
  agent_id: number | null
  match_confidence: string
  match_status?: string
  customer_name: string | null
}

/** Finds the strongest CRM record for a customer phone number. */
export async function matchCrmRecords(customerPhone: string | null): Promise<CrmMatch> {
  const empty: CrmMatch = {
    user_id: null, lead_id: null, consultation_id: null, webinar_registration_id: null,
    order_id: null, agent_id: null, match_confidence: 'unknown', customer_name: null,
  }
  const canonical = normalizePhone(customerPhone).normalized
  if (!canonical) return empty
  const tables = ['chat_users', 'enrollments', 'consultation_bookings', 'webinar_participants']
  const rows = await Promise.all(tables.map(async source_table => {
    const { data, error } = await admin.rpc('callcenter_phone_records', { source_table, canonical_phone: canonical })
    if (error) throw new Error(error.message)
    return (data ?? []).map((r: any) => r.record)
  }))
  const [users, enrollments, consultations, participants] = rows
  const identities = new Set(users.map((r: any) => String(r.id)))
  for (const list of rows.slice(1)) for (const r of list) if (r.user_id) identities.add(String(r.user_id))
  if (identities.size > 1) return { ...empty, match_status: 'ambiguous' }
  const lead = enrollments[0], user = users[0]
  const paid = enrollments.find((r: any) => ['completed','success','paid'].includes(r.payment_status))
  const { data: facts, error } = await admin.rpc('callcenter_caller_facts', { canonical_phone: canonical, at_time: new Date().toISOString() })
  if (error) throw new Error(error.message)
  return { ...empty, user_id: user?.id ?? (identities.size ? Number([...identities][0]) : null),
    lead_id: lead?.id ?? null, order_id: paid?.id ?? null,
    consultation_id: consultations[0]?.id ?? null, webinar_registration_id: participants[0]?.id ?? null,
    agent_id: facts?.assignedAgentId ?? null, customer_name: user?.full_name || user?.name || lead?.full_name || null,
    match_confidence: user ? 'user' : lead ? 'lead' : consultations.length ? 'consultation' : participants.length ? 'webinar' : 'unknown',
    match_status: rows.some(r => r.length) ? 'matched' : 'unmatched' }

}

/** Determines which side of the call is the customer. */
export function customerNumberOf(call: { direction: string; caller_number_normalized: string | null; destination_number_normalized: string | null }) {
  return call.direction === 'outgoing' ? call.destination_number_normalized : call.caller_number_normalized
}

/** Resolves the internal agent (chat_users.id) from an extension or agent phone. */
export async function resolveAgentByExtension(extension: string | null): Promise<number | null> {
  if (!extension) return null
  const tail = phoneTail(extension)
  if (tail) {
    const { data } = await admin.from('chat_users').select('id').like('phone', `%${tail}`).limit(1)
    if (data?.length) return data[0].id
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export async function getSettings() {
  const { data } = await admin.from('call_center_settings').select('*').eq('id', 1).maybeSingle()
  return data ?? {
    enabled: true, auto_sync_enabled: true, recording_sync_enabled: true,
    transcription_enabled: false, ai_analysis_enabled: false, auto_lead_matching: true,
    auto_missed_call_followup: true, attribution_window_days: 7, min_call_seconds_for_ai: 30,
    default_extension: null, notifications_enabled: true,
    missed_call_priority_rules: {},
  }
}

export const json = (body: unknown, status = 200, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })

/* ------------------------------------------------------------------ */
/* Async job dispatch (fire-and-forget between edge functions)         */
/* ------------------------------------------------------------------ */

export async function invokeFn(name: string, body: Record<string, unknown>) {
  const secret = Deno.env.get('CALLCENTER_INTERNAL_SECRET')
  if (!secret) throw new Error('Internal dispatch is not configured')
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'x-internal-secret': secret },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`Function ${name} returned ${response.status}`)
    return response
  } catch (error) { console.error('Internal dispatch failed', name); throw error }
}

export function secretEquals(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false
  const a = new TextEncoder().encode(provided), b = new TextEncoder().encode(expected)
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}
export async function requireInternalOrAdmin(req: Request) {
  if (secretEquals(req.headers.get('x-internal-secret'), Deno.env.get('CALLCENTER_INTERNAL_SECRET')) ||
      secretEquals(req.headers.get('x-cron-key'), Deno.env.get('CALLCENTER_CRON_KEY'))) return
  const ctx = await authenticate(req)
  if (!ctx.isAdmin) throw new AuthError('Admin required', 403)
}
export async function requireCallAccess(ctx: AuthContext, id: string) {
  let q = admin.from('calls').select('id').eq('id', id)
  if (ctx.restrictedToSelf) q = q.eq('agent_id', ctx.userId)
  const { data, error } = await q.maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new AuthError('Call not found', 404)
}
export async function enrichCall(call: any, settings: any) {
  if (settings.auto_missed_call_followup && call.ended_at && call.direction === 'incoming' && call.status !== 'answered') {
    const { error } = await admin.from('call_followups').insert({ call_id: call.id, user_id: call.user_id,
      lead_id: call.lead_id, agent_id: call.agent_id, type: 'missed_call', status: 'pending',
      priority: call.lead_id ? 'high' : 'medium', title: 'بازگشت تماس از دست رفته',
      due_at: new Date(Date.now()+1800000).toISOString(), created_by: 'automation' })
    if (error) throw new Error(error.message)
  }
}
