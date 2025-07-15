-- Remove leading 0 from Iranian phone numbers in chat_users table
-- This updates phone numbers that start with 09 followed by 9 digits (Iranian mobile format)
-- Changes format from 09xxxxxxxxx to 9xxxxxxxxx to match login expectations

UPDATE public.chat_users 
SET phone = SUBSTRING(phone FROM 2) 
WHERE phone ~ '^09[0-9]{9}$';