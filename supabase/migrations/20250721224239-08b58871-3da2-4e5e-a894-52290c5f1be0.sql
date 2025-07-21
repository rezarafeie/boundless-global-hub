-- Update support_conversations table to include missing status values
ALTER TABLE support_conversations 
DROP CONSTRAINT IF EXISTS support_conversations_status_check;

ALTER TABLE support_conversations 
ADD CONSTRAINT support_conversations_status_check 
CHECK (status IN ('open', 'assigned', 'resolved', 'closed'));