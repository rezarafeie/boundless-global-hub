-- Fix webhook function to properly handle media URLs and message types
CREATE OR REPLACE FUNCTION public.send_message_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sender_info RECORD;
  topic_name TEXT;
  room_name TEXT;
  webhook_payload JSON;
  message_type TEXT;
  chat_type TEXT;
  message_room_id INTEGER;
  message_recipient_id INTEGER;
  message_conversation_id INTEGER;
  message_topic_id INTEGER;
  http_response RECORD;
BEGIN
  -- Get sender information
  SELECT name, phone, email INTO sender_info
  FROM public.chat_users 
  WHERE id = NEW.sender_id;
  
  -- Determine message type based on media_url presence
  IF NEW.media_url IS NOT NULL THEN
    message_type := 'media';
  ELSE
    message_type := 'text';
  END IF;
  
  -- Handle different table structures
  IF TG_TABLE_NAME = 'messenger_messages' THEN
    -- For messenger_messages table - these columns exist
    message_room_id := NEW.room_id;
    message_recipient_id := NEW.recipient_id;
    message_conversation_id := NEW.conversation_id;
    message_topic_id := NEW.topic_id;
  ELSE
    -- For private_messages table - only conversation_id exists
    message_room_id := NULL;
    message_recipient_id := NULL;
    message_conversation_id := NEW.conversation_id;
    message_topic_id := NULL;
  END IF;
  
  -- Handle different message contexts
  IF message_room_id IS NOT NULL THEN
    -- Group message
    chat_type := 'group';
    
    -- Get room name
    SELECT name INTO room_name
    FROM public.chat_rooms
    WHERE id = message_room_id;
    
    -- Get topic name if topic_id exists
    IF message_topic_id IS NOT NULL THEN
      SELECT title INTO topic_name
      FROM public.chat_topics
      WHERE id = message_topic_id;
    END IF;
    
  ELSIF message_recipient_id IS NOT NULL THEN
    -- Direct private message (messenger_messages with recipient_id)
    chat_type := 'private';
    
    -- Get recipient name as room name
    SELECT name INTO room_name
    FROM public.chat_users
    WHERE id = message_recipient_id;
    
  ELSIF message_conversation_id IS NOT NULL THEN
    -- Private conversation or support conversation
    IF TG_TABLE_NAME = 'private_messages' THEN
      -- Private conversation - get the other participant
      chat_type := 'private';
      
      -- Get the other participant's name from the conversation
      SELECT cu.name INTO room_name
      FROM public.private_conversations pc
      JOIN public.chat_users cu ON (
        CASE 
          WHEN pc.user1_id = NEW.sender_id THEN cu.id = pc.user2_id
          ELSE cu.id = pc.user1_id
        END
      )
      WHERE pc.id = message_conversation_id;
      
    ELSE
      -- Support conversation
      chat_type := 'support';
      room_name := 'Support';
    END IF;
    
  ELSE
    -- Unknown message type, skip webhook
    RETURN NEW;
  END IF;
  
  -- Send webhook using form data format with http extension
  SELECT * INTO http_response FROM http_post(
    'https://hook.us1.make.com/0hc8v2f528r9ieyefwhu8g9ta8l4r1bk',
    concat(
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
    ),
    'application/x-www-form-urlencoded'
  );
  
  -- Log the response for debugging
  RAISE NOTICE 'Webhook response status: %, content: %', http_response.status, LEFT(http_response.content, 100);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the message insertion
    RAISE WARNING 'Webhook sending failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;