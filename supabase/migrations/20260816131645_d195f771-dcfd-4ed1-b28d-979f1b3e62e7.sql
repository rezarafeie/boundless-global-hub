CREATE TABLE public.call_agent_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer REFERENCES public.chat_users(id) ON DELETE SET NULL,
  email text NOT NULL,
  extension text NOT NULL,
  display_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX call_agent_extensions_email_key ON public.call_agent_extensions (lower(email));
CREATE INDEX call_agent_extensions_user_id_idx ON public.call_agent_extensions (user_id);

GRANT SELECT ON public.call_agent_extensions TO authenticated;
GRANT ALL ON public.call_agent_extensions TO service_role;

ALTER TABLE public.call_agent_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read call agent extensions"
ON public.call_agent_extensions FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_call_agent_extensions_updated_at
BEFORE UPDATE ON public.call_agent_extensions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();