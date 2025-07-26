
-- Drop the existing constraint
ALTER TABLE public.messenger_messages 
DROP CONSTRAINT messenger_messages_message_type_check;

-- Add the updated constraint with audio/webm included
ALTER TABLE public.messenger_messages 
ADD CONSTRAINT messenger_messages_message_type_check 
CHECK (
  (message_type IS NULL) OR 
  (message_type = ANY (ARRAY[
    'text'::text, 
    'media'::text, 
    'image'::text, 
    'video'::text, 
    'audio'::text, 
    'document'::text, 
    'voice'::text, 
    'image/jpeg'::text, 
    'image/png'::text, 
    'image/gif'::text, 
    'image/webp'::text, 
    'video/mp4'::text, 
    'video/webm'::text, 
    'audio/mpeg'::text, 
    'audio/wav'::text, 
    'audio/ogg'::text,
    'audio/webm'::text,
    'application/pdf'::text, 
    'text/plain'::text, 
    'application/msword'::text, 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'::text
  ]))
);
