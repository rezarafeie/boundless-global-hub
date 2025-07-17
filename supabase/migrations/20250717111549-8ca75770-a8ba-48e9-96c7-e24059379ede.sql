-- Add missing topic_id column to messenger_messages table
ALTER TABLE public.messenger_messages ADD COLUMN IF NOT EXISTS topic_id INTEGER;

-- Add foreign key constraint to chat_topics
ALTER TABLE public.messenger_messages ADD CONSTRAINT fk_messenger_messages_topic_id 
FOREIGN KEY (topic_id) REFERENCES public.chat_topics(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messenger_messages_topic_id ON public.messenger_messages(topic_id);

-- Add check constraint to ensure either room_id or conversation_id is set
ALTER TABLE public.messenger_messages ADD CONSTRAINT messenger_messages_routing_check 
CHECK (
  (room_id IS NOT NULL) OR 
  (conversation_id IS NOT NULL) OR 
  (recipient_id IS NOT NULL)
);