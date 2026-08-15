
-- =============== phone normalization helper ===============
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
BEGIN
  IF p_phone IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF d = '' THEN RETURN NULL; END IF;
  IF left(d, 4) = '0098' THEN d := '98' || substring(d from 5); END IF;
  IF left(d, 2) = '09' AND length(d) = 11 THEN d := '98' || substring(d from 2); END IF;
  IF left(d, 2) = '98' AND length(d) = 12 THEN RETURN d; END IF;
  IF length(d) = 10 AND left(d, 1) = '9' THEN RETURN '98' || d; END IF;
  RETURN d;
END;
$$;

-- =============== calls ===============
CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'daftareshoma',
  provider_call_id text NOT NULL,
  direction text NOT NULL DEFAULT 'unknown',
  status text NOT NULL DEFAULT 'unknown',
  disposition text,
  caller_number text,
  caller_number_normalized text,
  destination_number text,
  destination_number_normalized text,
  extension text,
  started_at timestamptz,
  answered_at timestamptz,
  ended_at timestamptz,
  waiting_seconds integer DEFAULT 0,
  talk_seconds integer DEFAULT 0,
  total_seconds integer DEFAULT 0,
  recording_id text,
  user_id integer,
  lead_id uuid,
  consultation_id uuid,
  webinar_registration_id uuid,
  order_id uuid,
  support_ticket_id uuid,
  agent_id integer,
  assigned_team_id uuid,
  source text,
  campaign_id uuid,
  match_confidence text,
  notes text,
  processing_status text NOT NULL DEFAULT 'pending',
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calls_provider_call_id_unique UNIQUE (provider, provider_call_id)
);
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calls service only" ON public.calls FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_calls_provider_call_id ON public.calls (provider_call_id);
CREATE INDEX idx_calls_started_at ON public.calls (started_at DESC);
CREATE INDEX idx_calls_user_id ON public.calls (user_id);
CREATE INDEX idx_calls_lead_id ON public.calls (lead_id);
CREATE INDEX idx_calls_agent_id ON public.calls (agent_id);
CREATE INDEX idx_calls_caller_norm ON public.calls (caller_number_normalized);
CREATE INDEX idx_calls_dest_norm ON public.calls (destination_number_normalized);
CREATE INDEX idx_calls_status ON public.calls (status);
CREATE INDEX idx_calls_direction ON public.calls (direction);
CREATE INDEX idx_calls_recording_id ON public.calls (recording_id);
CREATE INDEX idx_calls_processing_status ON public.calls (processing_status);

-- =============== call_recordings ===============
CREATE TABLE public.call_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  provider_recording_id text,
  status text NOT NULL DEFAULT 'pending',
  audio_url text,
  storage_path text,
  duration_seconds integer,
  mime_type text,
  error text,
  downloaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT call_recordings_call_unique UNIQUE (call_id)
);
GRANT ALL ON public.call_recordings TO service_role;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_recordings service only" ON public.call_recordings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_call_recordings_status ON public.call_recordings (status);

-- =============== call_transcripts ===============
CREATE TABLE public.call_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'fa',
  transcript text,
  segments jsonb,
  speaker_diarization jsonb,
  provider text,
  model text,
  processing_status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT call_transcripts_call_unique UNIQUE (call_id)
);
GRANT ALL ON public.call_transcripts TO service_role;
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_transcripts service only" ON public.call_transcripts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_call_transcripts_status ON public.call_transcripts (processing_status);

-- =============== call_ai_analysis ===============
CREATE TABLE public.call_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  summary text,
  customer_intent text,
  sentiment text,
  purchase_intent_score integer,
  customer_needs jsonb DEFAULT '[]'::jsonb,
  pain_points jsonb DEFAULT '[]'::jsonb,
  objections jsonb DEFAULT '[]'::jsonb,
  products_mentioned jsonb DEFAULT '[]'::jsonb,
  recommended_products jsonb DEFAULT '[]'::jsonb,
  next_action text,
  follow_up_required boolean DEFAULT false,
  recommended_follow_up_at timestamptz,
  opening_score integer,
  discovery_score integer,
  explanation_score integer,
  objection_handling_score integer,
  closing_score integer,
  overall_sales_score integer,
  agent_feedback text,
  customer_summary text,
  raw_ai_response jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT call_ai_analysis_call_unique UNIQUE (call_id)
);
GRANT ALL ON public.call_ai_analysis TO service_role;
ALTER TABLE public.call_ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_ai_analysis service only" ON public.call_ai_analysis FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_call_ai_analysis_intent ON public.call_ai_analysis (purchase_intent_score DESC);

-- =============== call_followups ===============
CREATE TABLE public.call_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id integer,
  lead_id uuid,
  agent_id integer,
  type text NOT NULL DEFAULT 'call_back',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  due_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completed_by integer,
  created_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.call_followups TO service_role;
ALTER TABLE public.call_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_followups service only" ON public.call_followups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_call_followups_status_due ON public.call_followups (status, due_at);
CREATE INDEX idx_call_followups_agent ON public.call_followups (agent_id);

