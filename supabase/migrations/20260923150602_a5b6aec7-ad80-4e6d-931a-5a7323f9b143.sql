ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS bale_support_activation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bale_activation_link text,
  ADD COLUMN IF NOT EXISTS bale_bot_welcome_message text;

ALTER TABLE public.chat_users
  ADD COLUMN IF NOT EXISTS bale_chat_id bigint,
  ADD COLUMN IF NOT EXISTS bale_linked_at timestamptz;

ALTER TABLE public.support_activations
  ADD COLUMN IF NOT EXISTS bale_chat_id bigint,
  ADD COLUMN IF NOT EXISTS activation_channel text NOT NULL DEFAULT 'telegram';

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS bale_bot_username text;

CREATE INDEX IF NOT EXISTS idx_chat_users_bale_chat_id ON public.chat_users (bale_chat_id);