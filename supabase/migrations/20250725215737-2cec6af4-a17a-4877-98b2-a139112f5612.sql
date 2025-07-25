-- Test the trigger by updating the enrollment
UPDATE public.enrollments 
SET updated_at = now(), admin_notes = 'Testing email trigger' 
WHERE id = 'c970d667-95a1-4dfe-a9a3-99f18796c2b4';