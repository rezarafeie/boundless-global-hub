
-- Add unread message tracking and tagging system
ALTER TABLE support_conversations 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_agent_name TEXT;

-- Add unread message counts to messenger_messages
ALTER TABLE messenger_messages 
ADD COLUMN IF NOT EXISTS unread_by_support BOOLEAN DEFAULT true;

-- Create support conversation tags enum for better data consistency
CREATE TYPE support_tag AS ENUM (
  'technical', 'billing', 'general', 'account', 'bug_report', 
  'feature_request', 'urgent', 'follow_up'
);

-- Add a proper tags column with enum array
ALTER TABLE support_conversations 
ADD COLUMN IF NOT EXISTS tag_list support_tag[] DEFAULT '{}';

-- Create index for better performance on conversation queries
CREATE INDEX IF NOT EXISTS idx_support_conversations_status_priority 
ON support_conversations(status, priority, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messenger_messages_conversation_unread 
ON messenger_messages(conversation_id, unread_by_support) 
WHERE conversation_id IS NOT NULL;

-- Function to get unread message count for support conversations
CREATE OR REPLACE FUNCTION get_support_unread_count(conv_id INTEGER)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM messenger_messages
  WHERE conversation_id = conv_id 
    AND unread_by_support = true 
    AND sender_id != 1; -- Exclude messages from support agent
$$;

-- Update trigger to handle unread status
CREATE OR REPLACE FUNCTION handle_support_message_unread()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark message as unread by support if it's from a user to support
  IF NEW.recipient_id = 1 AND NEW.sender_id != 1 THEN
    NEW.unread_by_support = true;
  ELSE
    NEW.unread_by_support = false;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_message_unread_trigger ON messenger_messages;
CREATE TRIGGER support_message_unread_trigger
  BEFORE INSERT ON messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_support_message_unread();
