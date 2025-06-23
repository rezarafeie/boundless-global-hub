
-- Fix RLS policies for support_conversations table
DROP POLICY IF EXISTS "Users can create support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can view their support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Support agents can update conversations" ON public.support_conversations;

-- Create proper RLS policies that work with the session-based authentication
CREATE POLICY "Users can create support conversations" 
  ON public.support_conversations 
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT us.user_id 
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
    )
  );

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
    OR user_id IN (
      SELECT us.user_id 
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
    )
  );

-- Fix the foreign key constraint issue by making it nullable temporarily
-- This allows messages to exist without a formal conversation record
ALTER TABLE public.messenger_messages 
ALTER COLUMN conversation_id DROP NOT NULL;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id INTEGER;
  user_id_from_session INTEGER;
  user_thread_type_id INTEGER DEFAULT 1;
BEGIN
  -- If this is a message to support (recipient_id = 1 and no room_id)
  IF NEW.recipient_id = 1 AND NEW.room_id IS NULL THEN
    -- Set session context first
    IF current_setting('app.session_token', true) IS NOT NULL THEN
      PERFORM public.set_session_context(current_setting('app.session_token', true));
    END IF;
    
    -- Get user ID from current session or use sender_id as fallback
    SELECT us.user_id INTO user_id_from_session
    FROM public.user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true 
    AND us.last_activity > NOW() - INTERVAL '24 hours'
    LIMIT 1;
    
    IF user_id_from_session IS NULL THEN
      user_id_from_session := NEW.sender_id;
    END IF;
    
    -- Determine thread type based on user's boundless status
    SELECT CASE 
      WHEN cu.bedoun_marz = true THEN 2 -- Boundless support
      ELSE 1 -- Academy support
    END INTO user_thread_type_id
    FROM public.chat_users cu 
    WHERE cu.id = user_id_from_session;
    
    -- If no conversation_id provided, get or create one
    IF NEW.conversation_id IS NULL THEN
      -- Try to find existing open conversation
      SELECT sc.id INTO conv_id 
      FROM public.support_conversations sc
      WHERE sc.user_id = user_id_from_session 
        AND sc.thread_type_id = user_thread_type_id
        AND sc.status IN ('open', 'assigned')
      ORDER BY sc.created_at DESC 
      LIMIT 1;
      
      -- If no existing conversation, create new one
      IF conv_id IS NULL THEN
        INSERT INTO public.support_conversations (user_id, status, priority, last_message_at, thread_type_id)
        VALUES (user_id_from_session, 'open', 'normal', NEW.created_at, user_thread_type_id)
        RETURNING id INTO conv_id;
      END IF;
      
      NEW.conversation_id := conv_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS handle_support_message_trigger ON public.messenger_messages;
CREATE TRIGGER handle_support_message_trigger
  BEFORE INSERT ON public.messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_support_message();
