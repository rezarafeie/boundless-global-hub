ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS telegram_bot_activated_delay_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS telegram_bot_activated_media_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS activation_extra_messages jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.bot_scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'telegram',
  chat_id bigint NOT NULL,
  business_connection_id text,
  text text NOT NULL DEFAULT '',
  media_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  keyboard jsonb,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_scheduled_messages TO service_role;
ALTER TABLE public.bot_scheduled_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bot_sched_pending ON public.bot_scheduled_messages (send_at) WHERE sent_at IS NULL;