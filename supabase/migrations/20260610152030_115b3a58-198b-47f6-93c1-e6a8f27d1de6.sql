CREATE TABLE IF NOT EXISTS public.telegram_login_tokens (
  token TEXT PRIMARY KEY,
  otp_code TEXT,
  telegram_chat_id BIGINT,
  telegram_username TEXT,
  first_name TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.telegram_login_tokens TO anon, authenticated;
GRANT ALL ON public.telegram_login_tokens TO service_role;

ALTER TABLE public.telegram_login_tokens ENABLE ROW LEVEL SECURITY;

-- No client-side policies; access is only via edge functions using service role.
CREATE POLICY "service role only - select" ON public.telegram_login_tokens
  FOR SELECT TO authenticated, anon USING (false);

CREATE INDEX IF NOT EXISTS idx_telegram_login_tokens_chat_id
  ON public.telegram_login_tokens(telegram_chat_id);
