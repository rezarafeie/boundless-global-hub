-- Enable realtime for messenger tables
ALTER TABLE public.messenger_messages REPLICA IDENTITY FULL;
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
-- Note: These commands may fail if already added, which is fine
DO $$
BEGIN
  -- Add messenger_messages if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messenger_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messenger_messages;
  END IF;
  
  -- Add private_messages if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'private_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
  END IF;
END $$;