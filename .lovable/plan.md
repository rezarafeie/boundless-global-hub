
# Social CRM & AI Social Media Manager — Phase 1

Building the foundation, Instagram account connection via NovinHub, and Smart Inbox with AI reply. Later phases add: Comment Manager, Content Planner/Publishing, Lead CRM pipeline, Automations, Analytics, Knowledge Base, Reports.

## Access
- New admin area at `/enroll/admin/social`
- Sidebar entry in `EnrollmentAdmin.tsx` (admins only, gated by existing `is_messenger_admin` check)
- Summary cards added to enroll admin dashboard

## Database (single migration)

New tables in `public`, all with RLS + `GRANT`s. Admin-only via `is_messenger_admin` check function.

- **social_accounts** — connected Instagram accounts
  `provider` (instagram), `novinhub_page_id`, `username`, `profile_pic_url`, `is_active`, `last_sync_at`, `health_status`, `access_token_ref` (secret name)
- **social_conversations** — one per IG thread
  `account_id`, `provider_thread_id`, `participant_username`, `participant_pic`, `last_message_at`, `last_message_preview`, `unread_count`, `status` (open/assigned/archived), `assigned_to`, `is_starred`, `labels[]`, `lead_score`, `customer_status`, `ai_or_human` (last responder)
- **social_messages** — messages inside conversations
  `conversation_id`, `provider_message_id`, `direction` (in/out), `sender_type` (user/ai/human), `sender_user_id`, `text`, `media_url`, `media_type`, `is_read`, `sent_at`
- **social_conversation_notes** — internal team notes per thread
- **social_ai_logs** — every AI call (prompt, response, model, tokens, latency, conversation_id)
- **social_sync_cursors** — pagination cursors per account for delta sync
- **social_settings** — global config (AI tone, business hours, confidence threshold, human escalation rules, novinhub_default_account)

Realtime enabled on `social_conversations` and `social_messages`.

## NovinHub integration

New shared helper `supabase/functions/_shared/novinhub.ts`:
- `novinhubFetch(path, opts)` — reads `NOVINHUB_API_KEY` secret, base URL from `NOVINHUB_BASE_URL`
- Wrappers: `listPages()`, `listThreads(pageId, cursor)`, `listMessages(threadId, cursor)`, `sendMessage(threadId, text)`, `getPageProfile(pageId)`

Edge functions:
- **social-novinhub-connect** — validates the key and syncs pages -> `social_accounts`
- **social-inbox-sync** — pulls new threads + messages for an account (cursor-based, upserts). Called on demand + every 2 min by cron
- **social-send-message** — sends outgoing DM via NovinHub, inserts into `social_messages`
- **social-ai-reply** — takes conversation_id, fetches thread + user profile, calls the **existing Telegram sales agent endpoint** (reuse the same prompt/tools already used by `telegram-webhook`), returns suggested reply. Never auto-sends unless the conversation `auto_reply_enabled` flag is on

Secrets needed via `add_secret`:
- `NOVINHUB_API_KEY` (after you confirm docs)
- `NOVINHUB_BASE_URL` (if configurable)

## Frontend

New route tree under `src/pages/Admin/Social/`:
- `SocialLayout.tsx` — RTL sidebar: Dashboard, Inbox, Accounts, Settings (other modules stubbed as "coming soon" for phase 2)
- `SocialDashboard.tsx` — cards: connected accounts, today's DMs, unread, AI vs human response rate, avg response time. Uses Supabase counts.
- `SocialAccounts.tsx` — list + "Connect Instagram via NovinHub" flow (requests API key if missing, calls `social-novinhub-connect`), reconnect, disconnect, health badges, last sync
- `SocialInbox.tsx` — 3-pane layout (desktop) / stacked (mobile):
  - Left: conversation list with search, filters (unread/assigned/starred/archived), realtime updates
  - Middle: message thread, chat bubbles, media preview
  - Right: participant panel (username, lead score, notes, tags, assign, mark lead status)
  - Composer with buttons: **Send**, **AI Suggest** (fills draft), **Translate**, **Summarize**, **Generate Follow-up**
- `SocialSettings.tsx` — AI tone, business hours, confidence threshold, escalation rules, NovinHub key status

Shared components:
- `ConversationListItem`, `MessageBubble`, `AIActionBar`, `AccountHealthBadge`
- `useSocialRealtime()` hook — subscribes to `social_conversations` & `social_messages` filtered by account

## Enroll admin surface

- `EnrollmentAdmin.tsx`: add "Social CRM" sidebar link -> `/enroll/admin/social`
- Enroll admin dashboard: add 4 summary cards (total accounts, today's DMs, unread, AI response rate) linking into the inbox

## Reusing the Telegram sales agent

`social-ai-reply` calls the existing sales-agent code path (same system prompt, product catalog, and course-recommendation logic already used in `telegram-webhook`). No new prompt engineering in phase 1 — just an adapter that maps Instagram conversation history -> the same message format the agent expects, and returns text/attachments.

## Deferred to later phases
Comment Manager, Content Planner + Publishing, Full Lead CRM pipeline UI (schema will already exist), Automation workflow builder, Analytics dashboards, Knowledge Base ingestion, Reports/exports, Team roles/permissions, Multi-platform (Telegram/WhatsApp/etc.) extension of same schema.

## Blockers before I start coding
1. NovinHub API docs URL
2. Confirmation you have a NovinHub API key ready (I'll open the secure secret form when it's time)
