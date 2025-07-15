-- Create database triggers for automatic push notifications

-- Function to send push notifications when new messages are inserted
CREATE OR REPLACE FUNCTION notify_message_recipients()
RETURNS TRIGGER AS $$
DECLARE
  recipient_users INTEGER[];
  room_name TEXT;
  sender_name TEXT;
BEGIN
  -- Skip if this is a system message or no recipients
  IF NEW.sender_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name
  SELECT name INTO sender_name FROM chat_users WHERE id = NEW.sender_id;
  
  -- Determine recipients based on message type
  IF NEW.room_id IS NOT NULL THEN
    -- Room message - notify all room members except sender
    SELECT array_agg(DISTINCT cu.id) INTO recipient_users
    FROM chat_users cu
    JOIN room_memberships rm ON cu.id = rm.user_id
    WHERE rm.room_id = NEW.room_id 
      AND cu.id != NEW.sender_id
      AND cu.notification_enabled = true
      AND cu.notification_token IS NOT NULL;
      
    -- Get room name
    SELECT name INTO room_name FROM chat_rooms WHERE id = NEW.room_id;
    
  ELSIF NEW.recipient_id IS NOT NULL THEN
    -- Private message - notify specific recipient
    SELECT ARRAY[NEW.recipient_id] INTO recipient_users
    WHERE EXISTS (
      SELECT 1 FROM chat_users 
      WHERE id = NEW.recipient_id 
        AND notification_enabled = true 
        AND notification_token IS NOT NULL
    );
    
  ELSIF NEW.conversation_id IS NOT NULL THEN
    -- Support conversation - notify support agents or user
    IF NEW.sender_id = 1 THEN
      -- Message from support to user
      SELECT ARRAY[sc.user_id] INTO recipient_users
      FROM support_conversations sc
      JOIN chat_users cu ON sc.user_id = cu.id
      WHERE sc.id = NEW.conversation_id
        AND cu.notification_enabled = true
        AND cu.notification_token IS NOT NULL;
    ELSE
      -- Message from user to support - notify assigned agent or all support agents
      SELECT array_agg(DISTINCT cu.id) INTO recipient_users
      FROM support_conversations sc
      LEFT JOIN chat_users cu ON sc.agent_id = cu.id
      WHERE sc.id = NEW.conversation_id
        AND cu.notification_enabled = true
        AND cu.notification_token IS NOT NULL
        AND cu.is_support_agent = true;
        
      -- If no assigned agent, notify all active support agents
      IF recipient_users IS NULL OR array_length(recipient_users, 1) = 0 THEN
        SELECT array_agg(DISTINCT cu.id) INTO recipient_users
        FROM chat_users cu
        WHERE cu.is_support_agent = true
          AND cu.notification_enabled = true
          AND cu.notification_token IS NOT NULL;
      END IF;
    END IF;
  END IF;

  -- Send push notifications if we have recipients
  IF recipient_users IS NOT NULL AND array_length(recipient_users, 1) > 0 THEN
    -- Call edge function to send push notifications
    PERFORM net.http_post(
      url := 'https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2OTQ1MiwiZXhwIjoyMDY1OTQ1NDUyfQ.CXQ_n5_m7jMZ8wfQZsrLs3K44k6B7_QpvjZUfDKoT_c"}'::jsonb,
      body := json_build_object(
        'recipientUserIds', recipient_users,
        'message', json_build_object(
          'id', NEW.id,
          'text', NEW.message,
          'senderName', COALESCE(sender_name, 'کاربر'),
          'roomName', room_name,
          'senderId', NEW.sender_id,
          'roomId', NEW.room_id,
          'conversationId', NEW.conversation_id,
          'timestamp', NEW.created_at
        )
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for messenger_messages
DROP TRIGGER IF EXISTS trigger_notify_message_recipients ON messenger_messages;
CREATE TRIGGER trigger_notify_message_recipients
  AFTER INSERT ON messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_recipients();

-- Create trigger for private_messages  
DROP TRIGGER IF EXISTS trigger_notify_private_message_recipients ON private_messages;
CREATE TRIGGER trigger_notify_private_message_recipients
  AFTER INSERT ON private_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_recipients();

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(p_user_id INTEGER, p_is_online BOOLEAN DEFAULT true)
RETURNS void AS $$
BEGIN
  UPDATE chat_users 
  SET last_seen = CASE 
    WHEN p_is_online THEN now() 
    ELSE last_seen 
  END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;