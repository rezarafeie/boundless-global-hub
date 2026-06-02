ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS zibal_enabled boolean NOT NULL DEFAULT false;