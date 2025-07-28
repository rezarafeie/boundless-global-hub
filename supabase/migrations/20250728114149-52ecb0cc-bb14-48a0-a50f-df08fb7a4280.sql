-- Add reply support to messenger_messages table
ALTER TABLE public.messenger_messages 
ADD COLUMN reply_to_message_id integer REFERENCES public.messenger_messages(id);

-- Add reply support to private_messages table  
ALTER TABLE public.private_messages 
ADD COLUMN reply_to_message_id integer REFERENCES public.private_messages(id);

-- Add reply support to chat_messages table
ALTER TABLE public.chat_messages 
ADD COLUMN reply_to_message_id integer REFERENCES public.chat_messages(id);