
-- Create sequence for chat_topics first
CREATE SEQUENCE IF NOT EXISTS public.chat_topics_id_seq;

-- Create chat topics table
CREATE TABLE public.chat_topics (
  id integer NOT NULL DEFAULT nextval('chat_topics_id_seq'::regclass) PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add topic_id to chat_messages table
ALTER TABLE public.chat_messages 
ADD COLUMN topic_id integer REFERENCES public.chat_topics(id) ON DELETE CASCADE;

-- Enable RLS for chat_topics
ALTER TABLE public.chat_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_topics
CREATE POLICY "Anyone can view active topics" ON public.chat_topics
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage topics" ON public.chat_topics
  FOR ALL USING (true);

-- Enable realtime for chat_topics
ALTER TABLE public.chat_topics REPLICA IDENTITY FULL;

-- Insert default topic
INSERT INTO public.chat_topics (title, description, is_active) 
VALUES ('گفتگوی عمومی', 'گفتگوی عمومی اعضای بدون مرز', true)
ON CONFLICT DO NOTHING;

-- Update existing messages to use default topic
UPDATE public.chat_messages 
SET topic_id = (SELECT id FROM public.chat_topics WHERE title = 'گفتگوی عمومی' LIMIT 1)
WHERE topic_id IS NULL;
