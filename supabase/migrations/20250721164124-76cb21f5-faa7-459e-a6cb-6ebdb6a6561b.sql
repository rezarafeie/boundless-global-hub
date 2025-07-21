-- Create trigger to send message webhooks
CREATE OR REPLACE FUNCTION public.send_message_webhook_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send webhook via edge function for message events
  PERFORM net.http_post(
    url := 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-message-webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2OTQ1MiwiZXhwIjoyMDY1OTQ1NDUyfQ.CXQ_n5_m7jMZ8wfQZsrLs3K44k6B7_QpvjZUfDKoT_c"}'::jsonb,
    body := json_build_object(
      'messageData', json_build_object(
        'id', NEW.id,
        'sender_id', NEW.sender_id,
        'message', NEW.message,
        'room_id', NEW.room_id,
        'recipient_id', NEW.recipient_id,
        'conversation_id', NEW.conversation_id,
        'topic_id', NEW.topic_id,
        'created_at', NEW.created_at,
        'media_url', NEW.media_url,
        'message_type', NEW.message_type
      )
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for messenger_messages
DROP TRIGGER IF EXISTS send_message_webhook_trigger ON public.messenger_messages;
CREATE TRIGGER send_message_webhook_trigger
  AFTER INSERT ON public.messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_message_webhook_trigger();

-- Create trigger for private_messages  
DROP TRIGGER IF EXISTS send_private_message_webhook_trigger ON public.private_messages;
CREATE TRIGGER send_private_message_webhook_trigger
  AFTER INSERT ON public.private_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_message_webhook_trigger();