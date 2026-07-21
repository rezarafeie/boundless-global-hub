// NovinHub API helper
// Base: https://api.novinhub.com/token/v2 with Authorization: Bearer <NOVINHUB_API_KEY>

const BASE = 'https://api.novinhub.com/token/v2';

export function getNovinhubToken(): string {
  const t = Deno.env.get('NOVINHUB_API_KEY');
  if (!t) throw new Error('NOVINHUB_API_KEY not configured');
  return t;
}

export async function nhFetch(path: string, init: RequestInit = {}): Promise<any> {
  const token = getNovinhubToken();
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : '/' + path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch (_) {}
  if (!res.ok) {
    const msg = body?.error?.message || text || `HTTP ${res.status}`;
    throw new Error(`NovinHub ${res.status}: ${msg}`);
  }
  return body;
}

export const novinhub = {
  listAccounts: () => nhFetch('/account'),
  listConversations: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return nhFetch(`/conversations${qs ? `?${qs}` : ''}`);
  },
  getConversation: (id: string) => nhFetch(`/conversations/${id}`),
  listMessages: (conversationId: string, params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return nhFetch(`/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);
  },
  reply: (conversationId: string, content: string) =>
    nhFetch(`/conversations/${conversationId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
