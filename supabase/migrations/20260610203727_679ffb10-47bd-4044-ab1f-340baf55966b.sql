-- Email infrastructure support tables for transactional emails
CREATE TABLE public.suppressed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.suppressed_emails TO service_role;
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  template_name text,
  recipient_email text,
  status text NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_send_log TO service_role;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.email_unsubscribe_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;