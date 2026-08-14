ALTER TABLE public.webinar_entries
  ADD COLUMN IF NOT EXISTS telegram_support_username text,
  ADD COLUMN IF NOT EXISTS telegram_support_prefilled_message text,
  ADD COLUMN IF NOT EXISTS telegram_support_activated_message text;