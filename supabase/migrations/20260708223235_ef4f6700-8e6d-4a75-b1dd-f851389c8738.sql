ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS telegram_business_connection_id text,
ADD COLUMN IF NOT EXISTS telegram_business_connection_updated_at timestamp with time zone;