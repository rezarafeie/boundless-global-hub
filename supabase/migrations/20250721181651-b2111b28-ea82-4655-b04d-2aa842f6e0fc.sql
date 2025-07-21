-- Set REPLICA IDENTITY for better realtime updates
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;
ALTER TABLE public.private_conversations REPLICA IDENTITY FULL;