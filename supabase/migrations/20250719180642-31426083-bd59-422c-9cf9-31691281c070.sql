-- Create triggers to send push notifications when new messages are inserted

-- Trigger for private_messages table
CREATE TRIGGER private_messages_notify_trigger
  AFTER INSERT ON public.private_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_recipients();

-- Trigger for messenger_messages table  
CREATE TRIGGER messenger_messages_notify_trigger
  AFTER INSERT ON public.messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_recipients();