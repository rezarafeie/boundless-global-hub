ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS telegram_bot_activated_message text,
  ADD COLUMN IF NOT EXISTS telegram_bot_activation_buttons jsonb NOT NULL DEFAULT '[]'::jsonb;