
-- 1. New course fields
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS telegram_support_activation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_course_access_via_bot_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_bot_welcome_message text;

-- 2. Status enum
DO $$ BEGIN
  CREATE TYPE public.support_activation_status AS ENUM (
    'not_started','opened_bot','clicked_support_button',
    'pending_manual_confirmation','activated','needs_followup','failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. support_activations
CREATE TABLE IF NOT EXISTS public.support_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  activation_token text NOT NULL UNIQUE,
  bot_deep_link text NOT NULL,
  support_prefilled_link text,
  status public.support_activation_status NOT NULL DEFAULT 'not_started',
  telegram_id bigint,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  opened_bot_at timestamptz,
  clicked_support_button_at timestamptz,
  activated_at timestamptz,
  activated_by_admin_id integer,
  assigned_agent_id integer,
  admin_note text,
  last_followup_at timestamptz,
  followup_count integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_support_activations_user ON public.support_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_activations_course ON public.support_activations(course_id);
CREATE INDEX IF NOT EXISTS idx_support_activations_status ON public.support_activations(status);
CREATE INDEX IF NOT EXISTS idx_support_activations_assigned_agent ON public.support_activations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_support_activations_telegram_id ON public.support_activations(telegram_id);

GRANT SELECT ON public.support_activations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_activations TO authenticated;
GRANT ALL ON public.support_activations TO service_role;

ALTER TABLE public.support_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_read_all"
  ON public.support_activations FOR SELECT
  USING (true);

CREATE POLICY "sa_service_write"
  ON public.support_activations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sa_auth_update"
  ON public.support_activations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "sa_auth_insert"
  ON public.support_activations FOR INSERT
  TO authenticated WITH CHECK (true);

-- updated_at trigger
CREATE TRIGGER trg_support_activations_updated_at
  BEFORE UPDATE ON public.support_activations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. support_activation_events
CREATE TABLE IF NOT EXISTS public.support_activation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_activation_id uuid NOT NULL REFERENCES public.support_activations(id) ON DELETE CASCADE,
  user_id integer,
  course_id uuid,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sae_activation ON public.support_activation_events(support_activation_id);
CREATE INDEX IF NOT EXISTS idx_sae_type ON public.support_activation_events(event_type);

GRANT SELECT ON public.support_activation_events TO anon;
GRANT SELECT, INSERT ON public.support_activation_events TO authenticated;
GRANT ALL ON public.support_activation_events TO service_role;

ALTER TABLE public.support_activation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sae_read_all" ON public.support_activation_events FOR SELECT USING (true);
CREATE POLICY "sae_service_write" ON public.support_activation_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sae_auth_insert" ON public.support_activation_events FOR INSERT TO authenticated WITH CHECK (true);

-- 5. ensure_support_activation function
CREATE OR REPLACE FUNCTION public.ensure_support_activation(
  p_user_id integer,
  p_course_id uuid,
  p_enrollment_id uuid DEFAULT NULL
) RETURNS public.support_activations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.support_activations;
  v_token text;
  v_bot_username text;
  v_deep_link text;
BEGIN
  SELECT * INTO v_row
  FROM public.support_activations
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND ((enrollment_id IS NULL AND p_enrollment_id IS NULL) OR enrollment_id = p_enrollment_id)
  LIMIT 1;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '');
  SELECT COALESCE(telegram_bot_username, 'rafiei_bot') INTO v_bot_username
  FROM public.admin_settings WHERE id = 1;
  v_bot_username := regexp_replace(COALESCE(v_bot_username,'rafiei_bot'), '^@', '');
  v_deep_link := 'https://t.me/' || v_bot_username || '?start=sact_' || v_token;

  INSERT INTO public.support_activations(
    user_id, course_id, enrollment_id, activation_token, bot_deep_link, status
  ) VALUES (
    p_user_id, p_course_id, p_enrollment_id, v_token, v_deep_link, 'not_started'
  ) RETURNING * INTO v_row;

  INSERT INTO public.support_activation_events(
    support_activation_id, user_id, course_id, event_type, payload_json
  ) VALUES (
    v_row.id, p_user_id, p_course_id, 'created', jsonb_build_object('token', v_token)
  );

  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.ensure_support_activation(integer, uuid, uuid) TO anon, authenticated, service_role;

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_activations;
