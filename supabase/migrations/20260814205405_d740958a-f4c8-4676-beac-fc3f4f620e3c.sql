
ALTER TABLE public.webinar_entries
  ADD COLUMN IF NOT EXISTS telegram_support_activation_buttons jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.webinar_support_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL,
  telegram_chat_id bigint NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'pending',
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (webinar_id, telegram_chat_id)
);

GRANT SELECT ON public.webinar_support_activations TO authenticated;
GRANT ALL ON public.webinar_support_activations TO service_role;

ALTER TABLE public.webinar_support_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view webinar support activations"
ON public.webinar_support_activations FOR SELECT TO authenticated USING (true);
