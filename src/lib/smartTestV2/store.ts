import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_CONTENT, type ContentBlock } from '@/data/smartTestV2/content';

export const V2_VERSION = 'boundless_smart_test_v2';
const SESSION_STORAGE_KEY = 'stv2_session_key';
const LOCAL_STATE_KEY = 'stv2_state';

export function getSessionKey(): string {
  let key = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!key) {
    key = `stv2_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, key);
  }
  return key;
}

export type LocalState = {
  submissionId: string | null;
  stepIndex: number;
  answers: Record<string, string | string[]>;
  startedAt: number;
};

export function loadLocalState(): LocalState | null {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    return raw ? (JSON.parse(raw) as LocalState) : null;
  } catch {
    return null;
  }
}

export function saveLocalState(state: LocalState) {
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function clearLocalState() {
  localStorage.removeItem(LOCAL_STATE_KEY);
}

export async function loadContent(): Promise<Record<string, ContentBlock>> {
  const merged: Record<string, ContentBlock> = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  try {
    const { data } = await supabase.from('smart_test_v2_config' as any).select('key, value');
    for (const row of (data as any[]) || []) {
      if (!row?.key?.startsWith('block:')) continue;
      const k = row.key.slice(6);
      merged[k] = { ...(merged[k] || { key: k, title: '', body: [] }), ...(row.value || {}) };
    }
  } catch { /* defaults are fine */ }
  return merged;
}

export async function saveContentBlock(block: ContentBlock) {
  const { error } = await supabase
    .from('smart_test_v2_config' as any)
    .upsert({ key: `block:${block.key}`, value: block as any }, { onConflict: 'key' });
  if (error) throw error;
}

export async function createSubmission(payload: Record<string, any>): Promise<string | null> {
  const { data, error } = await supabase
    .from('smart_test_v2_submissions' as any)
    .insert({ version: V2_VERSION, session_key: getSessionKey(), ...payload })
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('stv2 create failed', error);
    return null;
  }
  return (data as any)?.id ?? null;
}

export async function updateSubmission(id: string, payload: Record<string, any>) {
  const { error } = await supabase.from('smart_test_v2_submissions' as any).update(payload).eq('id', id);
  if (error) console.error('stv2 update failed', error);
}

export async function fetchSubmission(id: string) {
  const { data } = await supabase
    .from('smart_test_v2_submissions' as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data as any;
}

export function trackEvent(
  submissionId: string | null,
  eventType: string,
  stepKey?: string,
  metadata: Record<string, any> = {},
) {
  supabase
    .from('smart_test_v2_events' as any)
    .insert({ submission_id: submissionId, session_key: getSessionKey(), event_type: eventType, step_key: stepKey, metadata })
    .then(() => {}, () => {});
}
