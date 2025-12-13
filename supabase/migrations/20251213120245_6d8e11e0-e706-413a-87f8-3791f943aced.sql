-- Drop the old constraint
ALTER TABLE public.crm_notes DROP CONSTRAINT crm_notes_type_check;

-- Add new constraint with consultation types
ALTER TABLE public.crm_notes ADD CONSTRAINT crm_notes_type_check 
CHECK (type = ANY (ARRAY['note'::text, 'call'::text, 'message'::text, 'consultation'::text, 'education_consultation'::text]));