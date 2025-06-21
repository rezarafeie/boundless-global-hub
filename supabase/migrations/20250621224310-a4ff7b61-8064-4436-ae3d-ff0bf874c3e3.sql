
-- Fix the trigger function to handle RLS properly and ensure conversation creation works
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id INTEGER;
  user_id_from_session INTEGER;
  session_token_value TEXT;
BEGIN
  -- If this is a message to support (recipient_id = 1 and no room_id)
  IF NEW.recipient_id = 1 AND NEW.room_id IS NULL THEN
    -- Check if conversation already exists
    IF NEW.conversation_id IS NULL THEN
      -- Get session token from settings (this should be set by the application)
      BEGIN
        session_token_value := current_setting('app.session_token', false);
      EXCEPTION
        WHEN undefined_object THEN
          -- If session token is not set, use sender_id as fallback
          user_id_from_session := NEW.sender_id;
      END;
      
      -- If we have a session token, get user from session
      IF session_token_value IS NOT NULL THEN
        SELECT us.user_id INTO user_id_from_session
        FROM public.user_sessions us 
        WHERE us.session_token = session_token_value
        AND us.is_active = true 
        AND us.last_activity > NOW() - INTERVAL '24 hours'
        LIMIT 1;
      END IF;
      
      -- Fallback to sender_id if we can't get user from session
      IF user_id_from_session IS NULL THEN
        user_id_from_session := NEW.sender_id;
      END IF;
      
      -- Look for existing open conversation for this user
      SELECT id INTO conv_id 
      FROM public.support_conversations 
      WHERE user_id = user_id_from_session 
        AND status IN ('open', 'assigned')
      ORDER BY created_at DESC 
      LIMIT 1;
      
      -- If no existing conversation, create new one
      -- The trigger runs with elevated privileges, so RLS should not block this
      IF conv_id IS NULL THEN
        INSERT INTO public.support_conversations (user_id, status, priority, last_message_at)
        VALUES (user_id_from_session, 'open', 'normal', NEW.created_at)
        RETURNING id INTO conv_id;
      END IF;
      
      NEW.conversation_id := conv_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS trigger_handle_support_message ON public.messenger_messages;
CREATE TRIGGER trigger_handle_support_message
  BEFORE INSERT ON public.messenger_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_support_message();

-- Make sure RLS policies are correct and permissive for conversation creation
-- The permissive INSERT policy should already exist, but let's ensure it's there
DROP POLICY IF EXISTS "Allow all conversation creation" ON public.support_conversations;
CREATE POLICY "Allow all conversation creation" 
    ON public.support_conversations 
    FOR INSERT 
    WITH CHECK (true);
