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
      const hasObjectItems = v.some(item => item !== null && typeof item === 'object');
      if (hasObjectItems) {
        form.append(k, JSON.stringify(v));
      } else {
        for (const item of v) form.append(`${k}[]`, String(item));
      }
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

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', m4v: 'video/mp4',
};

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
};

function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 6) {
    const head = new TextDecoder().decode(bytes.slice(0, 6));
    if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif';
  }
  if (bytes.length >= 12) {
    const riff = new TextDecoder().decode(bytes.slice(0, 4));
    const webp = new TextDecoder().decode(bytes.slice(8, 12));
    if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
    const ftyp = new TextDecoder().decode(bytes.slice(4, 8));
    if (ftyp === 'ftyp') return 'video/mp4';
  }
  if (bytes.length >= 4) {
    const ebml = [0x1a, 0x45, 0xdf, 0xa3];
    if (ebml.every((b, i) => bytes[i] === b)) return 'video/webm';
  }
  return null;
}

/** Download a URL then upload to NovinHub /file, return the new file id. */
export async function nhUploadFromUrl(url: string): Promise<{ id: number | string; mime: string; }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch media ${r.status}: ${url}`);
  const clean = url.split('?')[0];
  const extRaw = clean.substring(clean.lastIndexOf('.') + 1).toLowerCase();
  const ext = EXT_MIME[extRaw] ? extRaw : '';
  const hdrMime = r.headers.get('content-type') || '';
  const bytes = new Uint8Array(await r.arrayBuffer());
  let mime = hdrMime && hdrMime !== 'application/octet-stream' ? hdrMime.split(';')[0] : (ext ? EXT_MIME[ext] : '');
  if (!mime || !MIME_EXT[mime]) mime = sniffMime(bytes) || (ext ? EXT_MIME[ext] : '') || 'image/jpeg';
  const finalExt = MIME_EXT[mime] || ext || 'jpg';
  const baseName = clean.substring(clean.lastIndexOf('/') + 1) || `upload-${Date.now()}`;
  const hasAllowedExt = !!ext && /\.[a-z0-9]+$/i.test(baseName);
  const stem = baseName.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9_-]/gi, '-') || `upload-${Date.now()}`;
  const finalName = hasAllowedExt
    ? baseName
    : `${stem}.${finalExt}`;
  const file = await nhUploadFile(new Blob([bytes], { type: mime }), finalName);
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

  searchPeople: (accountId: string | number, query: string) =>
    nhForm('/search/people', { query, account_ids: String(accountId) }),

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
    cover_url?: string;        // optional cover image for videos/reels
    collaborators?: string[];  // Instagram usernames to invite as co-authors
    first_comment?: string;
  }) {
    const media_ids: (number | string)[] = [];
    let firstMime = '';
    for (const url of payload.media_urls || []) {
      const { id, mime } = await nhUploadFromUrl(url);
      media_ids.push(id);
      if (!firstMime) firstMime = mime;
    }

    // Optional cover upload (video_cover expects a file id)
    let video_cover: number | string | undefined;
    if (payload.cover_url) {
      try {
        const { id } = await nhUploadFromUrl(payload.cover_url);
        video_cover = id;
      } catch (e) {
        console.error('cover upload failed', e);
      }
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
    } else if (requested === 'carousel' || requested === 'album') {
      nhType = 'album';
    } else if (media_ids.length > 1) {
      nhType = 'album';
    } else if (isVideo) {
      nhType = 'video';
    } else if (media_ids.length === 1) {
      nhType = 'image';
    } else {
      nhType = 'text';
    }

    if (video_cover !== undefined) extra.video_cover = video_cover;
    if (payload.first_comment) extra.first_comment = payload.first_comment;

    const hashtags = extractHashtags(payload.caption || '');
    if (hashtags.length) extra.hashtag = hashtags;

    // Collaboration: Instagram co-authors. NovinHub accepts `collaborators`
    // as an array of usernames (mirrors reels_tags shape when applicable).
    const collabs = (payload.collaborators || [])
      .map(u => u.trim().replace(/^@/, ''))
      .filter(Boolean);
    if (collabs.length) {
      // NovinHub accepts `collaborators` as an array of usernames on image/album/video/reel.
      extra.collaborators = collabs;
      // Also send object-based aliases. nhForm serializes arrays of objects as JSON.
      const collabObjects = collabs.map(username => ({ username }));
      extra.collab_tags = collabObjects;
      extra.instagram_collaborators = collabObjects;

      // Official NovinHub field for tagging users on Instagram Reels.
      if (nhType === 'video') {
        extra.reels_tags = collabObjects;
      }

      // Official NovinHub field for tagging users on Instagram photo/album posts.
      // It requires Instagram `pk`, so resolve usernames through /search/people.
      if ((nhType === 'image' || nhType === 'album') && media_ids.length) {
        const people = await resolvePeopleTags(payload.account_id, collabs);
        const photoTags = buildPhotoTags(media_ids, people);
        if (Object.keys(photoTags).length) {
          extra.photo_tags = photoTags;
        } else {
          console.warn('NovinHub photo_tags skipped: no matching Instagram users found', collabs.join(','));
        }
      }
    }

    const body: Record<string, any> = {
      caption: payload.caption || '',
      type: nhType,
      account_ids: [payload.account_id],
      media_ids,
      is_scheduled: payload.is_scheduled ? 1 : 0,
      schedule_date: payload.schedule_date || Math.floor(Date.now() / 1000),
      is_draft: 0,
      ...extra,
    };

    return nhForm('/post', body);
  },
};

function extractHashtags(caption: string): string[] {
  const tags = new Set<string>();
  const re = /(?:^|\s)#([\p{L}\p{N}_]+)/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(caption))) {
    const tag = match[1]?.trim();
    if (tag) tags.add(tag);
  }
  return [...tags];
}

function unwrapArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.result)) return body.result;
  return [];
}

async function resolvePeopleTags(accountId: string | number, usernames: string[]): Promise<Array<{ username: string; id: string | number }>> {
  const resolved: Array<{ username: string; id: string | number }> = [];
  for (const raw of usernames) {
    const username = raw.trim().replace(/^@/, '');
    if (!username) continue;
    try {
      const res = await novinhub.searchPeople(accountId, username);
      const people = unwrapArray(res);
      const exact = people.find((p: any) => String(p?.username || '').toLowerCase() === username.toLowerCase());
      const picked = exact || people.find((p: any) => p?.pk || p?.id);
      const id = picked?.pk ?? picked?.id;
      if (id) resolved.push({ username: picked?.username || username, id });
    } catch (e) {
      console.warn('NovinHub searchPeople failed', username, e instanceof Error ? e.message : String(e));
    }
  }
  return resolved;
}

function buildPhotoTags(mediaIds: Array<string | number>, people: Array<{ username: string; id: string | number }>): Record<string, any[]> {
  if (!mediaIds.length || !people.length) return {};
  const positions = [
    { locationX: 0.5, locationY: 0.5 },
    { locationX: 0.35, locationY: 0.5 },
    { locationX: 0.65, locationY: 0.5 },
    { locationX: 0.5, locationY: 0.35 },
    { locationX: 0.5, locationY: 0.65 },
  ];
  const tags = people.map((person, index) => ({
    ...positions[index % positions.length],
    text: person.username,
    id: person.id,
  }));
  return Object.fromEntries(mediaIds.map(mediaId => [String(mediaId), tags]));
}
