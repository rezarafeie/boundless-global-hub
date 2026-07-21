// NovinHub API helper
// Base: https://api.novinhub.com/token/v2 with Authorization: Bearer <NOVINHUB_API_KEY>
// Docs: https://novinhub.com/developers

const BASE = 'https://api.novinhub.com/token/v2';

export function getNovinhubToken(): string {
  const t = Deno.env.get('NOVINHUB_API_KEY');
  if (!t) throw new Error('NOVINHUB_API_KEY not configured');
  return t;
}

async function parseBody(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

/** JSON call */
export async function nhFetch(path: string, init: RequestInit = {}): Promise<any> {
  const token = getNovinhubToken();
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : '/' + path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...init, headers });
  const body = await parseBody(res);
  if (!res.ok) {
    const msg = body?.error?.message || (typeof body === 'string' ? body : JSON.stringify(body)) || `HTTP ${res.status}`;
    throw new Error(`NovinHub ${res.status}: ${msg}`);
  }
  return body;
}

/** Form-urlencoded POST (used by most POST endpoints that don't upload files) */
export async function nhForm(path: string, params: Record<string, any>, method = 'POST'): Promise<any> {
  const token = getNovinhubToken();
  const url = `${BASE}${path.startsWith('/') ? path : '/' + path}`;
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) form.append(`${k}[]`, String(item));
    } else if (typeof v === 'object') {
      form.append(k, JSON.stringify(v));
    } else {
      form.append(k, String(v));
    }
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const body = await parseBody(res);
  if (!res.ok) {
    const msg = body?.error?.message || (typeof body === 'string' ? body : JSON.stringify(body)) || `HTTP ${res.status}`;
    throw new Error(`NovinHub ${res.status}: ${msg}`);
  }
  return body;
}

/** Upload a file to NovinHub. Returns the created File object (with `id`). */
export async function nhUploadFile(fileBlob: Blob, filename: string): Promise<any> {
  const token = getNovinhubToken();
  const form = new FormData();
  form.append('file', fileBlob, filename);
  const res = await fetch(`${BASE}/file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: form,
  });
  const body = await parseBody(res);
  if (!res.ok) {
    const msg = body?.error?.message || (typeof body === 'string' ? body : JSON.stringify(body)) || `HTTP ${res.status}`;
    throw new Error(`NovinHub upload ${res.status}: ${msg}`);
  }
  return body?.data ?? body;
}

/** Download a URL then upload to NovinHub /file, return the new file id. */
export async function nhUploadFromUrl(url: string): Promise<{ id: number | string; mime: string; }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch media ${r.status}: ${url}`);
  const mime = r.headers.get('content-type') || 'application/octet-stream';
  const blob = await r.blob();
  const clean = url.split('?')[0];
  const name = clean.substring(clean.lastIndexOf('/') + 1) || `upload-${Date.now()}`;
  const file = await nhUploadFile(new Blob([blob], { type: mime }), name);
  const id = file?.id ?? file?.data?.id;
  if (!id) throw new Error(`NovinHub upload: missing file id in response ${JSON.stringify(file).slice(0, 200)}`);
  return { id, mime };
}

export const novinhub = {
  listAccounts: () => nhFetch('/account'),

  listConversations: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return nhFetch(`/conversation${qs ? `?${qs}` : ''}`);
  },

  getConversation: (id: string | number) => nhFetch(`/conversation/${id}`),

  listMessages: (conversationId: string | number, params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return nhFetch(`/conversation/${conversationId}/messages${qs ? `?${qs}` : ''}`);
  },

  /** Reply to a conversation. `content` is the body text. */
  reply: (conversationId: string | number, content: string) =>
    nhForm(`/conversation/${conversationId}/reply`, { content }),

  /** Fetch live posts from a social account (Instagram supported). */
  fetchAccountPosts: (accountId: string | number, params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return nhFetch(`/account/${accountId}/fetch-posts${qs ? `?${qs}` : ''}`);
  },

  uploadFile: nhUploadFile,
  uploadFromUrl: nhUploadFromUrl,

  /**
   * Create a post on NovinHub.
   * mediaUrls are downloaded then uploaded to /file first; their ids are passed as media_ids.
   */
  async publishPost(payload: {
    account_id: string | number;
    caption?: string;
    media_urls?: string[];
    // 'post' | 'reel' | 'story'
    type?: string;
    is_scheduled?: 0 | 1;
    schedule_date?: number; // UTC epoch seconds
  }) {
    const media_ids: (number | string)[] = [];
    let firstMime = '';
    for (const url of payload.media_urls || []) {
      const { id, mime } = await nhUploadFromUrl(url);
      media_ids.push(id);
      if (!firstMime) firstMime = mime;
    }

    // Map our post_type + media to NovinHub `type`
    const requested = (payload.type || 'post').toLowerCase();
    const isVideo = firstMime.startsWith('video/');
    let nhType: string;
    let extra: Record<string, any> = {};
    if (requested === 'story') {
      nhType = 'story';
    } else if (requested === 'reel') {
      nhType = 'video';
      extra.reels = 1;
    } else if (media_ids.length > 1) {
      nhType = 'album';
    } else if (isVideo) {
      nhType = 'video';
    } else if (media_ids.length === 1) {
      nhType = 'image';
    } else {
      nhType = 'text';
    }

    const body: Record<string, any> = {
      caption: payload.caption || '',
      type: nhType,
      account_ids: [payload.account_id],
      media_ids,
      ...extra,
    };
    if (payload.is_scheduled) {
      body.is_scheduled = 1;
      if (payload.schedule_date) body.schedule_date = payload.schedule_date;
    }

    return nhForm('/post', body);
  },
};
