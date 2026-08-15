import { createClient } from 'npm:@supabase/supabase-js@2'

export const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

/* ------------------------------------------------------------------ */
/* Phone normalization                                                 */
/* ------------------------------------------------------------------ */

export interface NormalizedPhone {
  raw: string
  normalized: string | null
  e164: string | null
}

/**
 * Normalizes Iranian and international numbers so that
 * 09123456789 / +989123456789 / 989123456789 / 00989123456789
 * all resolve to the same key: "989123456789".
 * Internal extensions (<= 6 digits) are returned as-is.
 */
export function normalizePhone(input?: string | null): NormalizedPhone {
  const raw = (input ?? '').toString().trim()
  if (!raw) return { raw, normalized: null, e164: null }

  let d = raw.replace(/[^0-9]/g, '')
  if (!d) return { raw, normalized: null, e164: null }

  // internal extension
  if (d.length <= 6) return { raw, normalized: d, e164: null }

  if (d.startsWith('0098')) d = '98' + d.slice(4)
  else if (d.startsWith('0') && d.length === 11) d = '98' + d.slice(1)
  else if (d.length === 10 && d.startsWith('9')) d = '98' + d
  else if (d.startsWith('00')) d = d.slice(2)

  // Iranian landline without country code e.g. 02112345678 handled above
  return { raw, normalized: d, e164: '+' + d }
}

/** Last 9 significant digits – used for fuzzy matching against stored records. */
export function phoneTail(input?: string | null, len = 9): string | null {
  const d = (input ?? '').replace(/[^0-9]/g, '')
  if (d.length < len) return null
  return d.slice(-len)
}

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
    .select('id, name, phone, role, is_messenger_admin, is_support_agent')
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
    role: primaryRole,
    isAdmin,
    restrictedToSelf: !isAdmin && !roleNames.has('sales_manager') && !roleNames.has('enrollments_manager'),
    permissions: [...permissions],
  }
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
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': token,
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

/**
 * Tries the documented candidate endpoints until one responds successfully.
 * DaftareShoma exposes slightly different paths per portal version, so we
 * probe rather than hardcode a single path.
 */
export async function dsTryEndpoints(
  candidates: { path: string; method?: string; body?: unknown; query?: Record<string, any> }[],
): Promise<{ path: string; data: any }> {
  let lastError: unknown = null
  for (const c of candidates) {
    try {
      const data = await dsRequest(c.path, { method: c.method, body: c.body, query: c.query })
      return { path: c.path, data }
    } catch (e) {
      lastError = e
      if (e instanceof ProviderError && (e.status === 401 || e.status === 403)) throw e
    }
  }
  throw lastError ?? new ProviderError('هیچ اندپوینتی پاسخ نداد', 502, null)
}

/* ------------------------------------------------------------------ */
/* Normalizing provider call payloads                                  */
/* ------------------------------------------------------------------ */

