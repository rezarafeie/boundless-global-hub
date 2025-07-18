-- Enable realtime for private conversations and messenger messages
ALTER TABLE public.private_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messenger_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messenger_messages;