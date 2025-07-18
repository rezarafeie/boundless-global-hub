-- Fix the message_type check constraint to allow proper media types
ALTER TABLE messenger_messages DROP CONSTRAINT IF EXISTS messenger_messages_message_type_check;

-- Add a more flexible constraint that allows the actual media types being sent
ALTER TABLE messenger_messages ADD CONSTRAINT messenger_messages_message_type_check 
CHECK (message_type IS NULL OR message_type IN ('text', 'media', 'image', 'video', 'audio', 'document', 'voice', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));