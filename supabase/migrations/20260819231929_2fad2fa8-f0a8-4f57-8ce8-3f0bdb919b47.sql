CREATE TABLE public.support_activation_followup_claims (
  custom_followup_id uuid NOT NULL REFERENCES public.support_activation_custom_followups(id) ON DELETE CASCADE,
  user_id integer NOT NULL,
  delivery_number integer NOT NULL,
  support_activation_id uuid REFERENCES public.support_activations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'claimed',
  claimed_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (custom_followup_id, user_id, delivery_number)
);

GRANT ALL ON public.support_activation_followup_claims TO service_role;

ALTER TABLE public.support_activation_followup_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages custom followup claims"
ON public.support_activation_followup_claims
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.claim_support_custom_followup(
  _custom_followup_id uuid,
  _user_id integer,
  _delivery_number integer,
  _support_activation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.support_activation_followup_claims (
    custom_followup_id,
    user_id,
    delivery_number,
    support_activation_id
  ) VALUES (
    _custom_followup_id,
    _user_id,
    _delivery_number,
    _support_activation_id
  )
  ON CONFLICT (custom_followup_id, user_id, delivery_number) DO NOTHING;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_support_custom_followup(uuid, integer, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_support_custom_followup(uuid, integer, integer, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_support_custom_followup(
  _custom_followup_id uuid,
  _user_id integer,
  _delivery_number integer,
  _status text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.support_activation_followup_claims
  SET status = _status,
      completed_at = now()
  WHERE custom_followup_id = _custom_followup_id
    AND user_id = _user_id
    AND delivery_number = _delivery_number;
$$;

REVOKE ALL ON FUNCTION public.complete_support_custom_followup(uuid, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_support_custom_followup(uuid, integer, integer, text) TO service_role;