import { escapeHtml, sendMessage, tgCall, downloadFile } from './telegram.ts';
import { relayRecipients, mentionedUsernames, type RelayKind } from './messenger-telegram-policy.ts';

const REPLY_HINT = '↩️ برای پاسخ، روی همین پیام «Reply» بزنید.';

function messageKind(table: string, row: any): { kind: RelayKind; conv: number } | null {
  if (table === 'private_messages') return { kind: 'private', conv: Number(row.conversation_id) };
  if (row.room_id) return { kind: 'group', conv: Number(row.room_id) };
  if (row.conversation_id) return { kind: 'support', conv: Number(row.conversation_id) };
  return null;
}

// Re-reads the message by id (never trusts the trigger payload) and delivers once per recipient.
export async function relayMessage(db: any, table: string, id: number) {
  if (!['private_messages', 'messenger_messages'].includes(table) || !Number.isInteger(id)) return { skipped: 'invalid' };
  const { data: row } = await db.from(table).select('*').eq('id', id).maybeSingle();
  if (!row) return { skipped: 'missing' };
  const k = messageKind(table, row);
  if (!k) return { skipped: 'untyped' };
  const ctx: any = {};
  let title = '';
  let replySender: number | null = null;
  if (k.kind === 'private') {
    const { data: c } = await db.from('private_conversations').select('user1_id,user2_id').eq('id', k.conv).single();
    ctx.privateMembers = [c.user1_id, c.user2_id];
  } else if (k.kind === 'support') {
    const { data: c } = await db.from('support_conversations').select('user_id').eq('id', k.conv).single();
    ctx.supportOwner = c?.user_id ?? null; title = 'پشتیبانی';
  } else {
    const { data: r } = await db.from('chat_rooms').select('name').eq('id', k.conv).single();
    title = r?.name || 'گروه';
    if (row.reply_to_message_id) {
      const { data: p } = await db.from('messenger_messages').select('sender_id').eq('id', row.reply_to_message_id).maybeSingle();
      replySender = p?.sender_id ?? null;
    }
    const names = mentionedUsernames(row.message);
    if (names.length) {
      const { data: us } = await db.from('chat_users').select('id,username').in('username', names);
      ctx.groupUsernames = new Map((us || []).map((u: any) => [String(u.username).toLowerCase(), u.id]));
    }
  }
  const ids = relayRecipients({ kind: k.kind, sender_id: row.sender_id, text: row.message || '', reply_to_sender_id: replySender }, ctx);
  if (!ids.length) return { delivered: 0 };
  const { data: sender } = row.sender_id ? await db.from('chat_users').select('name').eq('id', row.sender_id).maybeSingle() : { data: null };
  const senderName = k.kind === 'support' ? 'پشتیبانی' : (sender?.name || 'کاربر');
  const { data: users } = await db.from('chat_users').select('id,telegram_chat_id,messenger_telegram_sync').in('id', ids);
  let delivered = 0;
  for (const u of users || []) {
    if (!u.telegram_chat_id || u.messenger_telegram_sync === false) continue;
    // Recipients must still have access under the messenger's own rules.
    const { data: ok } = await db.rpc('hub_msg_can_access', { p_user: u.id, p_kind: k.kind, p_id: k.conv });
    if (!ok) continue;
    const { data: claim, error } = await db.from('messenger_telegram_links').insert({ kind: k.kind, conversation_id: k.conv, message_id: id,
      chat_user_id: u.id, telegram_chat_id: u.telegram_chat_id, direction: 'out' }).select('id').single();
    if (error || !claim) continue; // already delivered (unique) — never send twice
    const head = `💬 <b>${escapeHtml(senderName)}</b>${title && k.kind === 'group' ? ` · ${escapeHtml(title)}` : ''}`;
    const body = row.message ? `\n${escapeHtml(row.message).slice(0, 3500)}` : '';
    const media = row.media_url ? `\n📎 <a href="${escapeHtml(row.media_url)}">${String(row.message_type || '').startsWith('audio/') ? 'پیام صوتی' : 'فایل پیوست'}</a>` : '';
    const sent = await tgCall('sendMessage', { chat_id: u.telegram_chat_id, text: `${head}${body}${media}\n\n<i>${REPLY_HINT}</i>`, parse_mode: 'HTML', disable_web_page_preview: true });
    await db.from('messenger_telegram_links').update({ telegram_message_id: sent?.ok ? sent.result.message_id : null, status: sent?.ok ? 'sent' : 'failed' }).eq('id', claim.id);
    if (sent?.ok) delivered++;
  }
  return { delivered };
}

