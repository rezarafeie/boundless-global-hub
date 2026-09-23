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
