-- Remove specific users (9000000001, 9000000002, 1, 2) from messenger chat list

-- Delete private conversations involving these users
DELETE FROM public.private_conversations 
WHERE user1_id IN (9000000001, 9000000002, 1, 2) 
   OR user2_id IN (9000000001, 9000000002, 1, 2);

-- Delete private messages involving these users
DELETE FROM public.private_messages 
WHERE sender_id IN (9000000001, 9000000002, 1, 2) 
   OR conversation_id IN (
     SELECT id FROM public.private_conversations 
     WHERE user1_id IN (9000000001, 9000000002, 1, 2) 
        OR user2_id IN (9000000001, 9000000002, 1, 2)
   );

-- Delete any messenger messages that are private messages (not room/support) from these users
DELETE FROM public.messenger_messages 
WHERE sender_id IN (9000000001, 9000000002, 1, 2) 
  AND room_id IS NULL 
  AND conversation_id IS NULL 
  AND recipient_id IS NOT NULL;

-- Delete room memberships for these users
DELETE FROM public.room_memberships 
WHERE user_id IN (9000000001, 9000000002, 1, 2);