-- Update the handle_support_message function to handle tables without room_id
CREATE OR REPLACE FUNCTION public.handle_support_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id INTEGER;
  user_id_from_session INTEGER;
  user_thread_type_id INTEGER DEFAULT 1;
  has_room_id BOOLEAN;
  has_recipient_id BOOLEAN;
BEGIN
  -- Check if the table has room_id and recipient_id columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = TG_TABLE_NAME 
    AND column_name = 'room_id'
  ) INTO has_room_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = TG_TABLE_NAME 
    AND column_name = 'recipient_id'
  ) INTO has_recipient_id;
  
  -- Only handle support messages for tables that have recipient_id
  IF has_recipient_id THEN
    -- If this is a message to support (recipient_id = 1 and no room_id if it exists)
    IF (NOT has_room_id OR (SELECT to_jsonb(NEW.*) ->> 'room_id' IS NULL)) 
       AND (SELECT (to_jsonb(NEW.*) ->> 'recipient_id')::integer = 1) THEN
      -- Set session context first
      IF current_setting('app.session_token', true) IS NOT NULL THEN
        PERFORM public.set_session_context(current_setting('app.session_token', true));
      END IF;
      
      -- Get user ID from current session or use sender_id as fallback
      SELECT us.user_id INTO user_id_from_session
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true)
      AND us.is_active = true 
      AND us.last_activity > NOW() - INTERVAL '24 hours'
      LIMIT 1;
      
      IF user_id_from_session IS NULL THEN
        user_id_from_session := (SELECT (to_jsonb(NEW.*) ->> 'sender_id')::integer);
      END IF;
      
      -- Determine thread type based on user's boundless status
      SELECT CASE 
        WHEN cu.bedoun_marz = true THEN 2 -- Boundless support
        ELSE 1 -- Academy support
      END INTO user_thread_type_id
      FROM public.chat_users cu 
      WHERE cu.id = user_id_from_session;
      
      -- If no conversation_id provided, get or create one
      IF (SELECT to_jsonb(NEW.*) ->> 'conversation_id' IS NULL) THEN
        -- Try to find existing open conversation
        SELECT sc.id INTO conv_id 
        FROM public.support_conversations sc
        WHERE sc.user_id = user_id_from_session 
          AND sc.thread_type_id = user_thread_type_id
          AND sc.status IN ('open', 'assigned')
        ORDER BY sc.created_at DESC 
        LIMIT 1;
        
        -- If no existing conversation, create new one
        IF conv_id IS NULL THEN
          INSERT INTO public.support_conversations (user_id, status, priority, last_message_at, thread_type_id)
          VALUES (user_id_from_session, 'open', 'normal', (SELECT (to_jsonb(NEW.*) ->> 'created_at')::timestamp with time zone), user_thread_type_id)
          RETURNING id INTO conv_id;
        END IF;
        
        -- Update NEW record if possible
        IF TG_TABLE_NAME = 'messenger_messages' THEN
          NEW.conversation_id := conv_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the send_message_webhook_trigger function to handle tables without room_id
CREATE OR REPLACE FUNCTION public.send_message_webhook_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_data JSONB;
BEGIN
  -- Build message data based on available columns
  message_data := jsonb_build_object(
    'id', (to_jsonb(NEW.*) ->> 'id')::integer,
    'sender_id', (to_jsonb(NEW.*) ->> 'sender_id')::integer,
    'message', to_jsonb(NEW.*) ->> 'message',
    'created_at', to_jsonb(NEW.*) ->> 'created_at'
  );
  
  -- Add optional fields if they exist
  IF to_jsonb(NEW.*) ? 'room_id' THEN
    message_data := message_data || jsonb_build_object('room_id', (to_jsonb(NEW.*) ->> 'room_id')::integer);
  END IF;
  
  IF to_jsonb(NEW.*) ? 'recipient_id' THEN
    message_data := message_data || jsonb_build_object('recipient_id', (to_jsonb(NEW.*) ->> 'recipient_id')::integer);
  END IF;
  
  IF to_jsonb(NEW.*) ? 'conversation_id' THEN
    message_data := message_data || jsonb_build_object('conversation_id', (to_jsonb(NEW.*) ->> 'conversation_id')::integer);
  END IF;
  
  IF to_jsonb(NEW.*) ? 'topic_id' THEN
    message_data := message_data || jsonb_build_object('topic_id', (to_jsonb(NEW.*) ->> 'topic_id')::integer);
  END IF;
  
  IF to_jsonb(NEW.*) ? 'media_url' THEN
    message_data := message_data || jsonb_build_object('media_url', to_jsonb(NEW.*) ->> 'media_url');
  END IF;
  
  IF to_jsonb(NEW.*) ? 'message_type' THEN
    message_data := message_data || jsonb_build_object('message_type', to_jsonb(NEW.*) ->> 'message_type');
  END IF;
  
  -- Send webhook via edge function for message events
  PERFORM net.http_post(
    url := 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-message-webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2OTQ1MiwiZXhwIjoyMDY1OTQ1NDUyfQ.CXQ_n5_m7jMZ8wfQZsrLs3K44k6B7_QpvjZUfDKoT_c"}'::jsonb,
    body := jsonb_build_object('messageData', message_data)
  );
  
  RETURN NEW;
END;
$$;