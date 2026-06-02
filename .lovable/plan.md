## Telegram Bot for Sales & CRM System

A full-featured Telegram bot mirroring website roles (admin, sales manager, sales agent) for lead management, CRM updates, assignments, reports, and proactive notifications.

---

### Phase 1: Foundation

**Database changes**
- Add `telegram_chat_id` (bigint, unique) and `telegram_username` (text) columns to `chat_users`
- Create `telegram_bot_sessions` table to track per-user conversation state (waiting for note input, selecting status, etc.)
- Create `telegram_notification_queue` table for outbound messages with retry

**Admin UI**
- New "Telegram Bot" section in Admin Settings panel:
  - Bot status indicator (webhook registered, last update received)
  - User → Telegram ID linker: searchable list of admins/sales managers/agents with input to set `telegram_chat_id`
  - Toggle proactive notifications on/off per type

**Secrets needed**
- `TELEGRAM_BOT_TOKEN` (from @BotFather)
- `TELEGRAM_WEBHOOK_SECRET` (auto-generated random string for security)

---

### Phase 2: Bot core (edge functions)

**`telegram-webhook`** — receives all updates from Telegram
- Validates `X-Telegram-Bot-Api-Secret-Token` header
- Looks up user by `telegram_chat_id` → role
- If unknown user: replies "You are not authorized. Ask admin to link your account."
- Routes commands and callback queries to handlers based on role

**`telegram-send`** — internal helper for sending messages / processing notification queue

**`telegram-notify`** — triggered by other parts of the app (lead assigned, consultation booked) to enqueue messages

---

### Phase 3: Role-based commands & menus

**All authenticated users**
- `/start` — shows role-specific main menu (inline keyboard)
- `/help` — command list
- `/me` — shows linked account info

**Sales Agent menu**
- My Leads → paginated list (10 per page) with inline buttons
- Filter by CRM status (inline keyboard with all custom statuses)
- Search by name/phone (next message = query)
- Tap lead → detail card: name, phone, course, current status, last note
  - Buttons: Change Status, Add Note, Call (tel: link), View on website
- Change Status → inline keyboard of statuses → updates DB + triggers webhook
- Add Note → bot enters "awaiting note" state → next text message saved as note

**Sales Manager menu**
- All agent's menu features, plus:
- Unassigned Leads → list with "Assign" button → pick agent from inline keyboard
- Bulk Transfer → pick source agent → pick target agent → confirms
- Agent Performance → quick stats per agent (leads, conversions today/week)

**Admin menu**
- All manager features, plus:
- Full reports: today/week/month totals, top performers, conversion rate
- Pending consultations count
- System health: pending payments, new signups

---

### Phase 4: Proactive notifications

Triggered from existing code (no extra UI):
- **Lead assigned** → message to agent with lead summary + "View" button (hook into existing `assign_lead_to_agent` flow via DB trigger calling `telegram-notify`)
- **New consultation booking** → message to all admins + sales managers
- **Daily summary** at 22:00 Tehran time via pg_cron → each agent gets their day's stats

---

### Technical Details

**Authentication & data isolation**
- Every handler re-checks role from DB on each update (no trust in cached state)
- Sales agents queries scoped to `sales_agent_id = current_user_id` (reuses existing RPCs like `get_user_courses_for_sales_agent`)
- All edge functions: `verify_jwt = false` (Telegram doesn't send Supabase JWT) — security via `TELEGRAM_WEBHOOK_SECRET` header check

**Conversation state**
- `telegram_bot_sessions` stores `{ chat_id, state, context_json, expires_at }` — e.g., `state: 'awaiting_note', context: { lead_id }`
- Cleared on `/cancel` or after 10 min

**Inline keyboards & callbacks**
- Use callback_data format: `action:param1:param2` (e.g., `lead:view:123`, `status:set:lead123:newstatus`)
- Stay under 64-byte Telegram limit; for long lists store payload in session

**Webhook registration**
- After deploy, I'll register the webhook by calling Telegram's `setWebhook` API from a one-off script
- Webhook URL: `https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/telegram-webhook`

**Persian language**
- All bot messages in Persian (Farsi), matching the rest of the system
- Dates in Tehran timezone, Jalali calendar

---

### Out of scope (can add later)
- Sending media (lead docs, voice notes)
- Group chats (bot is 1:1 with each user)
- Full pipeline/Kanban view in bot
- Direct user-to-lead messaging through bot

---

### What I need from you to start
1. Approve this plan
2. Create a bot via @BotFather and get the token (I'll request it as a secret after approval)
3. Your own Telegram numeric chat ID for initial admin linking (send `/start` to @userinfobot to get it)

Ready to start with the DB migration + admin linker UI as soon as you approve.