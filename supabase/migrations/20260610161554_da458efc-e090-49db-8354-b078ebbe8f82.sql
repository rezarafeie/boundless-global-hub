
ALTER TABLE public.telegram_login_tokens
  ADD COLUMN IF NOT EXISTS pending_phone text,
  ADD COLUMN IF NOT EXISTS pending_country_code text,
  ADD COLUMN IF NOT EXISTS pending_email text,
  ADD COLUMN IF NOT EXISTS pending_first_name text,
  ADD COLUMN IF NOT EXISTS contact_otp_code text,
  ADD COLUMN IF NOT EXISTS contact_otp_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
