CREATE TABLE public.webinar_login_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  webinar_id uuid NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  phone text NOT NULL,
  display_name text,
  telegram_chat_id bigint,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '365 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webinar_login_tokens TO anon;
GRANT SELECT ON public.webinar_login_tokens TO authenticated;
GRANT ALL ON public.webinar_login_tokens TO service_role;

ALTER TABLE public.webinar_login_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read valid webinar login tokens"
ON public.webinar_login_tokens
FOR SELECT
USING (expires_at > now());

CREATE INDEX idx_webinar_login_tokens_webinar ON public.webinar_login_tokens(webinar_id);

CREATE TRIGGER update_webinar_login_tokens_updated_at
BEFORE UPDATE ON public.webinar_login_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();