-- Add super group functionality to chat_rooms
ALTER TABLE public.chat_rooms ADD COLUMN is_super_group boolean DEFAULT false;

-- Update chat_topics to link to specific super groups
ALTER TABLE public.chat_topics ADD COLUMN room_id integer REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
ALTER TABLE public.chat_topics ADD CONSTRAINT topics_room_check CHECK (
  (room_id IS NULL AND is_active = true) OR 
  (room_id IS NOT NULL)
);

-- Add pinned messages functionality
CREATE TABLE public.pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id integer NOT NULL REFERENCES public.messenger_messages(id) ON DELETE CASCADE,
  room_id integer REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  topic_id integer REFERENCES public.chat_topics(id) ON DELETE CASCADE,
  pinned_by integer NOT NULL REFERENCES public.chat_users(id),
  pinned_at timestamp with time zone DEFAULT now(),
  summary text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pinned_messages_room_or_topic_check CHECK (
    (room_id IS NOT NULL AND topic_id IS NULL) OR 
    (room_id IS NULL AND topic_id IS NOT NULL)
  )
);

-- Enable RLS on pinned_messages
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for pinned_messages
CREATE POLICY "Users can view pinned messages in accessible rooms/topics"
ON public.pinned_messages
FOR SELECT
USING (
  (room_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chat_rooms cr 
    WHERE cr.id = pinned_messages.room_id 
    AND cr.is_active = true
  )) OR
  (topic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chat_topics ct 
    JOIN public.chat_rooms cr ON ct.room_id = cr.id
    WHERE ct.id = pinned_messages.topic_id 
    AND ct.is_active = true 
    AND cr.is_active = true
  ))
);

CREATE POLICY "Admins can manage pinned messages"
ON public.pinned_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users cu
    JOIN public.user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_messenger_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_users cu
    JOIN public.user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND cu.is_messenger_admin = true
  )
);

-- Create index for better performance
CREATE INDEX idx_pinned_messages_room_id ON public.pinned_messages(room_id);
CREATE INDEX idx_pinned_messages_topic_id ON public.pinned_messages(topic_id);
CREATE INDEX idx_chat_topics_room_id ON public.chat_topics(room_id);