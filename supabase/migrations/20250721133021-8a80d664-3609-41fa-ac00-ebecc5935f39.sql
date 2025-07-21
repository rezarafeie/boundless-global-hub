-- Create chat_sections table for organizing topics
CREATE TABLE public.chat_sections (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📂',
  room_id INTEGER REFERENCES public.chat_rooms(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add order_index and section_id to chat_topics to support ordering and grouping
ALTER TABLE public.chat_topics ADD COLUMN order_index INTEGER DEFAULT 0;
ALTER TABLE public.chat_topics ADD COLUMN section_id INTEGER REFERENCES public.chat_sections(id);

-- Create index for better performance
CREATE INDEX idx_chat_sections_room_id_order ON public.chat_sections(room_id, order_index);
CREATE INDEX idx_chat_topics_section_id_order ON public.chat_topics(section_id, order_index);
CREATE INDEX idx_chat_topics_room_id_order ON public.chat_topics(room_id, order_index);

-- Enable RLS
ALTER TABLE public.chat_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_sections
CREATE POLICY "Anyone can view active chat sections"
ON public.chat_sections
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage chat sections"
ON public.chat_sections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users
    WHERE chat_users.id = ((auth.uid())::text)::integer
    AND chat_users.is_messenger_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_users
    WHERE chat_users.id = ((auth.uid())::text)::integer
    AND chat_users.is_messenger_admin = true
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_chat_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sections_updated_at
BEFORE UPDATE ON public.chat_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_sections_updated_at();