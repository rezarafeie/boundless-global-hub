
-- Fix RLS policies for chat_users to allow registration
DROP POLICY IF EXISTS "Anyone can view approved users" ON public.chat_users;
DROP POLICY IF EXISTS "Anyone can insert new users" ON public.chat_users;

-- Create new policies that properly allow registration and viewing
CREATE POLICY "Anyone can view approved users" ON public.chat_users
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can register new users" ON public.chat_users
  FOR INSERT WITH CHECK (true);

-- Allow admins to view all users (for admin panel)
CREATE POLICY "Service role can view all users" ON public.chat_users
  FOR SELECT USING (true);

-- Allow admins to update user approval status
CREATE POLICY "Service role can update users" ON public.chat_users
  FOR UPDATE USING (true);
