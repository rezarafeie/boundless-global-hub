-- Split existing name field into first_name and last_name for users who don't have these fields populated
-- This updates users who have a name but missing first_name or last_name

UPDATE public.chat_users 
SET 
  first_name = CASE 
    WHEN position(' ' in trim(name)) > 0 THEN 
      trim(split_part(trim(name), ' ', 1))
    ELSE 
      trim(name)
  END,
  last_name = CASE 
    WHEN position(' ' in trim(name)) > 0 THEN 
      trim(substring(trim(name) from position(' ' in trim(name)) + 1))
    ELSE 
      ''
  END,
  full_name = COALESCE(full_name, trim(name))
WHERE 
  name IS NOT NULL 
  AND trim(name) != ''
  AND (first_name IS NULL OR trim(first_name) = '');