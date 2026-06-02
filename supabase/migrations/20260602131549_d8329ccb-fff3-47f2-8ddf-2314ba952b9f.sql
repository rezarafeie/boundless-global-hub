
CREATE TABLE public.telegram_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ai_prompt TEXT,
  require_login BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.telegram_forms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_forms TO authenticated;
GRANT ALL ON public.telegram_forms TO service_role;
ALTER TABLE public.telegram_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active forms" ON public.telegram_forms FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage forms" ON public.telegram_forms FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.telegram_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.telegram_forms(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN NOT NULL DEFAULT true,
  options JSONB,
  help_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tff_form ON public.telegram_form_fields(form_id, order_index);

GRANT SELECT ON public.telegram_form_fields TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_form_fields TO authenticated;
GRANT ALL ON public.telegram_form_fields TO service_role;
ALTER TABLE public.telegram_form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fields" ON public.telegram_form_fields FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage fields" ON public.telegram_form_fields FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.telegram_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.telegram_forms(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL,
  chat_user_id BIGINT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  ai_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_tfs_form ON public.telegram_form_submissions(form_id, created_at DESC);
CREATE INDEX idx_tfs_chat ON public.telegram_form_submissions(chat_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_form_submissions TO authenticated;
GRANT ALL ON public.telegram_form_submissions TO service_role;
ALTER TABLE public.telegram_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view submissions" ON public.telegram_form_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.telegram_form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.telegram_form_submissions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.telegram_form_fields(id) ON DELETE CASCADE,
  value_text TEXT,
  value_json JSONB,
  file_url TEXT,
  file_mime TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tfa_sub ON public.telegram_form_answers(submission_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_form_answers TO authenticated;
GRANT ALL ON public.telegram_form_answers TO service_role;
ALTER TABLE public.telegram_form_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage answers" ON public.telegram_form_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_telegram_forms_updated_at BEFORE UPDATE ON public.telegram_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
