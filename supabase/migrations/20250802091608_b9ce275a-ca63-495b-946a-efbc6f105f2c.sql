-- Fix payment status inconsistencies for enrollments with successful Zarinpal payments
UPDATE public.enrollments 
SET 
  payment_status = 'completed',
  updated_at = now()
WHERE 
  zarinpal_ref_id IS NOT NULL 
  AND zarinpal_ref_id != '' 
  AND payment_status NOT IN ('completed', 'success')
  AND payment_method = 'zarinpal';

-- Log the fix
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % payment status inconsistencies', affected_count;
END $$;