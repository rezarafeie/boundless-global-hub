-- Set country_code to +98 for all users where it's currently null
-- This assumes most users are Iranian since the app appears to be Iranian-focused

UPDATE public.chat_users 
SET country_code = '+98' 
WHERE country_code IS NULL;