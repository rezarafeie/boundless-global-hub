-- Enable realtime for private conversations only (messenger_messages already enabled)
ALTER TABLE public.private_conversations REPLICA IDENTITY FULL;

-- Add private_conversations to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_conversations;