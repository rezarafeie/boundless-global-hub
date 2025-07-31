-- Update all enrollments with zarinpal_ref_id to success status
UPDATE public.enrollments 
SET 
  payment_status = 'success',
  updated_at = now()
WHERE 
  zarinpal_ref_id IS NOT NULL 
  AND zarinpal_ref_id != ''
  AND payment_status NOT IN ('success', 'completed');