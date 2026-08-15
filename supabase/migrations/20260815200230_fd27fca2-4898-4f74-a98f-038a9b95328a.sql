ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS ai_score integer,
  ADD COLUMN IF NOT EXISTS purchase_intent_score integer,
  ADD COLUMN IF NOT EXISTS resulted_in_sale boolean NOT NULL DEFAULT false;

ALTER TABLE public.call_center_settings
  ADD COLUMN IF NOT EXISTS high_intent_threshold integer NOT NULL DEFAULT 80;

CREATE TABLE IF NOT EXISTS public.call_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL UNIQUE,
  user_phone_normalized text,
  phone_assisted_sale boolean NOT NULL DEFAULT true,
  last_call_before_purchase uuid REFERENCES public.calls(id) ON DELETE SET NULL,
  agent_id integer,
  calls_before_purchase integer NOT NULL DEFAULT 0,
  talk_time_before_purchase integer NOT NULL DEFAULT 0,
  first_call_at timestamptz,
  last_call_at timestamptz,
  purchase_at timestamptz,
  amount numeric NOT NULL DEFAULT 0,
  attribution_window_days integer NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.call_attributions TO service_role;

ALTER TABLE public.call_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages call attributions"
ON public.call_attributions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_call_attributions_agent ON public.call_attributions(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_attributions_purchase_at ON public.call_attributions(purchase_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_resulted_in_sale ON public.calls(resulted_in_sale) WHERE resulted_in_sale;

CREATE TRIGGER update_call_attributions_updated_at
BEFORE UPDATE ON public.call_attributions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();