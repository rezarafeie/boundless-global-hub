
-- Add new support thread types and message features
-- First, let's add the boundless status fields if they don't exist
ALTER TABLE public.chat_users 
ADD COLUMN IF NOT EXISTS bedoun_marz BOOLEAN DEFAULT false;

-- Create support thread types
CREATE TABLE IF NOT EXISTS public.support_thread_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_boundless_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the two support thread types
INSERT INTO public.support_thread_types (id, name, display_name, description, is_boundless_only) 
VALUES 
  (1, 'academy_support', '🎓 پشتیبانی آکادمی رفیعی', 'پشتیبانی عمومی آکادمی رفیعی', false),
  (2, 'boundless_support', '🟦 پشتیبانی بدون مرز', 'پشتیبانی ویژه اعضای بدون مرز', true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_boundless_only = EXCLUDED.is_boundless_only;

-- Add support thread type to conversations
ALTER TABLE public.support_conversations 
ADD COLUMN IF NOT EXISTS thread_type_id INTEGER DEFAULT 1 REFERENCES public.support_thread_types(id);

-- Add message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id INTEGER NOT NULL REFERENCES public.messenger_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('❤️', '😂', '👍', '👎', '😮', '😢')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

-- Enable RLS on reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policy for reactions - users can see all reactions and add their own
CREATE POLICY "Users can view all reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (
  user_id = (
    SELECT us.user_id 
    FROM public.user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true 
    LIMIT 1
  )
);
CREATE POLICY "Users can remove their reactions" ON public.message_reactions FOR DELETE USING (
  user_id = (
    SELECT us.user_id 
    FROM public.user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true 
    LIMIT 1
  )
);

-- Add reply functionality to messages
ALTER TABLE public.messenger_messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id INTEGER REFERENCES public.messenger_messages(id);

-- Add forwarded functionality
ALTER TABLE public.messenger_messages 
ADD COLUMN IF NOT EXISTS forwarded_from_message_id INTEGER REFERENCES public.messenger_messages(id);

-- Update the trigger to handle different support thread types
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id INTEGER;
  target_user_id INTEGER;
  thread_type_id INTEGER DEFAULT 1; -- Default to academy support
BEGIN
  -- If this is a message to support (recipient_id = 1 and no room_id)
  IF NEW.recipient_id = 1 AND NEW.room_id IS NULL THEN
    target_user_id := NEW.sender_id;
    
    -- Determine thread type based on user's boundless status
    SELECT CASE 
      WHEN cu.bedoun_marz = true AND NEW.conversation_id IS NULL THEN 2 -- Boundless support
      ELSE 1 -- Academy support
    END INTO thread_type_id
    FROM public.chat_users cu 
    WHERE cu.id = target_user_id;
    
    -- Check if conversation already exists for this user and thread type
    IF NEW.conversation_id IS NULL THEN
      SELECT id INTO conv_id 
      FROM public.support_conversations 
      WHERE user_id = target_user_id 
        AND thread_type_id = thread_type_id
        AND status IN ('open', 'assigned')
      ORDER BY created_at DESC 
      LIMIT 1;
      
      IF conv_id IS NULL THEN
        INSERT INTO public.support_conversations (user_id, status, priority, last_message_at, thread_type_id)
        VALUES (target_user_id, 'open', 'normal', NEW.created_at, thread_type_id)
        RETURNING id INTO conv_id;
      END IF;
      
      NEW.conversation_id := conv_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get user avatar color
CREATE OR REPLACE FUNCTION public.get_user_avatar_color(user_name TEXT)
RETURNS TEXT AS $$
DECLARE
  colors TEXT[] := ARRAY['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
  hash_value INTEGER;
BEGIN
  -- Simple hash function based on first character
  hash_value := ascii(left(user_name, 1)) % array_length(colors, 1) + 1;
  RETURN colors[hash_value];
END;
$$ LANGUAGE plpgsql IMMUTABLE;