const pick = (o: Record<string, any>, keys: string[]) => {
  for (const k of keys) {
    if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== '') return o[k]
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

const toDate = (v: unknown): string | null => {
  if (!v) return null
  if (typeof v === 'number') return new Date(v > 1e12 ? v : v * 1000).toISOString()
  const d = new Date(String(v).replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d.toISOString()
}

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

  const rawDirection = String(pick(rec, ['direction', 'callType', 'call_type', 'type', 'dir']) ?? '').toLowerCase()
  const direction = /out|خروج|outgoing|outbound/.test(rawDirection)
    ? 'outgoing'
    : /in|ورود|incoming|inbound/.test(rawDirection)
      ? 'incoming'
      : 'unknown'

  const rawStatus = String(pick(rec, ['status', 'disposition', 'callStatus', 'call_status', 'result']) ?? '').toLowerCase()
  const talk = toSeconds(pick(rec, ['talkTime', 'talk_time', 'billsec', 'answeredDuration', 'talkDuration']))
  const answeredFlag = pick(rec, ['answered', 'isAnswered', 'is_answered'])
  const answered = answeredFlag === true || /answer|پاسخ داده|success|connected/.test(rawStatus) || talk > 0
  const status = answered
    ? 'answered'
    : /busy|مشغول/.test(rawStatus)
      ? 'busy'
      : /fail|error|congestion/.test(rawStatus)
        ? 'failed'
        : /cancel/.test(rawStatus)
          ? 'cancelled'
          : 'no_answer'

  const caller = pick(rec, ['callerNumber', 'caller_number', 'source', 'src', 'from', 'callerId', 'caller'])
  const destination = pick(rec, ['destinationNumber', 'destination_number', 'destination', 'dst', 'to', 'calleeNumber', 'callee'])
  const cn = normalizePhone(caller ? String(caller) : null)
  const dn = normalizePhone(destination ? String(destination) : null)

  const startedAt = toDate(pick(rec, ['startTime', 'start_time', 'startedAt', 'calldate', 'date', 'created_at', 'callStartTime']))
  const endedAt = toDate(pick(rec, ['endTime', 'end_time', 'endedAt', 'callEndTime', 'hangupTime']))
  const answeredAt = toDate(pick(rec, ['answerTime', 'answer_time', 'answeredAt']))

  const waiting = toSeconds(pick(rec, ['waitingTime', 'waiting_time', 'ringTime', 'ring_time', 'waitTime']))
  const total = toSeconds(pick(rec, ['totalTime', 'total_time', 'duration', 'callDuration'])) || (waiting + talk)

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
    recording_id: recordingId ? String(recordingId) : null,
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
  customer_name: string | null
}

/** Finds the strongest CRM record for a customer phone number. */
export async function matchCrmRecords(customerPhone: string | null): Promise<CrmMatch> {
  const empty: CrmMatch = {
    user_id: null, lead_id: null, consultation_id: null, webinar_registration_id: null,
    order_id: null, agent_id: null, match_confidence: 'unknown', customer_name: null,
  }
  const tail = phoneTail(customerPhone)
  if (!tail) return empty

  const like = `%${tail}`
  const result: CrmMatch = { ...empty }

  // 1. Academy user
  const { data: users } = await admin
    .from('chat_users')
    .select('id, name, full_name, phone')
    .like('phone', like)
    .limit(1)
  if (users?.length) {
    result.user_id = users[0].id
    result.customer_name = users[0].full_name || users[0].name || null
    result.match_confidence = 'user'
  }

  // 2. Enrollment (lead / order)
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('id, full_name, phone, payment_status, created_at, course_id')
    .like('phone', like)
    .order('created_at', { ascending: false })
    .limit(5)
  if (enrollments?.length) {
    const paid = enrollments.find((e: any) => ['completed', 'success'].includes(e.payment_status))
    const lead = enrollments[0]
    result.lead_id = lead.id
    result.order_id = paid?.id ?? null
    result.customer_name ||= lead.full_name ?? null
    if (result.match_confidence === 'unknown') result.match_confidence = 'lead'

    const { data: assignment } = await admin
      .from('lead_assignments')
      .select('sales_agent_id, sales_agents(user_id)')
      .eq('enrollment_id', lead.id)
      .maybeSingle()
    const agentUserId = (assignment as any)?.sales_agents?.user_id
    if (agentUserId) result.agent_id = agentUserId
  }

  // 3. Consultation
  const { data: consultations } = await admin
    .from('consultation_bookings')
    .select('id, phone, full_name, created_at')
    .like('phone', like)
    .order('created_at', { ascending: false })
    .limit(1)
  if (consultations?.length) {
    result.consultation_id = consultations[0].id
    result.customer_name ||= (consultations[0] as any).full_name ?? null
    if (result.match_confidence === 'unknown') result.match_confidence = 'consultation'
  }

  // 4. Webinar registration (webinar_entries hold participants by phone)
  const { data: participants } = await admin
    .from('webinar_participants')
    .select('id, phone, name, created_at')
    .like('phone', like)
    .order('created_at', { ascending: false })
    .limit(1)
  if (participants?.length) {
    result.webinar_registration_id = participants[0].id
    result.customer_name ||= (participants[0] as any).name ?? null
    if (result.match_confidence === 'unknown') result.match_confidence = 'webinar'
  }

  return result
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

export function invokeFn(name: string, body: Record<string, unknown>) {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ ...body, internal: true }),
  }).catch((e) => console.error(`invoke ${name} failed`, e))
}
