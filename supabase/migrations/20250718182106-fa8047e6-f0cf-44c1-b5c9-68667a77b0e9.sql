-- Add webhook trigger for private_messages table to ensure webhooks are sent for audio messages
-- This ensures that all private messages (including voice messages) trigger webhooks properly

-- Add trigger for webhook on private messages
CREATE TRIGGER send_private_message_webhook
  AFTER INSERT ON public.private_messages
  FOR EACH ROW EXECUTE FUNCTION public.send_message_webhook();

-- Add trigger for notifications on private messages  
CREATE TRIGGER notify_private_message_recipients
  AFTER INSERT ON public.private_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message_recipients();