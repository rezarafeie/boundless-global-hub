
-- First, let's create a more robust trigger function that doesn't depend on session context
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id INTEGER;
  target_user_id INTEGER;
BEGIN
  -- If this is a message to support (recipient_id = 1 and no room_id)
  IF NEW.recipient_id = 1 AND NEW.room_id IS NULL THEN
    -- Use the sender_id directly as the user_id for the conversation
    target_user_id := NEW.sender_id;
    
    -- Check if conversation already exists for this user
    IF NEW.conversation_id IS NULL THEN
      -- Look for existing open conversation for this user
      SELECT id INTO conv_id 
      FROM public.support_conversations 
      WHERE user_id = target_user_id 
        AND status IN ('open', 'assigned')
      ORDER BY created_at DESC 
      LIMIT 1;
      
      -- If no existing conversation, create new one
      -- Since this runs in trigger context with elevated privileges, it bypasses RLS
      IF conv_id IS NULL THEN
        INSERT INTO public.support_conversations (user_id, status, priority, last_message_at)
        VALUES (target_user_id, 'open', 'normal', NEW.created_at)
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

-- Simplify RLS policies to be more permissive for conversation creation
DROP POLICY IF EXISTS "Allow all conversation creation" ON public.support_conversations;
DROP POLICY IF EXISTS "Allow conversation viewing with session" ON public.support_conversations;
DROP POLICY IF EXISTS "Allow conversation updates with session" ON public.support_conversations;

-- Create a simple, permissive INSERT policy
CREATE POLICY "Allow conversation creation" 
    ON public.support_conversations 
    FOR INSERT 
    WITH CHECK (true);

-- Create a SELECT policy that allows users to see their own conversations or support agents to see all
CREATE POLICY "Allow conversation viewing" 
    ON public.support_conversations 
    FOR SELECT 
    USING (
        -- Allow if user_id matches current session user
        user_id = (
            SELECT us.user_id 
            FROM public.user_sessions us 
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true 
            AND us.last_activity > NOW() - INTERVAL '24 hours'
            LIMIT 1
        )
        OR
        -- Allow if current session user is a support agent
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
CREATE POLICY "Allow conversation updates" 
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
