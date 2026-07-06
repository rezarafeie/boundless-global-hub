ALTER TABLE public.admin_settings 
  ADD COLUMN IF NOT EXISTS telegram_bot_welcome_logged_in TEXT,
  ADD COLUMN IF NOT EXISTS telegram_bot_welcome_logged_out TEXT;