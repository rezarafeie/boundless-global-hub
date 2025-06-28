
-- Extend chat_users table with new fields for unified authentication
ALTER TABLE public.chat_users 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'website';

-- Add unique constraints
ALTER TABLE public.chat_users 
ADD CONSTRAINT chat_users_email_unique UNIQUE (email),
ADD CONSTRAINT chat_users_user_id_unique UNIQUE (user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_users_email ON public.chat_users (email);
CREATE INDEX IF NOT EXISTS idx_chat_users_user_id ON public.chat_users (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_users_phone ON public.chat_users (phone);

-- Function to generate unique 11-digit user ID
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 11-digit random number as string
    new_user_id := LPAD(FLOOR(RANDOM() * 100000000000)::TEXT, 11, '0');
    
    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM public.chat_users WHERE user_id = new_user_id) INTO id_exists;
    
    -- If ID doesn't exist, we can use it
    IF NOT id_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_user_id;
END;
$$;

-- Function to detect country code from phone number
CREATE OR REPLACE FUNCTION public.detect_country_code_from_phone(phone_number TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove any non-digit characters
  phone_number := REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g');
  
  -- Iranian numbers (starts with 98 or just 9)
  IF phone_number ~ '^(98|0098)' THEN
    RETURN '+98';
  END IF;
  
  -- If starts with 9 and 11 digits total, assume Iranian
  IF phone_number ~ '^9[0-9]{9}$' THEN
    RETURN '+98';
  END IF;
  
  -- If starts with 09 and 11 digits total, assume Iranian
  IF phone_number ~ '^09[0-9]{9}$' THEN
    RETURN '+98';
  END IF;
  
  -- Default to Iran for now, can be extended
  RETURN '+98';
END;
$$;

-- Function to validate Iranian phone numbers
CREATE OR REPLACE FUNCTION public.is_iranian_phone(phone_number TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove any non-digit characters
  phone_number := REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g');
  
  -- Check various Iranian phone number formats
  RETURN phone_number ~ '^(98|0098|0)?9[0-9]{9}$';
END;
$$;

-- Update existing users with generated user_ids where missing
UPDATE public.chat_users 
SET user_id = public.generate_unique_user_id(),
    full_name = name,
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
      WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
      THEN ARRAY_TO_STRING(ARRAY_REMOVE(STRING_TO_ARRAY(name, ' '), SPLIT_PART(name, ' ', 1)), ' ')
      ELSE ''
    END,
    country_code = public.detect_country_code_from_phone(phone),
    signup_source = 'messenger'
WHERE user_id IS NULL;
