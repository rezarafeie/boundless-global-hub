-- Fix RLS policies for chat_rooms to properly enforce boundless-only restrictions

-- Drop the overly permissive policy that allows all authenticated users to see all rooms
DROP POLICY IF EXISTS "Rooms policy for authenticated users" ON public.chat_rooms;

-- Update the existing policy to be more comprehensive and handle all operations
DROP POLICY IF EXISTS "Users can view public rooms" ON public.chat_rooms;

-- Create a comprehensive policy that properly enforces boundless-only restrictions
CREATE POLICY "Users can access appropriate rooms"
ON public.chat_rooms
FOR ALL
TO authenticated
USING (
  is_active = true 
  AND (
    -- Non-boundless rooms are visible to all authenticated users with valid sessions
    (is_boundless_only = false AND EXISTS (
      SELECT 1 FROM user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true) 
      AND us.is_active = true
    ))
    OR
    -- Boundless-only rooms are only visible to approved boundless members
    (is_boundless_only = true AND EXISTS (
      SELECT 1 FROM chat_users cu
      JOIN user_sessions us ON cu.id = us.user_id
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
      AND cu.bedoun_marz_approved = true
    ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true
  )
);