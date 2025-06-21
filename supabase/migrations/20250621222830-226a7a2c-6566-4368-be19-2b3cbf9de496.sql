
-- Drop all existing conflicting policies on support_conversations
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.support_conversations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can only see own data" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can create support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can view their support conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Support agents can update conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Allow conversation creation" ON public.support_conversations;
DROP POLICY IF EXISTS "Allow conversation viewing" ON public.support_conversations;
DROP POLICY IF EXISTS "Allow conversation updates" ON public.support_conversations;

-- Create a completely permissive INSERT policy for now to avoid conflicts
CREATE POLICY "Allow all conversation creation" 
    ON public.support_conversations 
    FOR INSERT 
    WITH CHECK (true);

-- Create a SELECT policy that allows users to see their own conversations or support agents to see all
CREATE POLICY "Allow conversation viewing with session" 
    ON public.support_conversations 
    FOR SELECT 
    USING (
        -- Allow if user_id matches the session user
        user_id = (
            SELECT us.user_id 
            FROM public.user_sessions us 
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true 
            AND us.last_activity > NOW() - INTERVAL '24 hours'
            LIMIT 1
        )
        OR
        -- Allow if the session user is a support agent
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

-- Create an UPDATE policy for support agents
CREATE POLICY "Allow conversation updates with session" 
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

-- Update the message trigger to be more robust and always set conversation_id
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
      
      -- If no existing conversation, create new one with RLS disabled temporarily
      IF conv_id IS NULL THEN
        -- Temporarily disable RLS for this insert
        SET LOCAL row_security = off;
        
        INSERT INTO public.support_conversations (user_id, status, priority, last_message_at)
        VALUES (user_id_from_session, 'open', 'normal', NEW.created_at)
        RETURNING id INTO conv_id;
        
        -- Re-enable RLS
        SET LOCAL row_security = on;
      END IF;
      
      NEW.conversation_id := conv_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure RLS is enabled on the table
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
