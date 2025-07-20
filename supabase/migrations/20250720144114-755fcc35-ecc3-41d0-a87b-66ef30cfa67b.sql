-- Fix RLS policies for courses table to allow admin updates
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users
    WHERE chat_users.id = ((auth.uid())::text)::integer
    AND chat_users.is_messenger_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_users
    WHERE chat_users.id = ((auth.uid())::text)::integer
    AND chat_users.is_messenger_admin = true
  )
);