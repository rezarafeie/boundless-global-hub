ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS require_coach_approval boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_messenger_activation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS coach_email text DEFAULT 'rezarafeie13@gmail.com';
ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;