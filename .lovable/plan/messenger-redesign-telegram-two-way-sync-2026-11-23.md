# Messenger redesign + Telegram two-way sync

## 1. Redesign (Telegram-like feel, academy black/white glass style)
- Two-pane layout on desktop (chat list | open chat), single pane with slide transitions on mobile.
- Chat list: avatar, name, last message preview, time, unread badge, search, tabs (All / Private / Groups / Support).
- Chat view: sticky glass header (avatar, name, online/last seen), message bubbles with tails, own messages on one side, grouped by day with date chips, reply preview, reactions, voice/file/image bubbles, read ticks.
- Composer: auto-growing input, attach, voice record, send button; iOS safe-area respected.
- Doran font, light/dark, smooth but light animations (no heavy effects).
- Same data, rules and logins as today; no change to who can see what.

## 2. Telegram sync (existing academy bot, only for users who linked Telegram)
- New messages in a user's private chats and support conversations are delivered to their Telegram bot chat: "Sender name: text" (+ file/voice).
- Replying (Telegram "reply") to that bot message posts the answer back into the same messenger chat as that user; text, photo and voice supported.
- Groups: per the answer to the open question (see below).
- Per-user on/off switch in messenger profile; only one copy per message (idempotent delivery log), no echo loops (messages that came from Telegram are not sent back to Telegram).
- Same access checks as the website: a Telegram reply can only post into a chat that user is a member of.
- Bale mirror follows the same logic later if desired (not in this step).

## Technical details
- New service-only table `messenger_telegram_links` (telegram message id ↔ messenger chat/message, direction, unique keys) for reply routing and dedup.
- Database trigger on new private/support/group messages enqueues delivery; `telegram-webhook` gets a reply handler that resolves the mapped chat and inserts via the same access function used by the Hub (`hub_msg_can_access`).
- Delivery goes through the existing bot function and token; rate-limited queue to respect Telegram limits.
- UI: rebuild `MessengerApp` chat list/view components in place, reusing existing services.
- Verify: live test with test accounts linked to a test Telegram chat; screenshots desktop + 430px mobile.
