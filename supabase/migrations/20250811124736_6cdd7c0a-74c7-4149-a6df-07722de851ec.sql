-- Tighten chat_users update permissions: allow only admins and active sales agents
-- Drop overly permissive policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_users' AND policyname = 'Everyone can update users'
  ) THEN
    DROP POLICY "Everyone can update users" ON public.chat_users;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_users' AND policyname = 'Service role can update users'
  ) THEN
    DROP POLICY "Service role can update users" ON public.chat_users;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.chat_users ENABLE ROW LEVEL SECURITY;

-- Allow admins and active sales agents (based on current session) to update any users
CREATE POLICY "Admins and sales agents can update users"
ON public.chat_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_sessions us
    JOIN public.chat_users actor ON actor.id = us.user_id
    LEFT JOIN public.sales_agents sa ON sa.user_id = actor.id AND sa.is_active = true
    WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
      AND (
        actor.is_messenger_admin = true
        OR sa.id IS NOT NULL
      )
  )
);

-- Optionally, keep a policy for the database service role only (explicit)
CREATE POLICY "Service role can update users"
ON public.chat_users
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
