// Pure rules for which messenger users receive a message copy in Telegram.
export type RelayKind = 'private' | 'group' | 'support';
export interface RelayMessage { kind: RelayKind; sender_id: number | null; text: string; reply_to_sender_id?: number | null }
export interface RelayContext { privateMembers?: [number, number]; supportOwner?: number | null; groupUsernames?: Map<string, number> }

export function mentionedUsernames(text: string): string[] {
  return [...new Set([...(text || '').matchAll(/(?:^|[^\w@])@([A-Za-z0-9_.]{3,32})/g)].map(m => m[1].toLowerCase()))];
}

// Private: the other member. Support: the owner, only for staff replies. Group: only mentions and replies.
export function relayRecipients(m: RelayMessage, ctx: RelayContext): number[] {
  const out = new Set<number>();
  if (m.kind === 'private' && ctx.privateMembers) for (const id of ctx.privateMembers) out.add(id);
  if (m.kind === 'support' && ctx.supportOwner && m.sender_id !== ctx.supportOwner) out.add(ctx.supportOwner);
  if (m.kind === 'group') {
    if (m.reply_to_sender_id) out.add(m.reply_to_sender_id);
    for (const u of mentionedUsernames(m.text)) { const id = ctx.groupUsernames?.get(u); if (id) out.add(id); }
  }
  if (m.sender_id) out.delete(m.sender_id);
  return [...out];
}
