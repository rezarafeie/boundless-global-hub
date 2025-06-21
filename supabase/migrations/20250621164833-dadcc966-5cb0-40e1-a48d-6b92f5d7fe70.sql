
-- First, let's fix the RLS policies for messenger_messages table
-- The current policies are too restrictive and don't account for the session-based authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messenger_messages;

-- Enable RLS on messenger_messages table
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;

-- Create new policies that work with the session-based authentication system
-- Allow users to view messages in rooms they have access to or their private messages
CREATE POLICY "Users can view accessible messages" ON public.messenger_messages
FOR SELECT USING (
  -- For room messages: allow if user is approved and room allows them
  (room_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
  ))
  OR
  -- For private messages: allow if user is sender or recipient
  (room_id IS NULL AND (
    sender_id IN (
      SELECT us.user_id FROM public.user_sessions us
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
    )
    OR
    recipient_id IN (
      SELECT us.user_id FROM public.user_sessions us
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
    )
  ))
);

-- Allow users to insert messages
CREATE POLICY "Users can create messages" ON public.messenger_messages
FOR INSERT WITH CHECK (
  -- User must be authenticated via session
  sender_id IN (
    SELECT us.user_id FROM public.user_sessions us
    JOIN public.chat_users cu ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_approved = true
  )
);

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages" ON public.messenger_messages
FOR UPDATE USING (
  sender_id IN (
    SELECT us.user_id FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messenger_messages
FOR DELETE USING (
  sender_id IN (
    SELECT us.user_id FROM public.user_sessions us
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
  )
);

-- Also fix RLS for chat_rooms to ensure proper access
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Allow viewing active rooms based on user permissions
CREATE POLICY "Users can view accessible rooms" ON public.chat_rooms
FOR SELECT USING (
  is_active = true AND (
    -- Public rooms are accessible to all approved users
    (type = 'public_group' AND EXISTS (
      SELECT 1 FROM public.user_sessions us
      JOIN public.chat_users cu ON cu.id = us.user_id
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
      AND cu.is_approved = true
    ))
    OR
    -- Boundless rooms only for boundless-approved users
    (type = 'boundless_group' AND EXISTS (
      SELECT 1 FROM public.user_sessions us
      JOIN public.chat_users cu ON cu.id = us.user_id
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
      AND cu.is_approved = true
      AND cu.bedoun_marz_approved = true
    ))
    OR
    -- Other room types accessible to approved users
    (type IN ('announcement_channel', 'support_chat') AND EXISTS (
      SELECT 1 FROM public.user_sessions us
      JOIN public.chat_users cu ON cu.id = us.user_id
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true
      AND cu.is_approved = true
    ))
  )
);

-- Create a function to set session context for RLS
CREATE OR REPLACE FUNCTION public.set_session_context(session_token text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.session_token', session_token, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
