-- Add Telegram link fields to chat_users
ALTER TABLE public.chat_users
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_chat_users_telegram_chat_id ON public.chat_users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- Conversation state for the Telegram bot
CREATE TABLE IF NOT EXISTS public.telegram_bot_sessions (
  chat_id BIGINT PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  state TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_bot_sessions TO authenticated;
GRANT ALL ON public.telegram_bot_sessions TO service_role;

ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages telegram_bot_sessions"
ON public.telegram_bot_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Outbound notification queue
CREATE TABLE IF NOT EXISTS public.telegram_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  notification_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_telegram_notif_queue_status ON public.telegram_notification_queue(status, created_at);

GRANT SELECT, INSERT, UPDATE ON public.telegram_notification_queue TO authenticated;
GRANT ALL ON public.telegram_notification_queue TO service_role;

ALTER TABLE public.telegram_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages telegram_notification_queue"
ON public.telegram_notification_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Settings columns for telegram notification toggles in admin_settings
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS telegram_notify_lead_assigned BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_notify_consultation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_notify_daily_summary BOOLEAN NOT NULL DEFAULT true;