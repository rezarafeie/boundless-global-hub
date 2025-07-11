-- First drop the constraint entirely
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_type_check;

-- Update existing room types to valid values
UPDATE public.chat_rooms SET type = 'boundless' WHERE type = 'boundless_group';
UPDATE public.chat_rooms SET type = 'public' WHERE type = 'public_group';

-- Add constraint with the existing room types included
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_type_check 
CHECK (type IN ('general', 'support', 'announcement', 'discussion', 'private', 'boundless', 'academy', 'public'));

-- Auto-approve all users and disable manual approval
UPDATE public.admin_settings SET manual_approval_enabled = false WHERE id = 1;
INSERT INTO public.admin_settings (id, manual_approval_enabled) 
VALUES (1, false) 
ON CONFLICT (id) DO UPDATE SET manual_approval_enabled = false;

UPDATE public.chat_users SET is_approved = true WHERE is_approved = false OR is_approved IS NULL;