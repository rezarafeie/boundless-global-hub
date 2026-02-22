-- Move enrollments to user 36592
UPDATE enrollments SET chat_user_id = 36592 WHERE chat_user_id = 15983;

-- Remove any other references
UPDATE crm_notes SET user_id = 36592 WHERE user_id = 15983;
UPDATE crm_followups SET user_id = 36592 WHERE user_id = 15983;
UPDATE daily_reports SET user_id = 36592 WHERE user_id = 15983;
UPDATE consultation_bookings SET user_id = 36592 WHERE user_id = 15983;
UPDATE chat_messages SET user_id = 36592 WHERE user_id = 15983;

-- Delete the duplicate user
DELETE FROM chat_users WHERE id = 15983;