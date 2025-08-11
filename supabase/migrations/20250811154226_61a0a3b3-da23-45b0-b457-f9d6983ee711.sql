-- Allow everyone to update chat_users (remove restrictive policy)
-- Drop the restrictive policy and create a more permissive one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_users' AND policyname = 'Admins and sales agents can update users'
  ) THEN
    DROP POLICY "Admins and sales agents can update users" ON public.chat_users;
  END IF;
END $$;

-- Create a more permissive policy that allows everyone to update user details
CREATE POLICY "Everyone can update users"
ON public.chat_users
FOR UPDATE
USING (true)
WITH CHECK (true);