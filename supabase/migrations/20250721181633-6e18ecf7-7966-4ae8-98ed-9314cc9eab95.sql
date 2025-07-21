-- Enable RLS on private_conversations and private_messages tables
ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for private_conversations
CREATE POLICY "Users can view their own conversations"
ON public.private_conversations
FOR SELECT
USING (user1_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
) OR user2_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
));

CREATE POLICY "Users can create conversations they participate in"
ON public.private_conversations
FOR INSERT
WITH CHECK (user1_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
) OR user2_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
));

CREATE POLICY "Users can update their own conversations"
ON public.private_conversations
FOR UPDATE
USING (user1_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
) OR user2_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
));

-- Create RLS policies for private_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.private_messages
FOR SELECT
USING (conversation_id IN (
  SELECT pc.id FROM private_conversations pc
  WHERE pc.user1_id IN (
    SELECT us.user_id FROM user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true
  ) OR pc.user2_id IN (
    SELECT us.user_id FROM user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true
  )
));

CREATE POLICY "Users can send messages in their conversations"
ON public.private_messages
FOR INSERT
WITH CHECK (sender_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
) AND conversation_id IN (
  SELECT pc.id FROM private_conversations pc
  WHERE pc.user1_id IN (
    SELECT us.user_id FROM user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true
  ) OR pc.user2_id IN (
    SELECT us.user_id FROM user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true
  )
));

CREATE POLICY "Users can update their own messages"
ON public.private_messages
FOR UPDATE
USING (sender_id IN (
  SELECT us.user_id FROM user_sessions us 
  WHERE us.session_token = current_setting('app.session_token', true) 
  AND us.is_active = true
));

-- Enable realtime for private messages
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;