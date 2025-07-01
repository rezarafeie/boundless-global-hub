
-- Remove the password_hash column from academy_users table since we're using Supabase auth
ALTER TABLE public.academy_users DROP COLUMN IF EXISTS password_hash;
