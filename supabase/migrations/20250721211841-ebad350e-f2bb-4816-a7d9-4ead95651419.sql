-- Merge multiple support conversations into one unified support conversation

-- First, create or update a unified support conversation
INSERT INTO public.support_conversations (id, user_id, status, priority, last_message_at, thread_type_id)
VALUES (1, 1, 'open', 'normal', now(), 1)
ON CONFLICT (id) DO UPDATE SET
  status = 'open',
  priority = 'normal',
  last_message_at = now(),
  thread_type_id = 1;

-- Update all messenger_messages that reference the old support conversations
-- to point to the unified conversation (id = 1)
UPDATE public.messenger_messages 
SET conversation_id = 1
WHERE conversation_id IN (
  SELECT id FROM public.support_conversations 
  WHERE user_id IN (9000000001, 9000000002, 1, 2) 
  OR id IN (9000000001, 9000000002, 2)
) AND conversation_id IS NOT NULL;

-- Also update any messages that were sent to/from the system or these users
UPDATE public.messenger_messages 
SET conversation_id = 1
WHERE (sender_id IN (9000000001, 9000000002, 1, 2) AND recipient_id = 1)
   OR (sender_id = 1 AND recipient_id IN (9000000001, 9000000002, 1, 2));

-- Remove the old support conversations (keep only the unified one with id = 1)
DELETE FROM public.support_conversations 
WHERE id != 1 AND (
  user_id IN (9000000001, 9000000002, 1, 2) 
  OR id IN (9000000001, 9000000002, 2)
);

-- Update the last_message_at timestamp for the unified conversation
-- based on the most recent message
UPDATE public.support_conversations 
SET last_message_at = (
  SELECT MAX(created_at) 
  FROM public.messenger_messages 
  WHERE conversation_id = 1
)
WHERE id = 1;