-- =============== call_events ===============
CREATE TABLE public.call_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES public.calls(id) ON DELETE SET NULL,
  provider_event_id text,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'received',
  error text
);
GRANT ALL ON public.call_events TO service_role;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_events service only" ON public.call_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE UNIQUE INDEX idx_call_events_provider_event ON public.call_events (provider_event_id) WHERE provider_event_id IS NOT NULL;
CREATE INDEX idx_call_events_status ON public.call_events (status, received_at DESC);

-- =============== call_dispositions ===============
CREATE TABLE public.call_dispositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  is_positive boolean NOT NULL DEFAULT false,
  requires_followup boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.call_dispositions TO service_role;
ALTER TABLE public.call_dispositions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_dispositions service only" ON public.call_dispositions FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.call_dispositions (key, label, color, is_positive, requires_followup, display_order) VALUES
  ('interested', 'علاقه‌مند', '#16a34a', true, true, 1),
  ('not_interested', 'علاقه‌مند نیست', '#dc2626', false, false, 2),
  ('call_back', 'تماس مجدد', '#f59e0b', false, true, 3),
  ('no_answer', 'بی‌پاسخ', '#64748b', false, true, 4),
  ('purchased', 'خرید انجام شد', '#059669', true, false, 5),
  ('needs_consultation', 'نیاز به مشاوره', '#0ea5e9', true, true, 6),
  ('price_objection', 'اعتراض قیمتی', '#ea580c', false, true, 7),
  ('needs_more_info', 'نیاز به اطلاعات بیشتر', '#8b5cf6', false, true, 8);

-- =============== call_automation_rules ===============
CREATE TABLE public.call_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  trigger_type text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.call_automation_rules TO service_role;
ALTER TABLE public.call_automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_automation_rules service only" ON public.call_automation_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.call_automation_rules (name, trigger_type, conditions, actions, display_order) VALUES
  ('پیگیری تماس از دست رفته', 'missed_call', '{}'::jsonb,
   '[{"type":"create_followup","title":"بازگشت تماس از دست رفته","priority":"high","due_in_minutes":30}]'::jsonb, 1),
  ('سرنخ با نیت خرید بالا', 'ai_analysis_completed', '{"min_purchase_intent":80}'::jsonb,
   '[{"type":"create_followup","title":"پیگیری فوری مشتری با نیت خرید بالا","priority":"critical","due_in_minutes":120}]'::jsonb, 2);

-- =============== call_center_settings ===============
CREATE TABLE public.call_center_settings (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  auto_sync_enabled boolean NOT NULL DEFAULT true,
  sync_interval_minutes integer NOT NULL DEFAULT 5,
  recording_sync_enabled boolean NOT NULL DEFAULT true,
  transcription_enabled boolean NOT NULL DEFAULT false,
  ai_analysis_enabled boolean NOT NULL DEFAULT false,
  auto_lead_matching boolean NOT NULL DEFAULT true,
  auto_missed_call_followup boolean NOT NULL DEFAULT true,
  default_extension text,
  attribution_window_days integer NOT NULL DEFAULT 7,
  min_call_seconds_for_ai integer NOT NULL DEFAULT 30,
  notifications_enabled boolean NOT NULL DEFAULT true,
  missed_call_priority_rules jsonb NOT NULL DEFAULT '{"active_checkout":"critical","active_consultation":"high","recent_webinar":"high","existing_customer":"medium","unknown":"medium"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT call_center_settings_singleton CHECK (id = 1)
);
GRANT ALL ON public.call_center_settings TO service_role;
ALTER TABLE public.call_center_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_center_settings service only" ON public.call_center_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.call_center_settings (id) VALUES (1);

-- =============== daftareshoma_sync_state ===============
CREATE TABLE public.daftareshoma_sync_state (
  id integer PRIMARY KEY DEFAULT 1,
  last_synced_at timestamptz,
  last_call_id text,
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  calls_synced integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daftareshoma_sync_state_singleton CHECK (id = 1)
);
GRANT ALL ON public.daftareshoma_sync_state TO service_role;
ALTER TABLE public.daftareshoma_sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_state service only" ON public.daftareshoma_sync_state FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.daftareshoma_sync_state (id) VALUES (1);

-- =============== call_audit_logs ===============
CREATE TABLE public.call_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id integer,
  actor_name text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.call_audit_logs TO service_role;
ALTER TABLE public.call_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_audit_logs service only" ON public.call_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_call_audit_logs_created ON public.call_audit_logs (created_at DESC);

-- =============== updated_at triggers ===============
CREATE TRIGGER trg_calls_updated_at BEFORE UPDATE ON public.calls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_recordings_updated_at BEFORE UPDATE ON public.call_recordings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_transcripts_updated_at BEFORE UPDATE ON public.call_transcripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_ai_analysis_updated_at BEFORE UPDATE ON public.call_ai_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_followups_updated_at BEFORE UPDATE ON public.call_followups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_dispositions_updated_at BEFORE UPDATE ON public.call_dispositions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_automation_rules_updated_at BEFORE UPDATE ON public.call_automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_center_settings_updated_at BEFORE UPDATE ON public.call_center_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_daftareshoma_sync_state_updated_at BEFORE UPDATE ON public.daftareshoma_sync_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
