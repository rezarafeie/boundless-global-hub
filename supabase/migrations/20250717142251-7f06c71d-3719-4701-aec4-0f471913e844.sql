-- Create function to send webhooks for messages
CREATE OR REPLACE FUNCTION public.send_message_webhook()
RETURNS TRIGGER AS $$
DECLARE
  sender_info RECORD;
  topic_name TEXT;
  room_name TEXT;
  webhook_payload JSON;
  message_type TEXT;
  chat_type TEXT;
BEGIN
  -- Get sender information
  SELECT name, phone, email INTO sender_info
  FROM public.chat_users 
  WHERE id = NEW.sender_id;
  
  -- Determine message type
  IF NEW.media_url IS NOT NULL THEN
    message_type := 'media';
  ELSE
    message_type := 'text';
  END IF;
  
  -- Handle different message contexts
  IF NEW.room_id IS NOT NULL THEN
    -- Group message
    chat_type := 'group';
    
    -- Get room name
    SELECT name INTO room_name
    FROM public.chat_rooms
    WHERE id = NEW.room_id;
    
    -- Get topic name if topic_id exists
    IF NEW.topic_id IS NOT NULL THEN
      SELECT title INTO topic_name
      FROM public.chat_topics
      WHERE id = NEW.topic_id;
    END IF;
    
  ELSIF NEW.conversation_id IS NOT NULL THEN
    -- Support conversation
    chat_type := 'support';
    room_name := 'Support';
    
  ELSIF NEW.recipient_id IS NOT NULL THEN
    -- Private message
    chat_type := 'private';
    
    -- Get recipient name as room name
    SELECT name INTO room_name
    FROM public.chat_users
    WHERE id = NEW.recipient_id;
    
  ELSE
    -- Unknown message type, skip webhook
    RETURN NEW;
  END IF;
  
  -- Build webhook payload
  webhook_payload := json_build_object(
    'message_content', NEW.message,
    'sender_name', COALESCE(sender_info.name, 'Unknown'),
    'sender_phone', COALESCE(sender_info.phone, ''),
    'sender_email', COALESCE(sender_info.email, ''),
    'chat_type', chat_type,
    'chat_name', COALESCE(room_name, ''),
    'topic_name', COALESCE(topic_name, ''),
    'timestamp', NEW.created_at,
    'triggered_from', 'database_trigger',
    'media_url', COALESCE(NEW.media_url, ''),
    'media_type', COALESCE(NEW.message_type, ''),
    'message_type', message_type
  );
  
  -- Send webhook using form data format
  PERFORM net.http_post(
    url := 'https://hook.us1.make.com/0hc8v2f528r9ieyefwhu8g9ta8l4r1bk',
    headers := '{"Content-Type": "application/x-www-form-urlencoded"}'::jsonb,
    body := concat(
      'message_content=', url_encode(NEW.message),
      '&sender_name=', url_encode(COALESCE(sender_info.name, 'Unknown')),
      '&sender_phone=', url_encode(COALESCE(sender_info.phone, '')),
      '&sender_email=', url_encode(COALESCE(sender_info.email, '')),
      '&chat_type=', url_encode(chat_type),
      '&chat_name=', url_encode(COALESCE(room_name, '')),
      '&topic_name=', url_encode(COALESCE(topic_name, '')),
      '&timestamp=', url_encode(NEW.created_at::text),
      '&triggered_from=database_trigger',
      '&media_url=', url_encode(COALESCE(NEW.media_url, '')),
      '&media_type=', url_encode(COALESCE(NEW.message_type, '')),
      '&message_type=', url_encode(message_type)
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the message insertion
    RAISE WARNING 'Webhook sending failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create URL encode helper function
CREATE OR REPLACE FUNCTION public.url_encode(input text)
RETURNS text AS $$
BEGIN
  RETURN replace(replace(replace(replace(replace(
    input, 
    ' ', '%20'),
    '&', '%26'),
    '=', '%3D'),
    '+', '%2B'),
    '#', '%23');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create triggers for webhook sending
DROP TRIGGER IF EXISTS send_webhook_on_messenger_message ON public.messenger_messages;
CREATE TRIGGER send_webhook_on_messenger_message
  AFTER INSERT ON public.messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_message_webhook();

DROP TRIGGER IF EXISTS send_webhook_on_private_message ON public.private_messages;
CREATE TRIGGER send_webhook_on_private_message
  AFTER INSERT ON public.private_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_message_webhook();