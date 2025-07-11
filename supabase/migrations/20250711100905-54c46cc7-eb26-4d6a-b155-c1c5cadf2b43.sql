-- Fix room creation and auto-approve all users

-- Update admin settings to disable manual approval
UPDATE public.admin_settings SET manual_approval_enabled = false WHERE id = 1;
INSERT INTO public.admin_settings (id, manual_approval_enabled) 
VALUES (1, false) 
ON CONFLICT (id) DO UPDATE SET manual_approval_enabled = false;

-- Auto-approve all existing unapproved users
UPDATE public.chat_users SET is_approved = true WHERE is_approved = false;

-- Fix chat_rooms table type constraint to allow more room types
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_type_check;

-- Add a more flexible type constraint
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_type_check 
CHECK (type IN ('general', 'support', 'announcement', 'discussion', 'private', 'boundless', 'academy', 'public'));