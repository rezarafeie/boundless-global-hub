
-- Create announcements table
CREATE TABLE public.announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('urgent', 'general', 'technical', 'educational')),
  summary TEXT NOT NULL,
  full_text TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'audio', 'video')),
  media_content TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id SERIAL PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'moderator', 'member')),
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live_settings table
CREATE TABLE public.live_settings (
  id SERIAL PRIMARY KEY,
  is_live BOOLEAN DEFAULT FALSE,
  stream_code TEXT,
  title TEXT,
  viewers INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to increment announcement views
CREATE OR REPLACE FUNCTION increment_views(announcement_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.announcements 
  SET views = views + 1 
  WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql;

-- Insert a default live_settings record
INSERT INTO public.live_settings (id, is_live, stream_code, title, viewers) 
VALUES (1, FALSE, NULL, NULL, 0);

-- Enable realtime for all tables
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.live_settings REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_settings;
