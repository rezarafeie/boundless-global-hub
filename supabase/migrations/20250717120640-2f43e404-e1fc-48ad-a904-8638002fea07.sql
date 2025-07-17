-- Add icon column to chat_topics table for topic icons
ALTER TABLE public.chat_topics 
ADD COLUMN icon TEXT DEFAULT '🔹';

-- Add avatar_url column to chat_rooms table for group avatars
ALTER TABLE public.chat_rooms 
ADD COLUMN avatar_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_topics_icon ON public.chat_topics(icon);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_avatar ON public.chat_rooms(avatar_url);