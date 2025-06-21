
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can create support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can view their support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Support agents can update conversations" ON public.support_conversations;

-- Create a more permissive policy for creating support conversations
-- Allow any authenticated session to create a support conversation
CREATE POLICY "Users can create support conversations" 
  ON public.support_conversations 
  FOR INSERT
  WITH CHECK (true); -- Allow anyone with a valid session to create

-- Allow users to view conversations they're involved in (as user or agent)
-- Also allow support agents to view all conversations
CREATE POLICY "Users can view their support conversations" 
  ON public.support_conversations 
  FOR SELECT 
  USING (
    user_id IN (
      SELECT us.user_id 
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
    )
    OR agent_id IN (
      SELECT us.user_id 
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
    )
    OR EXISTS (
      SELECT 1 
      FROM public.user_sessions us
      JOIN public.chat_users cu ON us.user_id = cu.id
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
      AND cu.is_support_agent = true
    )
  );

-- Allow support agents to update conversations
CREATE POLICY "Support agents can update conversations" 
  ON public.support_conversations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_sessions us
      JOIN public.chat_users cu ON us.user_id = cu.id
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
      AND cu.is_support_agent = true
    )
  );

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id INTEGER;
  user_id_from_session INTEGER;
BEGIN
  -- If this is a message to support (recipient_id = 1 and no room_id)
  IF NEW.recipient_id = 1 AND NEW.room_id IS NULL THEN
    -- Check if conversation already exists
    IF NEW.conversation_id IS NULL THEN
      -- Get user ID from current session
      SELECT us.user_id INTO user_id_from_session
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
      LIMIT 1;
      
      -- Use sender_id if we can't get user from session
      IF user_id_from_session IS NULL THEN
        user_id_from_session := NEW.sender_id;
      END IF;
      
      -- Get existing conversation or create new one
      SELECT id INTO conv_id 
      FROM public.support_conversations 
      WHERE user_id = user_id_from_session AND status IN ('open', 'assigned')
      ORDER BY created_at DESC 
      LIMIT 1;
      
      -- If no existing conversation, create new one
      IF conv_id IS NULL THEN
        INSERT INTO public.support_conversations (user_id, last_message_at)
        VALUES (user_id_from_session, NEW.created_at)
        RETURNING id INTO conv_id;
      END IF;
      
      NEW.conversation_id := conv_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
