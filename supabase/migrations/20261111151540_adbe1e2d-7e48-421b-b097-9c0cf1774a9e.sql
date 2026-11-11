ALTER TABLE public.call_transcripts
  ADD COLUMN IF NOT EXISTS raw_transcript text,
  ADD COLUMN IF NOT EXISTS correction_model text,
  ADD COLUMN IF NOT EXISTS corrected_at timestamptz;