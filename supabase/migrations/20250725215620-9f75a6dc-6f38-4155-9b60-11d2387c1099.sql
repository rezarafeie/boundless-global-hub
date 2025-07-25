-- Test the trigger by updating the enrollment to trigger the email
UPDATE public.enrollments 
SET updated_at = now() 
WHERE id = 'c970d667-95a1-4dfe-a9a3-99f18796c2b4' 
AND payment_status IN ('completed', 'success');