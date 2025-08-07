-- Allow null user_id for test_enrollments to support anonymous test enrollments
ALTER TABLE public.test_enrollments ALTER COLUMN user_id DROP NOT NULL;