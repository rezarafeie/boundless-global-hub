
-- Create messenger users table (extends chat_users with more fields)
ALTER TABLE public.chat_users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_support_agent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create chat rooms/groups table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public_group', 'boundless_group', 'support_chat', 'announcement_channel')),
  description TEXT,
  is_boundless_only BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for all chat types
CREATE TABLE IF NOT EXISTS public.messenger_messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES public.chat_users(id) ON DELETE SET NULL, -- for private chats
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'media', 'iframe', 'system')),
  media_url TEXT,
  media_content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user-room memberships table
CREATE TABLE IF NOT EXISTS public.room_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Insert default chat rooms
INSERT INTO public.chat_rooms (name, type, description, is_boundless_only) VALUES
  ('بحث عمومی', 'public_group', 'گفتگوی عمومی برای همه کاربران', FALSE),
  ('گروه بدون مرز', 'boundless_group', 'گفتگوی اختصاصی دانش‌پذیران بدون مرز', TRUE),
  ('اطلاعیه‌های مدیریت', 'announcement_channel', 'کانال اطلاعیه‌های رسمی', FALSE)
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_rooms (all authenticated users can see public rooms)
CREATE POLICY "Users can view public rooms" ON public.chat_rooms
  FOR SELECT USING (
    is_active = TRUE AND (
      is_boundless_only = FALSE OR 
      EXISTS (
        SELECT 1 FROM public.chat_users 
        WHERE id = auth.uid()::text::integer 
        AND bedoun_marz_approved = TRUE
      )
    )
  );

-- RLS policies for messenger_messages
CREATE POLICY "Users can view messages in rooms they have access to" ON public.messenger_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id 
      AND (
        cr.is_boundless_only = FALSE OR 
        EXISTS (
          SELECT 1 FROM public.chat_users cu
          WHERE cu.phone = (SELECT phone FROM public.chat_users WHERE id = auth.uid()::text::integer)
          AND cu.bedoun_marz_approved = TRUE
        )
      )
    )
  );

CREATE POLICY "Users can insert messages in accessible rooms" ON public.messenger_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text::integer AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id 
      AND cr.is_active = TRUE
      AND (
        cr.is_boundless_only = FALSE OR 
        EXISTS (
          SELECT 1 FROM public.chat_users cu
          WHERE cu.id = sender_id
          AND cu.bedoun_marz_approved = TRUE
        )
      )
    )
  );

-- RLS policies for room_memberships
CREATE POLICY "Users can view their own memberships" ON public.room_memberships
  FOR SELECT USING (user_id = auth.uid()::text::integer);

CREATE POLICY "Users can insert their own memberships" ON public.room_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid()::text::integer);
