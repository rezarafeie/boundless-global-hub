-- Add foreign key constraints for reply functionality
ALTER TABLE public.messenger_messages 
ADD CONSTRAINT messenger_messages_reply_to_message_id_fkey 
FOREIGN KEY (reply_to_message_id) REFERENCES public.messenger_messages(id);

ALTER TABLE public.private_messages 
ADD CONSTRAINT private_messages_reply_to_message_id_fkey 
FOREIGN KEY (reply_to_message_id) REFERENCES public.private_messages(id);

ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_reply_to_message_id_fkey 
FOREIGN KEY (reply_to_message_id) REFERENCES public.chat_messages(id);