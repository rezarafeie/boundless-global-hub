ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS zarinpal_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS manual_payment_enabled boolean NOT NULL DEFAULT true;