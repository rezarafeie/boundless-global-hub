-- Set all deals status to "in_progress"

UPDATE public.deals 
SET status = 'in_progress', 
    updated_at = now()
WHERE status != 'in_progress';