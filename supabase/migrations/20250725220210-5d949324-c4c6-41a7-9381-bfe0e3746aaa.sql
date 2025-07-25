-- Test the trigger by updating the specific enrollment
UPDATE public.enrollments 
SET updated_at = now() 
WHERE id = '4dc3339c-501c-4037-a86c-30756bd96e9f';