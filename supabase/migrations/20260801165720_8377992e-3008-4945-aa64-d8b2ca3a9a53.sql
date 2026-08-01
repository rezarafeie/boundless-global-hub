ALTER TABLE public.sso_tokens
  ADD COLUMN IF NOT EXISTS multi_use boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sso_tokens()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.sso_tokens WHERE expires_at < now();
$$;