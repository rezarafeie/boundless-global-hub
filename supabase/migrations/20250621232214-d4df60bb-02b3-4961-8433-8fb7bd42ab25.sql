
-- Fix the ambiguous column reference and add missing relationships

-- First, fix the ambiguous column reference in the trigger function
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id INTEGER;
  target_user_id INTEGER;
  user_thread_type_id INTEGER DEFAULT 1; -- Renamed to avoid ambiguity
BEGIN
  -- If this is a message to support (recipient_id = 1 and no room_id)
  IF NEW.recipient_id = 1 AND NEW.room_id IS NULL THEN
    target_user_id := NEW.sender_id;
    
    -- Determine thread type based on user's boundless status
    SELECT CASE 
      WHEN cu.bedoun_marz = true AND NEW.conversation_id IS NULL THEN 2 -- Boundless support
      ELSE 1 -- Academy support
    END INTO user_thread_type_id
    FROM public.chat_users cu 
    WHERE cu.id = target_user_id;
    
    -- Check if conversation already exists for this user and thread type
    IF NEW.conversation_id IS NULL THEN
      SELECT sc.id INTO conv_id 
      FROM public.support_conversations sc
      WHERE sc.user_id = target_user_id 
        AND sc.thread_type_id = user_thread_type_id
        AND sc.status IN ('open', 'assigned')
      ORDER BY sc.created_at DESC 
      LIMIT 1;
      
      IF conv_id IS NULL THEN
        INSERT INTO public.support_conversations (user_id, status, priority, last_message_at, thread_type_id)
        VALUES (target_user_id, 'open', 'normal', NEW.created_at, user_thread_type_id)
        RETURNING id INTO conv_id;
      END IF;
      
      NEW.conversation_id := conv_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add proper foreign key constraints to fix relationship issues
ALTER TABLE public.messenger_messages 
ADD CONSTRAINT fk_messenger_messages_sender 
FOREIGN KEY (sender_id) REFERENCES public.chat_users(id);

ALTER TABLE public.messenger_messages 
ADD CONSTRAINT fk_messenger_messages_recipient 
FOREIGN KEY (recipient_id) REFERENCES public.chat_users(id);

ALTER TABLE public.messenger_messages 
ADD CONSTRAINT fk_messenger_messages_room 
FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);

-- Add foreign key for conversation_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_messenger_messages_conversation'
  ) THEN
    ALTER TABLE public.messenger_messages 
    ADD CONSTRAINT fk_messenger_messages_conversation 
    FOREIGN KEY (conversation_id) REFERENCES public.support_conversations(id);
  END IF;
END $$;
