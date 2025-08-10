-- Add new fields to discount_codes table for supporting both courses and tests
ALTER TABLE public.discount_codes ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'both' CHECK (discount_type IN ('course', 'test', 'both'));
ALTER TABLE public.discount_codes ADD COLUMN IF NOT EXISTS test_id uuid REFERENCES public.tests(id);

-- Update existing records to have 'course' type if they have course_id, 'both' if no specific target
UPDATE public.discount_codes 
SET discount_type = CASE 
  WHEN course_id IS NOT NULL THEN 'course'
  ELSE 'both'
END;