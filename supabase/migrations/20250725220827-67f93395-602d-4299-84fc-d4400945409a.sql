-- Trigger the email function again with better error handling
UPDATE public.enrollments 
SET updated_at = now() 
WHERE id = 'ac0047a3-077a-43be-89e0-bdd22f77c487';