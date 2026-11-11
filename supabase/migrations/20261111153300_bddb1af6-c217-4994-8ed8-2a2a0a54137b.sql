ALTER TABLE public.daftareshoma_sync_state
  ADD COLUMN IF NOT EXISTS backfill_date date,
  ADD COLUMN IF NOT EXISTS backfill_page integer NOT NULL DEFAULT 1;
UPDATE public.daftareshoma_sync_state SET backfill_date = (last_synced_at AT TIME ZONE 'UTC')::date - 1, backfill_page = 1 WHERE id = 1 AND backfill_date IS NULL;