ALTER TABLE public.telegram_bot_sessions ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'telegram';
ALTER TABLE public.telegram_bot_sessions DROP CONSTRAINT IF EXISTS telegram_bot_sessions_pkey;
ALTER TABLE public.telegram_bot_sessions ADD PRIMARY KEY (chat_id, channel);

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS bale_chat_id bigint;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS bale_linked_at timestamp with time zone;

ALTER TABLE public.webinar_support_activations ADD COLUMN IF NOT EXISTS bale_chat_id bigint;

ALTER TABLE public.telegram_login_tokens ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'telegram';
ALTER TABLE public.webinar_login_tokens ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'telegram';
ALTER TABLE public.lead_requests ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'telegram';

CREATE INDEX IF NOT EXISTS idx_enrollments_bale_chat_id ON public.enrollments (bale_chat_id);