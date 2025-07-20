-- Add country_code column to enrollments table
ALTER TABLE public.enrollments 
ADD COLUMN country_code text DEFAULT '+98';

-- Add country_code column to chat_users table if it doesn't exist (it already exists, so this will be skipped)
-- ALTER TABLE public.chat_users 
-- ADD COLUMN country_code text DEFAULT '+98';

-- Update existing enrollments to have default Iran country code
UPDATE public.enrollments 
SET country_code = '+98' 
WHERE country_code IS NULL;