
-- Add support agent functionality to existing users
-- Update chat_users table to include support agent status (already exists)
-- Create a support_conversations table to track support chat threads
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES public.chat_users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_agent_id ON public.support_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON public.support_conversations(status);

-- Update messenger_messages to link with support conversations
ALTER TABLE public.messenger_messages 
ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES public.support_conversations(id) ON DELETE SET NULL;

-- Create index for conversation messages
CREATE INDEX IF NOT EXISTS idx_messenger_messages_conversation_id ON public.messenger_messages(conversation_id);

-- Enable RLS on support_conversations
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_conversations
-- Allow users to create their own support conversations
CREATE POLICY "Users can create support conversations" 
  ON public.support_conversations 
  FOR INSERT
  WITH CHECK (true); -- Allow anyone to create a support conversation

-- Allow users to view conversations they're involved in (as user or agent)
CREATE POLICY "Users can view their support conversations" 
  ON public.support_conversations 
  FOR SELECT 
  USING (
    user_id IN (SELECT id FROM public.chat_users WHERE id = get_user_from_session(current_setting('app.session_token', true)))
    OR agent_id IN (SELECT id FROM public.chat_users WHERE id = get_user_from_session(current_setting('app.session_token', true)))
    OR EXISTS (SELECT 1 FROM public.chat_users WHERE id = get_user_from_session(current_setting('app.session_token', true)) AND is_support_agent = true)
  );

-- Allow support agents to update conversations
CREATE POLICY "Support agents can update conversations" 
  ON public.support_conversations 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.chat_users WHERE id = get_user_from_session(current_setting('app.session_token', true)) AND is_support_agent = true)
  );

-- Create function to auto-create support conversation when user messages support
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id INTEGER;
BEGIN
  -- If this is a message to support (recipient_id = 1 and no room_id)
  IF NEW.recipient_id = 1 AND NEW.room_id IS NULL THEN
    -- Check if conversation already exists
    IF NEW.conversation_id IS NULL THEN
      -- Get existing conversation or create new one
      SELECT id INTO conv_id 
      FROM public.support_conversations 
      WHERE user_id = NEW.sender_id AND status IN ('open', 'assigned')
      ORDER BY created_at DESC 
      LIMIT 1;
      
      -- If no existing conversation, create new one
      IF conv_id IS NULL THEN
        INSERT INTO public.support_conversations (user_id, last_message_at)
        VALUES (NEW.sender_id, NEW.created_at)
        RETURNING id INTO conv_id;
      END IF;
      
      NEW.conversation_id := conv_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for support messages
DROP TRIGGER IF EXISTS trigger_handle_support_message ON public.messenger_messages;
CREATE TRIGGER trigger_handle_support_message
  BEFORE INSERT ON public.messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_support_message();
