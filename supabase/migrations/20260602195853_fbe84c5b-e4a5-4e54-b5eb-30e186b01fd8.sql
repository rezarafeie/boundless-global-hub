ALTER TABLE public.telegram_forms
  ADD COLUMN IF NOT EXISTS confirmation_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmation_test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL;