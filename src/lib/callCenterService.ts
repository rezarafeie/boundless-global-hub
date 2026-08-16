import { supabase } from '@/integrations/supabase/client';

export const getSessionToken = (): string | null => {
  const cookieToken = document.cookie
    .split('; ')
    .find((item) => item.startsWith('session_token='))
    ?.split('=')[1];
  const raw = localStorage.getItem('messenger_session_token') || cookieToken || null;
  return raw ? decodeURIComponent(raw) : null;
};

async function callFunction<T = any>(name: string, body: Record<string, unknown>): Promise<T> {
  const sessionToken = getSessionToken();
  const { data, error } = await supabase.functions.invoke(name, {
    body: { ...body, sessionToken },
    headers: sessionToken ? { 'x-session-token': sessionToken } : undefined,
  });

  if (error) {
    // Supabase wraps non-2xx responses; try to surface the server message
    const ctxRes = (error as any).context?.response;
    if (ctxRes?.json) {
      try {
        const parsed = await ctxRes.json();
        throw new Error(parsed?.error || error.message);
      } catch (e) {
        if (e instanceof Error && e.message && e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
    throw new Error(error.message);
  }
  if (data && data.success === false) throw new Error(data.error || 'خطای نامشخص');
  return data as T;
}

export type CallDirection = 'incoming' | 'outgoing';

export interface CallRow {
  id: string;
  provider_call_id: string;
  direction: CallDirection;
  status: string;
  disposition: string | null;
  caller_number: string | null;
  destination_number: string | null;
  extension: string | null;
  started_at: string | null;
  answered_at: string | null;
  ended_at: string | null;
  waiting_seconds: number | null;
  talk_seconds: number | null;
  total_seconds: number | null;
  recording_id: string | null;
  user_id: number | null;
  lead_id: string | null;
  consultation_id: string | null;
  webinar_registration_id: string | null;
  order_id: string | null;
  agent_id: number | null;
  match_confidence: string | null;
  notes: string | null;
  processing_status: string | null;
  ai_score: number | null;
  purchase_intent_score: number | null;
  resulted_in_sale: boolean;
  customer_name?: string | null;
  agent_name?: string | null;
  related_course?: string | null;
  call_recordings?: any;
  call_transcripts?: any;
  call_ai_analysis?: any;
  raw_payload?: any;
}

export const callCenter = {
  data: <T = any>(action: string, params: Record<string, unknown> = {}) =>
    callFunction<T>('call-center-data', { action, params }),

  overview: (params: { from?: string; to?: string } = {}) =>
    callFunction('call-center-data', { action: 'overview', params }),

  calls: (params: Record<string, unknown>) =>
    callFunction<{ calls: CallRow[]; total: number; providerTotal: number; page: number; pageSize: number }>(
      'call-center-data', { action: 'calls', params },
    ),

  call: (callId: string) =>
    callFunction<{ call: CallRow; customer: any; orders: any[] }>('call-center-data', { action: 'call', params: { callId } }),

  queues: () => callFunction('call-center-data', { action: 'queues', params: {} }),
  agents: (params: Record<string, unknown> = {}) => callFunction('call-center-data', { action: 'agents', params }),
  agentList: () => callFunction<{ agents: any[] }>('call-center-data', { action: 'agent-list', params: {} }),
  dispositions: () => callFunction<{ dispositions: any[] }>('call-center-data', { action: 'dispositions', params: {} }),
  recordingUrl: (callId: string) => callFunction<{ url: string; mime: string }>('call-center-data', { action: 'recording-url', params: { callId } }),
  transcript: (callId: string) => callFunction<{ transcript: any }>('call-center-data', { action: 'transcript', params: { callId } }),
  lookup: (phone: string) => callFunction<{ match: any; history: any[] }>('call-center-data', { action: 'lookup', params: { phone } }),
  saveOutcome: (params: Record<string, unknown>) => callFunction('call-center-data', { action: 'save-outcome', params }),
  createFollowup: (params: Record<string, unknown>) => callFunction('call-center-data', { action: 'create-followup', params }),
  completeFollowup: (followupId: string, status = 'completed') =>
    callFunction('call-center-data', { action: 'complete-followup', params: { followupId, status } }),
  linkCall: (params: Record<string, unknown>) => callFunction('call-center-data', { action: 'link-call', params }),
  settings: () => callFunction('call-center-data', { action: 'settings', params: {} }),
  saveSettings: (settings: Record<string, unknown>) => callFunction('call-center-data', { action: 'save-settings', params: { settings } }),
  saveRule: (rule: Record<string, unknown>) => callFunction('call-center-data', { action: 'save-rule', params: { rule } }),
  deleteRule: (ruleId: string) => callFunction('call-center-data', { action: 'delete-rule', params: { ruleId } }),
  agentExtensions: () => callFunction<{ extensions: any[]; myEmail: string | null; readOnly: boolean }>(
    'call-center-data', { action: 'agent-extensions', params: {} }),
  saveAgentExtension: (extension: Record<string, unknown>) =>
    callFunction('call-center-data', { action: 'save-agent-extension', params: { extension } }),
  deleteAgentExtension: (id: string) =>
    callFunction('call-center-data', { action: 'delete-agent-extension', params: { id } }),
  myExtension: () => callFunction<{ extension: string | null; source: string; email: string | null }>(
    'call-center-data', { action: 'my-extension', params: {} }),
  auditLogs: () => callFunction<{ logs: any[] }>('call-center-data', { action: 'audit-logs', params: {} }),

  // actions
  dial: (params: {
    phone: string; extension?: string; userId?: number | null; leadId?: string | null;
    consultationId?: string | null; webinarRegistrationId?: string | null; source?: string;
  }) =>
    callFunction<{ callId: string; providerCallId: string; message: string }>('daftareshoma-outgoing-call', params),
  testConnection: () => callFunction('daftareshoma-test-connection', {}),
  syncNow: (full = false, params: { from?: string; to?: string; allTimeCount?: boolean } = {}) =>
    callFunction('sync-daftareshoma-calls', { full, ...params }),
  reprocess: (callId: string, stage: 'auto' | 'recording' | 'transcript' | 'analysis' = 'auto') =>
    callFunction('reprocess-call', { callId, stage }),
};

export const formatDuration = (seconds?: number | null) => {
  const s = Math.max(0, Math.round(seconds ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

export const tehranDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fa-IR', {
    timeZone: 'Asia/Tehran',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

export const STATUS_LABELS: Record<string, string> = {
  answered: 'پاسخ داده شده',
  no_answer: 'بی‌پاسخ',
  busy: 'مشغول',
  failed: 'ناموفق',
  cancelled: 'لغو شده',
  initiated: 'در حال برقراری',
  ringing: 'در حال زنگ خوردن',
};

export const DIRECTION_LABELS: Record<string, string> = {
  incoming: 'ورودی',
  outgoing: 'خروجی',
};

export const PRIORITY_LABELS: Record<string, string> = {
  critical: 'بحرانی',
  high: 'بالا',
  medium: 'متوسط',
  low: 'پایین',
};
