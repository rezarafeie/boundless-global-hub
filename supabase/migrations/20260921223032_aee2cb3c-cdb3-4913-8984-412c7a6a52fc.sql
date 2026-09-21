ALTER TABLE public.smart_test_v2_submissions
  ADD COLUMN IF NOT EXISTS ai_checkpoints jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_diagnosis jsonb,
  ADD COLUMN IF NOT EXISTS ai_status text,
  ADD COLUMN IF NOT EXISTS adaptive_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS adaptive_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS long_term_fit text,
  ADD COLUMN IF NOT EXISTS best_starting_path text,
  ADD COLUMN IF NOT EXISTS ai_confidence text,
  ADD COLUMN IF NOT EXISTS next_action text;