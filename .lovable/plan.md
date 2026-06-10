# Telegram Login/Register for Academy

Add an alternative login/register flow using a Telegram bot, alongside the existing phone/password flow. User can manually toggle to Telegram from the auth screen.

## Flow (Bot-based OTP)

```text
Auth screen
  └─ [Phone] | [Telegram]  ← toggle
        │
        ▼ Telegram tab
  1) Show button: "Open @AcademyBot on Telegram"
     → Deep link: t.me/<bot>?start=<login_token>
  2) User opens bot, taps Start
     → telegram-webhook captures chat_id+username,
       links to login_token, sends 6-digit OTP in chat
  3) UI polls /telegram-login-status?token=login_token
     → as soon as chat_id is bound, show OTP input
  4) User pastes code → telegram-otp-verify
     - Existing telegram user → issue session, login
     - New user → ask for email + first name → create
       chat_users + academy_users → issue session
```

## Database (1 migration)

```sql
-- Add Telegram identity to chat_users
ALTER TABLE public.chat_users
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_users_telegram_chat_id
  ON public.chat_users(telegram_chat_id);

-- Short-lived login tokens (deep link payload)
CREATE TABLE public.telegram_login_tokens (
  token TEXT PRIMARY KEY,
  otp_code TEXT,
  telegram_chat_id BIGINT,
  telegram_username TEXT,
  first_name TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.telegram_login_tokens TO anon, authenticated;
GRANT ALL ON public.telegram_login_tokens TO service_role;
ALTER TABLE public.telegram_login_tokens ENABLE ROW LEVEL SECURITY;
-- access is via edge functions using service_role; no client policies needed
```

## Edge functions (4, all `verify_jwt = false`)

- `telegram-login-start` — POST, creates a `login_token`, returns `{ token, bot_url }`.
- `telegram-webhook` — Telegram → bot. Handles `/start <token>` and free-text `/login`. Stores chat_id+username on the token row, generates 6-digit OTP, sends to user via `sendMessage`.
- `telegram-login-status` — GET `?token=…` returns `{ bound: bool, telegram_username, first_name }` so the UI can advance to OTP input.
- `telegram-otp-verify` — POST `{ token, code, email?, firstName? }`. Verifies OTP, looks up `chat_users` by `telegram_chat_id`; if missing, requires `email` + `firstName` and creates `chat_users` + `academy_users` row, then issues a unified session (re-use `messengerService.createSession` pattern).

Bot API calls go through the existing Telegram helper pattern (`supabase/functions/_shared/telegram.ts`), which already uses `TELEGRAM_BOT_TOKEN`. After deploy, call `telegram-set-webhook` (existing function) so updates route to our new `telegram-webhook` — but note the project already has a `telegram-webhook` function for another bot. We'll add a small router switch inside it OR use a separate path. Cleanest: **add the login handler inside the existing `telegram-webhook`** and branch on `/start <token>` text.

## Frontend (`src/components/Chat/UnifiedMessengerAuth.tsx`)

- Add a small tab/toggle at the top: `[شماره موبایل] [تلگرام]`.
- New steps: `tg-open` → `tg-otp` → `tg-email` (only if new user).
- On mount of Telegram tab, call `telegram-login-start` → render "Open Telegram bot" button (`window.open(bot_url)`) + countdown.
- Poll `telegram-login-status` every 2s until `bound=true`, then show 6-digit `InputOTP`.
- Submit `telegram-otp-verify`; on `needs_email` response, show email + first name form, resubmit.
- On success, call existing `onAuthenticated(sessionToken, name, user)`.

## Secrets

Requires existing `TELEGRAM_BOT_TOKEN` (already configured for other flows — will verify with `fetch_secrets`; if missing, prompt user to add).

## Out of scope

- No changes to Iranian phone flow.
- No automatic geo-toggle (per user choice "manual toggle").
- No Telegram avatar storage.
