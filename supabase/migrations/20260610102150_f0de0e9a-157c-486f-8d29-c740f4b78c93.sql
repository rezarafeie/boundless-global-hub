
CREATE TABLE IF NOT EXISTS public.boundless_smart_test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_user_id integer NULL REFERENCES public.chat_users(id) ON DELETE SET NULL,
  full_name text,
  phone text,
  email text,
  interest text,
  mindset text,
  track_id text,
  outcome text NOT NULL DEFAULT 'in_progress',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.boundless_smart_test_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boundless_smart_test_submissions TO authenticated;
GRANT ALL ON public.boundless_smart_test_submissions TO service_role;

ALTER TABLE public.boundless_smart_test_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create boundless smart test submission"
  ON public.boundless_smart_test_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update own submission by id"
  ON public.boundless_smart_test_submissions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Linked chat user can read own submissions"
  ON public.boundless_smart_test_submissions
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_bsts_chat_user ON public.boundless_smart_test_submissions(chat_user_id);
CREATE INDEX IF NOT EXISTS idx_bsts_phone ON public.boundless_smart_test_submissions(phone);
CREATE INDEX IF NOT EXISTS idx_bsts_created_at ON public.boundless_smart_test_submissions(created_at DESC);

CREATE TRIGGER trg_bsts_updated_at
  BEFORE UPDATE ON public.boundless_smart_test_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
