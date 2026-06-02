
ALTER TABLE public.telegram_forms
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_type TEXT NOT NULL DEFAULT 'message',
  ADD COLUMN IF NOT EXISTS confirmation_message TEXT,
  ADD COLUMN IF NOT EXISTS redirect_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT false;
