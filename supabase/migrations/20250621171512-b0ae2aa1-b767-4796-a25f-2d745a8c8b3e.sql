
-- Fix the RLS policies to allow proper message sending and room management

-- Drop existing policies that are causing issues
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Authenticated users can view active rooms" ON public.chat_rooms;

-- Create more permissive policies for messenger_messages
CREATE POLICY "Allow all operations on messages for valid sessions" ON public.messenger_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
    AND cu.id = sender_id
  )
);

-- Create policies for chat_rooms that allow admin operations
CREATE POLICY "Allow room operations for valid sessions" ON public.chat_rooms
FOR ALL USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
  )
);

-- Ensure the session context function works properly
CREATE OR REPLACE FUNCTION public.set_session_context(session_token text)
RETURNS void AS $$
BEGIN
  -- Set the session token in the configuration
  PERFORM set_config('app.session_token', session_token, true);
  
  -- Verify the session exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.session_token = session_token
    AND us.is_active = true
  ) THEN
    RAISE WARNING 'Invalid or inactive session token provided';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to set session context: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies for room management (allow admins/support agents to manage rooms)
CREATE POLICY "Allow room management for admins" ON public.chat_rooms
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
    AND (cu.is_support_agent = true OR cu.role = 'admin')
  )
);

CREATE POLICY "Allow room updates for admins" ON public.chat_rooms
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
    AND (cu.is_support_agent = true OR cu.role = 'admin')
  )
);
