-- Set all deals status to "در حال پیگیری" (in progress)

UPDATE public.deals 
SET status = 'در حال پیگیری', 
    updated_at = now()
WHERE status != 'در حال پیگیری';