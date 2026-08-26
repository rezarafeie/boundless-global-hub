ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS rafieipay_zibal_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rafieipay_zarinpal_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rafieipay_snapppay_enabled boolean NOT NULL DEFAULT false;