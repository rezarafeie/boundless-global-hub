ALTER TABLE public.admin_settings 
  ADD COLUMN IF NOT EXISTS zarinpal_use_proxy boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS zarinpal_proxy_url text;