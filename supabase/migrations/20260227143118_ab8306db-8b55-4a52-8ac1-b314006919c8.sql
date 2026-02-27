
-- Create webinar_messages table for live chat
CREATE TABLE public.webinar_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.webinar_participants(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  message text NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add chat settings to webinar_entries
ALTER TABLE public.webinar_entries 
  ADD COLUMN IF NOT EXISTS chat_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS chat_mode text NOT NULL DEFAULT 'public';

-- Enable RLS
ALTER TABLE public.webinar_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read messages
CREATE POLICY "Anyone can read messages"
  ON public.webinar_messages FOR SELECT
  USING (true);

-- Participants can insert messages
CREATE POLICY "Anyone can send messages"
  ON public.webinar_messages FOR INSERT
  WITH CHECK (true);

-- Allow delete
CREATE POLICY "Anyone can delete messages"
  ON public.webinar_messages FOR DELETE
  USING (true);

-- Indexes
CREATE INDEX idx_webinar_messages_webinar_id ON public.webinar_messages(webinar_id);
CREATE INDEX idx_webinar_messages_created_at ON public.webinar_messages(created_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_messages;
