// Messenger channel context.
// The same bot brain serves two messengers: Telegram and Bale.
// Each incoming webhook update runs inside a channel context so every
// send / storage helper targets the right platform automatically.
import { AsyncLocalStorage } from 'node:async_hooks';

export type Channel = 'telegram' | 'bale';

const storage = new AsyncLocalStorage<Channel>();

export function runWithChannel<T>(channel: Channel, fn: () => T): T {
  return storage.run(channel, fn);
}

export function currentChannel(): Channel {
  return storage.getStore() ?? 'telegram';
}

export function isBale(): boolean {
  return currentChannel() === 'bale';
}

/** chat_users column holding this channel's chat id */
export function chatIdColumn(): 'telegram_chat_id' | 'bale_chat_id' {
  return isBale() ? 'bale_chat_id' : 'telegram_chat_id';
}

/** chat_users column holding this channel's link timestamp */
export function linkedAtColumn(): 'telegram_linked_at' | 'bale_linked_at' {
  return isBale() ? 'bale_linked_at' : 'telegram_linked_at';
}

/** Build a { column: value } patch for the active channel. */
export function chatIdPatch(chatId: number | null, withTimestamp = true): Record<string, unknown> {
  const patch: Record<string, unknown> = { [chatIdColumn()]: chatId };
  if (withTimestamp) patch[linkedAtColumn()] = chatId === null ? null : new Date().toISOString();
  return patch;
}

export function channelLabel(): string {
  return isBale() ? 'بله' : 'تلگرام';
}

/**
 * Pick the messenger to reach a person on, from any record that may carry
 * telegram / bale chat ids. Telegram wins when both exist.
 */
export function resolveBotTarget(
  ...sources: Array<Record<string, unknown> | null | undefined>
): { chatId: number; channel: Channel } | null {
  for (const src of sources) {
    if (!src) continue;
    const tg = Number((src as any).telegram_chat_id ?? (src as any).telegram_id ?? 0);
    if (tg) return { chatId: tg, channel: 'telegram' };
  }
  for (const src of sources) {
    if (!src) continue;
    const bale = Number((src as any).bale_chat_id ?? 0);
    if (bale) return { chatId: bale, channel: 'bale' };
  }
  return null;
}

/** Log-friendly channel name for a bot delivery. */
export function botLogChannel(channel: Channel): string {
  return channel === 'bale' ? 'bale_bot' : 'telegram_bot';
}