// Telegram reply to a relayed message → post into the same messenger chat as the linked user.
export async function handleMessengerReply(db: any, msg: any): Promise<boolean> {
  const replyTo = msg?.reply_to_message?.message_id;
  if (!replyTo || msg.chat?.type !== 'private') return false;
  const chatId = Number(msg.chat.id);
  const { data: link } = await db.from('messenger_telegram_links').select('*').eq('telegram_chat_id', chatId).eq('telegram_message_id', replyTo).eq('direction', 'out').maybeSingle();
  if (!link) return false;
  const { data: user } = await db.from('chat_users').select('id,telegram_chat_id').eq('id', link.chat_user_id).maybeSingle();
  if (!user || Number(user.telegram_chat_id) !== chatId) { await sendMessage(chatId, '⛔ این گفتگو به حساب تلگرام فعلی شما وصل نیست.'); return true; }
  const { data: ok } = await db.rpc('hub_msg_can_access', { p_user: user.id, p_kind: link.kind, p_id: link.conversation_id });
  if (!ok) { await sendMessage(chatId, '⛔ دیگر به این گفتگو دسترسی ندارید.'); return true; }
  const text = String(msg.text || msg.caption || '').slice(0, 4000);
  let media_url: string | null = null, message_type = 'text', media_content: string | null = null;
  const file = msg.photo?.at(-1) || msg.voice || msg.audio || msg.document || msg.video;
  if (file) {
    const dl = await downloadFile(file.file_id);
    if (!dl) { await sendMessage(chatId, '❌ دریافت فایل از تلگرام انجام نشد.'); return true; }
    const bucket = msg.voice ? 'voice-messages' : 'messenger-files';
    const mime = msg.voice ? (dl.mime || 'audio/ogg') : msg.photo ? 'image/jpeg' : (file.mime_type || dl.mime || 'application/octet-stream');
    const ext = msg.voice ? 'ogg' : msg.photo ? 'jpg' : (dl.ext || 'bin');
    const path = `${user.id}/tg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const up = await db.storage.from(bucket).upload(path, dl.bytes, { contentType: mime });
    if (up.error) { await sendMessage(chatId, '❌ ذخیره فایل انجام نشد.'); return true; }
    media_url = db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    message_type = mime;
    media_content = JSON.stringify({ type: mime, size: dl.bytes.length, name: file.file_name || `${msg.voice ? 'voice' : 'file'}.${ext}` });
  }
  if (!text && !media_url) { await sendMessage(chatId, 'فقط متن، عکس، صدا یا فایل قابل ارسال است.'); return true; }
  let inserted: any;
  if (link.kind === 'private') {
    inserted = await db.from('private_messages').insert({ conversation_id: link.conversation_id, sender_id: user.id, message: text, message_type, media_url, media_content, is_read: false }).select('id').single();
  } else if (link.kind === 'group') {
    const { data: orig } = await db.from('messenger_messages').select('topic_id').eq('id', link.message_id).maybeSingle();
    inserted = await db.from('messenger_messages').insert({ room_id: link.conversation_id, topic_id: orig?.topic_id ?? null, reply_to_message_id: link.message_id, sender_id: user.id, message: text, message_type, media_url, media_content }).select('id').single();
  } else {
    inserted = await db.from('messenger_messages').insert({ conversation_id: link.conversation_id, sender_id: user.id, recipient_id: 1, message: text, message_type, media_url, media_content, unread_by_support: true }).select('id').single();
    await db.from('support_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', link.conversation_id);
  }
  if (inserted.error) { await sendMessage(chatId, '❌ ارسال پیام انجام نشد.'); return true; }
  await db.from('messenger_telegram_links').insert({ kind: link.kind, conversation_id: link.conversation_id, message_id: inserted.data.id,
    chat_user_id: user.id, telegram_chat_id: chatId, telegram_message_id: msg.message_id, direction: 'in', status: 'received' });
  await tgCall('setMessageReaction', { chat_id: chatId, message_id: msg.message_id, reaction: [{ type: 'emoji', emoji: '👍' }] }).catch(() => null);
  return true;
}
