import { z } from 'npm:zod@3.23.8';
import { HubError } from '../_shared/hub-policy.ts';

// Messenger adapter: every read, send and file request is re-checked by the source access function.
export const MESSENGER_LIMITS = { defaultLimit: 30, maxLimit: 100, maxText: 4000, signedUrlSeconds: 300, settleSeconds: 2, sendsPerMinute: 20 } as const;
type Kind = 'group' | 'private' | 'support';
const KINDS: Kind[] = ['group', 'private', 'support'];
const ref = z.string().regex(/^(group|private|support):[1-9]\d{0,14}$/);
const limit = z.number().int().min(1).max(MESSENGER_LIMITS.maxLimit).optional();
const cursor = z.string().min(1).max(300).optional();
export const messengerSchemas = {
  'conversations.list': z.object({ limit, cursor }).strict(),
  'conversation.get': z.object({ id: ref }).strict(),
  'messages.list': z.object({ conversation_id: ref, limit, cursor, since: cursor }).strict()
    .refine(v => !(v.cursor && v.since), 'cursor_and_since'),
  'message.send': z.object({ conversation_id: ref, text: z.string().max(MESSENGER_LIMITS.maxText).refine(v => v.trim().length > 0) }).strict(),
  'private.start': z.object({ source_user_id: z.string().regex(/^[1-9]\d{0,9}$/) }).strict(),
  'attachment.url': z.object({ message_id: ref }).strict(),
  'members.search': z.object({ username: z.string().trim().regex(/^@?[A-Za-z0-9_.]{3,32}$/) }).strict(),
};
export const isMessengerAction = (a: string) => Object.hasOwn(messengerSchemas, a);
export function parseMessenger(action: string, body: unknown) {
  const r = (messengerSchemas as any)[action].safeParse(body);
  if (!r.success) throw new HubError(400, 'اطلاعات درخواست معتبر نیست');
  return r.data;
}
export function parseRef(value: string): { kind: Kind; id: number } {
  const [kind, id] = value.split(':');
  if (!KINDS.includes(kind as Kind)) throw new HubError(400, 'شناسه معتبر نیست');
  return { kind: kind as Kind, id: Number(id) };
}
const b64 = (v: unknown) => btoa(JSON.stringify(v)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (v: string) => {
  try { return JSON.parse(atob(v.replace(/-/g, '+').replace(/_/g, '/'))); } catch { throw new HubError(400, 'نشانگر صفحه معتبر نیست'); }
};
export function encodeCursor(v: Record<string, unknown>) { return b64({ v: 1, ...v }); }
export function decodeCursor(v: string, type: string) {
  const c = unb64(v);
  if (!c || c.v !== 1 || c.t !== type) throw new HubError(400, 'نشانگر صفحه معتبر نیست');
  return c;
}
export function idempotencyKey(header: string | null) {
  if (!header || !/^[A-Za-z0-9_.:-]{8,128}$/.test(header)) throw new HubError(400, 'هدر Idempotency-Key الزامی و باید معتبر باشد');
  return header;
}
const attachmentKind = (type: string | null) => type?.startsWith('image/') ? 'image' : type?.startsWith('audio/') ? 'audio' : type?.startsWith('video/') ? 'video' : 'file';
export function storagePath(mediaUrl: string, base: string) {
  const prefix = `${base}/storage/v1/object/public/`;
  if (!mediaUrl.startsWith(prefix)) return null;
  const [bucket, ...rest] = mediaUrl.slice(prefix.length).split('?')[0].split('/');
  if (!['messenger-files', 'voice-messages'].includes(bucket) || !rest.length) return null;
  return { bucket, path: rest.map(decodeURIComponent).join('/') };
}

export async function handleMessenger(action: string, p: any, req: Request, ctx: { db: any; user: { id: number }; url: string }) {
  const { db, user } = ctx;
  const check = async (q: PromiseLike<any>) => { const { data, error } = await q; if (error) throw new HubError(500, 'دریافت اطلاعات پیام‌رسان انجام نشد'); return data; };
  const allowed = async (kind: Kind, id: number) => Boolean(await check(db.rpc('hub_msg_can_access', { p_user: user.id, p_kind: kind, p_id: id })));
  const requireAccess = async (kind: Kind, id: number) => { if (!(await allowed(kind, id))) throw new HubError(404, 'گفتگو یافت نشد یا دسترسی ندارید'); };
  const convShape = (r: any) => ({ id: `${r.kind}:${r.id}`, type: r.kind, title: r.title, avatar_url: r.avatar_url ?? null,
    peer: r.peer_id ? { source_user_id: String(r.peer_id), name: r.title, avatar_url: r.avatar_url ?? null } : null,
    status: r.status ?? null, last_activity_at: r.last_activity_at,
    capabilities: { send_text: true, upload: false, react: false } });
  const conversations = async () => (await check(db.rpc('hub_msg_conversations', { p_user: user.id }))) as any[];
  const getConv = async (kind: Kind, id: number) => {
    await requireAccess(kind, id);
    const row = (await conversations()).find(r => r.kind === kind && Number(r.id) === id);
    if (!row) throw new HubError(404, 'گفتگو یافت نشد یا دسترسی ندارید');
    return convShape(row);
  };
  const table = (k: Kind) => k === 'private' ? 'private_messages' : 'messenger_messages';
  const column = (k: Kind) => k === 'private' ? 'conversation_id' : k === 'group' ? 'room_id' : 'conversation_id';
  const shapeMessages = async (kind: Kind, rows: any[]) => {
    const senderIds = [...new Set(rows.map(r => r.sender_id).filter(Boolean))];
    const senders = senderIds.length ? await check(db.from('chat_users').select('id,name,avatar_url,is_support_agent').in('id', senderIds)) : [];
    const sm = new Map(senders.map((s: any) => [s.id, s]));
    let reactions: any[] = [];
    if (kind !== 'private' && rows.length) reactions = await check(db.from('message_reactions').select('message_id,reaction,user_id').in('message_id', rows.map(r => r.id)).order('id'));
    return rows.map(r => {
      const s: any = sm.get(r.sender_id);
      const mine = reactions.filter(x => x.message_id === r.id);
      const grouped = new Map<string, { reaction: string; count: number; reacted_by_me: boolean }>();
      for (const x of mine) { const g = grouped.get(x.reaction) || { reaction: x.reaction, count: 0, reacted_by_me: false }; g.count++; if (x.user_id === user.id) g.reacted_by_me = true; grouped.set(x.reaction, g); }
      return { id: `${kind}:${r.id}`, conversation_id: `${kind}:${r[column(kind)]}`,
        sender: { source_user_id: r.sender_id ? String(r.sender_id) : null, name: s?.name || (kind === 'support' && r.sender_id === 1 ? 'پشتیبانی' : 'کاربر'),
          avatar_url: s?.avatar_url ?? null, is_me: r.sender_id === user.id, is_support: kind === 'support' && r.sender_id !== user.id },
        text: r.message || '', type: r.media_url ? attachmentKind(r.message_type) : 'text',
        attachments: r.media_url ? [{ message_id: `${kind}:${r.id}`, kind: attachmentKind(r.message_type), mime_type: r.message_type || null }] : [],
        reply_to_id: r.reply_to_message_id ? `${kind}:${r.reply_to_message_id}` : null, forwarded: Boolean(r.forwarded_from_message_id),
        topic_id: kind === 'group' ? (r.topic_id ?? null) : null, reactions: [...grouped.values()], created_at: r.created_at };
    });
  };
  const cols = (k: Kind) => `id,${column(k)},sender_id,message,message_type,media_url,reply_to_message_id,forwarded_from_message_id,created_at${k === 'group' ? ',topic_id' : ''}`;

  if (action === 'conversations.list') {
    const n = p.limit ?? MESSENGER_LIMITS.defaultLimit;
    const rows = (await conversations()).map(r => ({ ...r, key: `${r.kind}:${r.id}`, ts: new Date(r.last_activity_at).getTime() }))
      .sort((a, b) => b.ts - a.ts || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    let start = 0;
    if (p.cursor) {
      const c = decodeCursor(p.cursor, 'c');
      start = rows.findIndex(r => r.ts < c.ts || (r.ts === c.ts && r.key > c.k));
      if (start < 0) start = rows.length;
    }
    const page = rows.slice(start, start + n);
    const last = page.at(-1);
    return { items: page.map(convShape), next_cursor: start + n < rows.length && last ? encodeCursor({ t: 'c', ts: last.ts, k: last.key }) : null };
  }
  if (action === 'conversation.get') { const { kind, id } = parseRef(p.id); return getConv(kind, id); }
  if (action === 'messages.list') {
    const { kind, id } = parseRef(p.conversation_id);
    await requireAccess(kind, id);
    const n = p.limit ?? MESSENGER_LIMITS.defaultLimit;
    const base = () => db.from(table(kind)).select(cols(kind)).eq(column(kind), id);
    if (p.since) {
      const c = decodeCursor(p.since, 's');
      if (c.c !== `${kind}:${id}`) throw new HubError(400, 'نشانگر صفحه معتبر نیست');
      // Settle window: only committed, settled rows are returned so polling never skips a late commit.
      const settled = new Date(Date.now() - MESSENGER_LIMITS.settleSeconds * 1000).toISOString();
      const rows = await check(base().gt('id', c.id).lte('created_at', settled).order('id', { ascending: true }).limit(n + 1));
      const page = rows.slice(0, n);
      const lastId = page.length ? page.at(-1).id : c.id;
      return { items: await shapeMessages(kind, page), next_cursor: encodeCursor({ t: 's', c: `${kind}:${id}`, id: lastId }), has_more: rows.length > n };
    }
    let q = base().order('id', { ascending: false }).limit(n + 1);
    if (p.cursor) {
      const c = decodeCursor(p.cursor, 'h');
      if (c.c !== `${kind}:${id}`) throw new HubError(400, 'نشانگر صفحه معتبر نیست');
      q = base().lt('id', c.id).order('id', { ascending: false }).limit(n + 1);
    }
    const rows = await check(q);
    const page = rows.slice(0, n);
    const settled = Date.now() - MESSENGER_LIMITS.settleSeconds * 1000;
    // Newest settled id in this response seeds the forward polling cursor.
    const newest = p.cursor ? null : (rows.find((r: any) => new Date(r.created_at).getTime() <= settled)?.id ?? 0);
    return { items: (await shapeMessages(kind, page)).reverse(),
      next_cursor: rows.length > n ? encodeCursor({ t: 'h', c: `${kind}:${id}`, id: page.at(-1).id }) : null,
      ...(newest !== null ? { poll_cursor: encodeCursor({ t: 's', c: `${kind}:${id}`, id: newest }) } : {}) };
  }
  if (action === 'message.send') {
    const key = idempotencyKey(req.headers.get('Idempotency-Key'));
    const { kind, id } = parseRef(p.conversation_id);
    const { data, error } = await db.rpc('hub_msg_send', { p_user: user.id, p_kind: kind, p_id: id, p_text: p.text, p_key: key });
    if (error) {
      const m = String(error.message || '');
      if (m.includes('forbidden')) throw new HubError(404, 'گفتگو یافت نشد یا دسترسی ندارید');
      if (m.includes('rate_limited')) throw new HubError(429, 'تعداد پیام‌ها زیاد است؛ کمی صبر کنید');
      if (m.includes('idempotency_conflict')) throw new HubError(409, 'این Idempotency-Key قبلاً برای پیام دیگری استفاده شده است');
      if (m.includes('invalid_text')) throw new HubError(400, 'متن پیام معتبر نیست');
      throw new HubError(500, 'ارسال پیام انجام نشد');
    }
    const row = await check(db.from(table(kind)).select(cols(kind)).eq('id', data.message_id).single());
    return { message: (await shapeMessages(kind, [row]))[0], duplicate: Boolean(data.duplicate) };
  }
  if (action === 'private.start') {
    const { data, error } = await db.rpc('hub_msg_private_start', { p_user: user.id, p_target: Number(p.source_user_id) });
    if (error) {
      const m = String(error.message || '');
      if (m.includes('self')) throw new HubError(400, 'امکان گفتگو با خودتان وجود ندارد');
      if (m.includes('not_approved')) throw new HubError(403, 'حساب پیام‌رسان شما هنوز تأیید نشده است');
      if (m.includes('target_unavailable')) throw new HubError(404, 'کاربر یافت نشد یا در دسترس نیست');
      throw new HubError(500, 'شروع گفتگو انجام نشد');
    }
    return getConv('private', Number(data));
  }
  if (action === 'members.search') {
    const me = await check(db.from('chat_users').select('is_approved').eq('id', user.id).single());
    if (!me.is_approved) throw new HubError(403, 'حساب پیام‌رسان شما هنوز تأیید نشده است');
    const rows = await check(db.from('chat_users').select('id,name,username,avatar_url').eq('is_approved', true)
      .eq('username', p.username.replace(/^@/, '')).neq('id', user.id).order('id').limit(5));
    return { items: rows.map((r: any) => ({ source_user_id: String(r.id), name: r.name, username: r.username, avatar_url: r.avatar_url ?? null })), next_cursor: null };
  }
  if (action === 'attachment.url') {
    const { kind, id } = parseRef(p.message_id);
    const row = await check(db.from(table(kind)).select(`id,${column(kind)},media_url,message_type`).eq('id', id).maybeSingle());
    if (!row || !row[column(kind)] || !(await allowed(kind, Number(row[column(kind)])))) throw new HubError(404, 'پیوست یافت نشد یا دسترسی ندارید');
    if (!row.media_url) throw new HubError(404, 'پیوست یافت نشد یا دسترسی ندارید');
    const loc = storagePath(row.media_url, ctx.url);
    if (!loc) throw new HubError(422, 'این پیوست از فضای فایل پیام‌رسان نیست و قابل ارائه نیست');
    const { data, error } = await db.storage.from(loc.bucket).createSignedUrl(loc.path, MESSENGER_LIMITS.signedUrlSeconds);
    if (error || !data?.signedUrl) throw new HubError(404, 'فایل پیوست موجود نیست');
    return { url: data.signedUrl, expires_in: MESSENGER_LIMITS.signedUrlSeconds, kind: attachmentKind(row.message_type), mime_type: row.message_type || null };
  }
  throw new HubError(404, 'عملیات هاب یافت نشد');
}
