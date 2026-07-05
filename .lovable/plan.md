# Telegram Support Activation Tracking System

A full activation-tracking flow where the Telegram bot is only a gateway. Real support still happens in the @rafieiacademy chat, but every step (dashboard click → bot open → support button click → manual activation) is logged so admins can follow up.

## 1. Course-edit toggles (admin)

Add three new fields to `courses` (edit page → "پشتیبانی و تلگرام" section):

- `telegram_support_activation_enabled` (bool) — enables the whole tracked flow. When ON, the "Activate Support" card in enrollment/dashboard sends the student through the bot deep link instead of the current direct `t.me/rafieiacademy?text=...` link.
- `telegram_course_access_via_bot_enabled` (bool) — same idea for the "Course access via Telegram" card (bot-mediated instead of direct channel/group link).
- `telegram_bot_welcome_message` (text, Persian, with `{{name}}` / `{{course_title}}` placeholders) — shown when the bot receives the deep link. Prefilled with the default message from the spec.

The existing per-course "prefilled support message" field is reused as the message template the bot's inline button opens in @rafieiacademy.

## 2. Database

New tables (both RLS-enabled, granted to `authenticated` + `service_role`):

**`support_activations`** — one row per (user, course, order):
`id, user_id, course_id, enrollment_id, activation_token (unique), bot_deep_link, support_prefilled_link, status, telegram_id, telegram_username, telegram_first_name, telegram_last_name, opened_bot_at, clicked_support_button_at, activated_at, activated_by_admin_id, last_followup_at, followup_count, admin_note, assigned_agent_id, metadata_json, created_at, updated_at`

Status enum: `not_started | opened_bot | clicked_support_button | pending_manual_confirmation | activated | needs_followup | failed`.

**`support_activation_events`** — append-only audit log:
`id, support_activation_id, user_id, course_id, event_type, payload_json, created_at`.

RLS:
- Students: `SELECT` their own rows only.
- Admins (`has_role admin`): full access.
- Support agents: access rows where `assigned_agent_id = auth.uid()` or unassigned.
- Inserts/updates from the bot happen via service role in the edge function.

A DB function `ensure_support_activation(user_id, course_id, enrollment_id)` creates the row on demand and returns the token / links.

## 3. Edge functions

- `telegram-bot-webhook` (extend existing bot webhook if present, otherwise new): handles `/start sact_<token>`. Validates token, updates status → `opened_bot`, stores telegram user info, sends the Persian welcome message with an inline URL button whose URL is the encoded `t.me/rafieiacademy?text=...` support link. Logs `opened_bot` event. When the inline button is pressed (callback_query), updates status → `clicked_support_button`, logs the event.
- `support-activation-create`: called from the dashboard card. Creates/returns the activation row and returns `bot_deep_link`. Logs `dashboard_clicked`.
- `support-activation-followup-cron` (scheduled, optional): moves stale rows to `needs_followup` / `pending_manual_confirmation` per the timing rules.

Bot secret verified via `X-Telegram-Bot-Api-Secret-Token` (derived from `TELEGRAM_API_KEY`, matches existing pattern in the project).

## 4. Student dashboard card

Update `TelegramEnrollmentActivation` (and the equivalent "course access" card) to branch on the new course toggles:

- If toggle OFF → current direct `t.me/...` behaviour (unchanged).
- If toggle ON → call `support-activation-create`, then render the four states from the spec (`not_started`, `opened_bot`, `clicked_support_button/pending_manual_confirmation`, `activated`) with the exact Persian titles/texts/buttons. Button always opens the bot deep link in a new tab; realtime subscription on `support_activations` updates the card as the status advances.

Mounted in both website mode (enrollment/course-access pages) and app mode (AppLessonView / AppCourseDetail), matching where the current activation card already appears.

## 5. Admin dashboard `/admin/support-activations`

New page + sidebar entry ("فعال‌سازی پشتیبانی"):

- Table of activations with filters: course, status, purchase date range, opened-bot, clicked-support-button, activated/not, search by name/phone/email/token.
- Smart segment tabs: "خریدار بدون ورود به ربات", "وارد ربات، بدون کلیک", "کلیک کرده، تایید نشده", ">24h", ">3d", "دوره‌های گران بدون فعال‌سازی".
- Row actions: mark activated, mark needs-followup, copy support message, copy bot deep link, regenerate token, add note, assign to agent, view event timeline.
- CSV export.

## 6. Lead management integration

Add "وضعیت فعال‌سازی پشتیبانی" filter + the six smart segments to the existing lead list, joined via `support_activations` on `user_id`.

## 7. Analytics widgets

New card set on the admin dashboard: total buyers, opened-bot rate, clicked-support-button rate, manual activation rate, pending count, needs-followup count, avg time purchase→bot, avg time bot→activation, activation rate by course.

## Technical notes

- Token: `crypto.randomUUID()` (URL-safe, unique index).
- Deep link stored server-side; bot username pulled from `admin_settings.telegram_bot_username` (already used elsewhere).
- Realtime enabled on `support_activations` so the student card auto-refreshes when the bot updates status.
- All new UI is Persian RTL, reuses existing shadcn tokens (no hardcoded colours).
- Because Telegram cannot confirm the user actually pressed Send in @rafieiacademy, final `activated` transition is either (a) manual by admin/support, or (b) if the bot is later added to the support account as a userbot, automatic — schema supports both; only the manual path is built now.

## Rollout order

1. Migration (tables, enum, RLS, grants, `ensure_support_activation` function, realtime publication).
2. Course-edit form fields + types.
3. `telegram-bot-webhook` handler for `sact_` deep link + callback.
4. `support-activation-create` edge function.
5. Student dashboard card rewrite (branch on toggle).
6. Admin `/admin/support-activations` page + sidebar entry.
7. Lead management filter + smart segments.
8. Analytics widgets.
9. Optional follow-up cron.

Confirm and I'll start with step 1 (the migration).
